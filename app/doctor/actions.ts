// app/doctor/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { buildInsert, buildUpdate, pgErrorCode } from "@/lib/sql-helpers";
import { requireDoctor } from "@/lib/auth-guards";
import { canEditCase } from "@/lib/cases";
import { slugify } from "@/lib/slugify";

function parseBlocks(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") || "").trim(),
    excerpt: String(formData.get("excerpt") || ""),
    direction_slug: String(formData.get("directionSlug") || "") || null,
    doctor_slug: String(formData.get("doctorSlug") || "") || null,
    cover_image: String(formData.get("coverImage") || "") || null,
    image_before: String(formData.get("imageBefore") || "") || null,
    image_after: String(formData.get("imageAfter") || "") || null,
    doctor_words: String(formData.get("doctorWords") || "") || null,
    content_blocks: parseBlocks(formData.get("contentBlocks")),
  };
}

/**
 * Дополняет поля кейса привязкой к врачу и снимком его имени.
 *
 * Привязка: если в форме врача поля выбора нет, doctor_slug приходит
 * пустым, и кейс сохраняется ничейным — не показывается ни на странице
 * врача на сайте, ни в его кабинете. Подставляем карточку автора.
 *
 * Снимок: клинический случай — самодостаточный документ, он должен
 * пережить удаление карточки врача и сохранить, кто был автором.
 * Если карточка не найдена, doctor_name в набор не попадает вовсе,
 * чтобы при обновлении не затереть ранее записанное имя.
 */
async function withDoctor(
  fields: ReturnType<typeof readFields>,
  fallbackDoctorSlug: string | null
): Promise<Record<string, unknown>> {
  const doctorSlug = fields.doctor_slug || fallbackDoctorSlug || null;
  if (!doctorSlug) return { ...fields, doctor_slug: null, doctor_name: null };

  const row = await queryOne<{ name: string }>(
    `select name from team_members where slug = $1`,
    [doctorSlug]
  );

  if (!row) return { ...fields, doctor_slug: doctorSlug };

  return { ...fields, doctor_slug: doctorSlug, doctor_name: row.name };
}

// Новый кейс от врача — на модерацию (published = false).
export async function createDoctorCase(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const user = await requireDoctor();

  const fields = readFields(formData);
  if (!fields.title) return { error: "Заголовок обязателен" };

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `case-${Date.now()}`;

  try {
    const data = await withDoctor(fields, user.doctorSlug);
    const { text, values } = buildInsert("cases", {
      slug,
      ...data,
      published: false,
      created_by: user.id,
    });
    await query(text, values);
  } catch (err) {
    if (pgErrorCode(err) === "23505")
      return { error: "Кейс с таким slug уже существует" };
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidatePath("/doctor");
  revalidatePath("/admin/cases");
  return { slug };
}

// Правка врачом своего кейса, пока он на модерации.
// Врач может править только СВОЙ и только неопубликованный кейс;
// опубликованный меняет сотрудник через админку.
export async function updateDoctorCase(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const user = await requireDoctor();

  const originalSlug = String(formData.get("originalSlug") || "");
  if (!originalSlug) return { error: "Не указан кейс для обновления" };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Заголовок обязателен" };

  const existing = await queryOne<{ published: boolean }>(
    `select published from cases where slug = $1`,
    [originalSlug]
  );
  if (!existing) return { error: "Кейс не найден" };

  // Владение: кейс мой, если я его создал ИЛИ он привязан к моей карточке
  // врача. Раньше проверялся только created_by, и врач не мог править
  // собственный кейс, заведённый администратором.
  const isOwner = await canEditCase(originalSlug, {
    id: user.id,
    role: user.role,
    doctorSlug: user.doctorSlug,
  });

  const canEdit = user.role === "admin" || (isOwner && !existing.published);
  if (!canEdit) {
    return { error: "Кейс уже опубликован или недоступен для правки" };
  }

  try {
    const data = await withDoctor(fields, user.doctorSlug);
    const { text, values } = buildUpdate("cases", data, "slug", originalSlug);
    await query(text, values);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidatePath("/doctor");
  revalidatePath("/admin/cases");
  revalidatePath(`/cases/${originalSlug}`);
  return { slug: originalSlug };
}
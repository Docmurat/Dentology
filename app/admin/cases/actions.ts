// app/admin/cases/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { buildInsert, buildUpdate, pgErrorCode } from "@/lib/sql-helpers";
import { requireStaff, requireAdmin } from "@/lib/auth-guards";
import { slugify } from "@/lib/slugify";

// Общий набор полей из формы (картинки приходят уже ссылками).
function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") || "").trim(),
    excerpt: String(formData.get("excerpt") || ""),
    direction_slug: String(formData.get("directionSlug") || "") || null,
    doctor_slug: String(formData.get("doctorSlug") || "") || null,
    cover_image: String(formData.get("coverImage") || "") || null,
    image_before: String(formData.get("imageBefore") || "") || null,
    image_after: String(formData.get("imageAfter") || "") || null,
    protocol_images: (formData.getAll("protocolImages") as string[]).filter(
      Boolean
    ),
    doctor_words: String(formData.get("doctorWords") || "") || null,
    content_blocks: parseBlocks(formData.get("contentBlocks")),
  };
}

function parseBlocks(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

/**
 * Дополняет поля кейса снимком имени врача.
 *
 * Клинический случай — самодостаточный документ: он должен пережить
 * удаление карточки врача и сохранить, кто был автором.
 *
 * Если карточка не найдена, doctor_name в набор не попадает вовсе: при
 * обновлении это сохранит ранее записанный снимок вместо того, чтобы
 * затереть его пустым значением.
 */
async function withDoctorName(
  fields: ReturnType<typeof readFields>
): Promise<Record<string, unknown>> {
  if (!fields.doctor_slug) return { ...fields, doctor_name: null };

  const row = await queryOne<{ name: string }>(
    `select name from team_members where slug = $1`,
    [fields.doctor_slug]
  );
  if (!row) return { ...fields };

  return { ...fields, doctor_name: row.name };
}

function revalidateCases(slug?: string) {
  revalidatePath("/cases");
  revalidatePath("/admin/cases");
  if (slug) revalidatePath(`/cases/${slug}`);
}

export async function createCase(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const user = await requireStaff();

  const fields = readFields(formData);
  if (!fields.title) return { error: "Заголовок обязателен" };

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `case-${Date.now()}`;

  // Кейс, созданный сотрудником, публикуется сразу.
  try {
    const data = await withDoctorName(fields);
    const { text, values } = buildInsert("cases", {
      slug,
      ...data,
      published: true,
      created_by: user.id,
    });
    await query(text, values);
  } catch (err) {
    if (pgErrorCode(err) === "23505")
      return { error: "Кейс с таким slug уже существует" };
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidateCases(slug);
  return { slug };
}

export async function updateCase(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  await requireStaff();

  const originalSlug = String(formData.get("originalSlug") || "");
  if (!originalSlug) return { error: "Не указан кейс для обновления" };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Заголовок обязателен" };

  // published не трогаем — статус публикации меняется только модерацией.
  try {
    const data = await withDoctorName(fields);
    const { text, values } = buildUpdate("cases", data, "slug", originalSlug);
    await query(text, values);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidateCases(originalSlug);
  return { slug: originalSlug };
}

// Модерация: опубликовать кейс (например, присланный врачом).
export async function approveCase(formData: FormData) {
  await requireStaff();
  const slug = String(formData.get("slug") || "");

  await query(`update cases set published = true where slug = $1`, [slug]);

  revalidateCases(slug);
}

// Архивация: кейс пропадает из списков и карты сайта, но остаётся
// доступен по прямой ссылке. Обратимо одним кликом.
export async function setCaseArchived(slug: string, archived: boolean) {
  await requireStaff();
  if (!slug) return;

  await query(`update cases set archived = $1 where slug = $2`, [
    archived,
    slug,
  ]);

  revalidateCases(slug);
}

export async function toggleCaseArchiveAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const archived = String(formData.get("archived") || "") === "true";
  await setCaseArchived(slug, archived);
}

// Удаление кейса — только администратор и только из архива.
// Проверка в разметке ненадёжна: форму можно отправить в обход кнопки,
// поэтому условие дублируется здесь.
export async function deleteCase(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  const row = await queryOne<{ archived: boolean | null }>(
    `select archived from cases where slug = $1`,
    [slug]
  );
  if (!row) return;
  if (!row.archived) {
    console.warn(`deleteCase: попытка удалить неархивный кейс ${slug}`);
    return;
  }

  await query(`delete from cases where slug = $1`, [slug]);
  revalidateCases(slug);
}
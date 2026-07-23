"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
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
    const { text, values } = buildInsert("cases", {
      slug,
      ...fields,
      published: true,
      created_by: user.id,
    });
    await query(text, values);
  } catch (err) {
    if (pgErrorCode(err) === "23505")
      return { error: "Кейс с таким slug уже существует" };
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidatePath("/cases");
  revalidatePath(`/cases/${slug}`);
  revalidatePath("/admin/cases");
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
    const { text, values } = buildUpdate("cases", fields, "slug", originalSlug);
    await query(text, values);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidatePath("/cases");
  revalidatePath(`/cases/${originalSlug}`);
  revalidatePath("/admin/cases");
  return { slug: originalSlug };
}

// Модерация: опубликовать кейс (например, присланный врачом).
export async function approveCase(formData: FormData) {
  await requireStaff();
  const slug = String(formData.get("slug") || "");

  await query(`update cases set published = true where slug = $1`, [slug]);

  revalidatePath("/cases");
  revalidatePath(`/cases/${slug}`);
  revalidatePath("/admin/cases");
}

// Удаление кейса — только администратор (раньше это задавала RLS-политика).
export async function deleteCase(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") || "");

  await query(`delete from cases where slug = $1`, [slug]);

  revalidatePath("/cases");
  revalidatePath("/admin/cases");
}
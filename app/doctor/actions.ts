"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { buildInsert, buildUpdate, pgErrorCode } from "@/lib/sql-helpers";
import { requireDoctor } from "@/lib/auth-guards";
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
    const { text, values } = buildInsert("cases", {
      slug,
      ...fields,
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
// Раньше ограничение задавала RLS — теперь проверяем в коде:
// врач может править только СВОЙ и только неопубликованный кейс.
export async function updateDoctorCase(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const user = await requireDoctor();

  const originalSlug = String(formData.get("originalSlug") || "");
  if (!originalSlug) return { error: "Не указан кейс для обновления" };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Заголовок обязателен" };

  const existing = await queryOne<{ created_by: string | null; published: boolean }>(
    `select created_by, published from cases where slug = $1`,
    [originalSlug]
  );
  if (!existing) return { error: "Кейс не найден" };

  const isOwner = existing.created_by === user.id;
  const canEdit = user.role === "admin" || (isOwner && !existing.published);
  if (!canEdit) {
    return { error: "Кейс уже опубликован или недоступен для правки" };
  }

  try {
    const { text, values } = buildUpdate("cases", fields, "slug", originalSlug);
    await query(text, values);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidatePath("/doctor");
  revalidatePath("/admin/cases");
  return { slug: originalSlug };
}
"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { buildUpdate } from "@/lib/sql-helpers";
import { requireStaff, requireAdmin } from "@/lib/auth-guards";

type Result = { error?: string; ok?: boolean };

function normalizeInstagram(value: string): string | null {
  const s = value.trim().replace(/^@/, "");
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://www.instagram.com/${s}`;
}

function revalidateReviews() {
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}

// Курс-отзыв определяется по course_slug в БД, а не по полям формы.
async function isCourseReview(id: string): Promise<boolean> {
  const row = await queryOne<{ course_slug: string | null }>(
    `select course_slug from reviews where id = $1`,
    [id]
  );
  return Boolean(row?.course_slug);
}

export async function approveReview(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") || "");
  const dirs = formData
    .getAll("directionSlug")
    .map(String)
    .filter(Boolean)
    .slice(0, 3);

  const isCourse = await isCourseReview(id);

  // Пациентский отзыв без направления не публикуется.
  // Курс-отзыв публикуется без направлений.
  if (!isCourse && !dirs.length) return;

  await query(
    `update reviews set status = 'approved', direction_slugs = $1 where id = $2`,
    [isCourse ? [] : dirs, id]
  );
  revalidateReviews();
}

export async function rejectReview(formData: FormData) {
  await requireStaff();
  await query(`update reviews set status = 'rejected' where id = $1`, [
    String(formData.get("id") || ""),
  ]);
  revalidateReviews();
}

export async function unpublishReview(formData: FormData) {
  await requireStaff();
  await query(`update reviews set status = 'pending' where id = $1`, [
    String(formData.get("id") || ""),
  ]);
  revalidateReviews();
}

// Удаление отзыва — только администратор.
export async function deleteReview(formData: FormData) {
  await requireAdmin();
  await query(`delete from reviews where id = $1`, [
    String(formData.get("id") || ""),
  ]);
  revalidateReviews();
}

export async function setReviewVerified(formData: FormData) {
  await requireStaff();
  await query(`update reviews set verified = $1 where id = $2`, [
    String(formData.get("verified") || "") === "true",
    String(formData.get("id") || ""),
  ]);
  revalidateReviews();
}

export async function setReviewImage(formData: FormData) {
  await requireStaff();
  await query(`update reviews set image = $1 where id = $2`, [
    String(formData.get("url") || "") || null,
    String(formData.get("id") || ""),
  ]);
  revalidateReviews();
}

export async function updateReview(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  try {
    await requireStaff();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }

  const id = String(formData.get("id") || "");
  const author = String(formData.get("author") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const reviewDate = String(formData.get("reviewDate") || "") || null;
  const instagram = normalizeInstagram(String(formData.get("instagram") || ""));
  const doctorSlug = String(formData.get("doctorSlug") || "") || null;
  const dirs = formData
    .getAll("directionSlug")
    .map(String)
    .filter(Boolean)
    .slice(0, 3);

  const sortRaw = String(formData.get("sortOrder") || "").trim();
  const parsed = sortRaw ? Number.parseInt(sortRaw, 10) : null;
  const sortOrder = parsed !== null && !Number.isNaN(parsed) ? parsed : null;

  const isCourse = await isCourseReview(id);

  if (!author) return { error: "Укажите имя" };
  if (text.length < 5) return { error: "Текст слишком короткий" };
  if (!isCourse && !dirs.length)
    return { error: "Выберите хотя бы одно направление" };

  // Освобождаем номер у другого отзыва, если он уже занят (номер уникален).
  if (sortOrder !== null) {
    await query(
      `update reviews set sort_order = null where sort_order = $1 and id <> $2`,
      [sortOrder, id]
    );
  }

  const patch: Record<string, unknown> = {
    author,
    text,
    direction_slugs: isCourse ? [] : dirs,
    instagram,
    doctor_slug: doctorSlug,
    sort_order: sortOrder,
  };
  if (reviewDate) patch.review_date = reviewDate;

  // Разделы курс-отзыва — только для курс-отзыва.
  if (isCourse) {
    const trimOrNull = (v: string) => v.trim() || null;
    patch.pros = trimOrNull(String(formData.get("pros") || ""));
    patch.cons = trimOrNull(String(formData.get("cons") || ""));
    patch.wishes = trimOrNull(String(formData.get("wishes") || ""));
  }

  try {
    const q = buildUpdate("reviews", patch, "id", id);
    await query(q.text, q.values);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidateReviews();
  return { ok: true };
}
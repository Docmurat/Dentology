// app/admin/reviews/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { buildUpdate } from "@/lib/sql-helpers";
import {
  requireStaff,
  requireAdmin,
  requireModerator,
  getCurrentUser,
  isStaff,
  canModerate,
} from "@/lib/auth-guards";

type Result = { error?: string; ok?: boolean };

function normalizeInstagram(value: string): string | null {
  const s = value.trim().replace(/^@/, "");
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://www.instagram.com/${s}`;
}

function revalidateReviews() {
  revalidatePath("/admin/reviews");
  revalidatePath("/moderator/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}

/**
 * Право на правку конкретного отзыва.
 *
 * Сотрудник правит любой. Модератор — только неопубликованный: то, что
 * уже висит на сайте, менять должен тот, кто отвечает за содержание,
 * иначе текст на публичной странице может тихо измениться.
 */
async function requireReviewEditor(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Не авторизован");
  if (isStaff(user)) return user;
  if (!canModerate(user)) throw new Error("Недостаточно прав");

  const row = await queryOne<{ status: string }>(
    `select status from reviews where id = $1`,
    [id]
  );
  if (!row) throw new Error("Отзыв не найден");
  if (row.status === "approved") {
    throw new Error(
      "Опубликованный отзыв меняет сотрудник. Снимите с публикации или обратитесь к администратору."
    );
  }

  return user;
}

// Курс-отзыв определяется по course_slug в БД, а не по полям формы.
async function isCourseReview(id: string): Promise<boolean> {
  const row = await queryOne<{ course_slug: string | null }>(
    `select course_slug from reviews where id = $1`,
    [id]
  );
  return Boolean(row?.course_slug);
}

// Публикация, отклонение и снятие с публикации — работа модератора.
export async function approveReview(formData: FormData) {
  await requireModerator();
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
  await requireModerator();
  await query(`update reviews set status = 'rejected' where id = $1`, [
    String(formData.get("id") || ""),
  ]);
  revalidateReviews();
}

export async function unpublishReview(formData: FormData) {
  await requireModerator();
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
  await requireModerator();
  await query(`update reviews set verified = $1 where id = $2`, [
    String(formData.get("verified") || "") === "true",
    String(formData.get("id") || ""),
  ]);
  revalidateReviews();
}

export async function setReviewImage(formData: FormData) {
  const id = String(formData.get("id") || "");
  await requireReviewEditor(id);

  await query(`update reviews set image = $1 where id = $2`, [
    String(formData.get("url") || "") || null,
    id,
  ]);
  revalidateReviews();
}

export async function updateReview(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  const id = String(formData.get("id") || "");

  try {
    await requireReviewEditor(id);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }

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
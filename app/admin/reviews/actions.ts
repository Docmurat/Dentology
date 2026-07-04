"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type Result = { error?: string; ok?: boolean };

function normalizeInstagram(value: string): string | null {
  const s = value.trim().replace(/^@/, "");
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://www.instagram.com/${s}`;
}

async function requireStaff() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизован");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    throw new Error("Недостаточно прав");
  }
  return supabase;
}

function revalidateReviews() {
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  revalidatePath("/");
}

// Курс-отзыв определяется по course_slug в БД, а не по полям формы.
async function isCourseReview(
  supabase: Awaited<ReturnType<typeof requireStaff>>,
  id: string
): Promise<boolean> {
  const { data } = await supabase
    .from("reviews")
    .select("course_slug")
    .eq("id", id)
    .maybeSingle();
  return Boolean(data?.course_slug);
}

export async function approveReview(formData: FormData) {
  const supabase = await requireStaff();
  const id = String(formData.get("id") || "");
  const dirs = formData
    .getAll("directionSlug")
    .map(String)
    .filter(Boolean)
    .slice(0, 3);

  const isCourse = await isCourseReview(supabase, id);

  // Пациентский отзыв без направления не публикуется.
  // Курс-отзыв публикуется без направлений.
  if (!isCourse && !dirs.length) return;

  await supabase
    .from("reviews")
    .update({ status: "approved", direction_slugs: isCourse ? [] : dirs })
    .eq("id", id);
  revalidateReviews();
}

export async function rejectReview(formData: FormData) {
  const supabase = await requireStaff();
  await supabase
    .from("reviews")
    .update({ status: "rejected" })
    .eq("id", String(formData.get("id") || ""));
  revalidateReviews();
}

export async function unpublishReview(formData: FormData) {
  const supabase = await requireStaff();
  await supabase
    .from("reviews")
    .update({ status: "pending" })
    .eq("id", String(formData.get("id") || ""));
  revalidateReviews();
}

export async function deleteReview(formData: FormData) {
  const supabase = await requireStaff();
  await supabase
    .from("reviews")
    .delete()
    .eq("id", String(formData.get("id") || ""));
  revalidateReviews();
}

export async function setReviewVerified(formData: FormData) {
  const supabase = await requireStaff();
  await supabase
    .from("reviews")
    .update({ verified: String(formData.get("verified") || "") === "true" })
    .eq("id", String(formData.get("id") || ""));
  revalidateReviews();
}

export async function setReviewImage(formData: FormData) {
  const supabase = await requireStaff();
  await supabase
    .from("reviews")
    .update({ image: String(formData.get("url") || "") || null })
    .eq("id", String(formData.get("id") || ""));
  revalidateReviews();
}

export async function updateReview(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  let supabase;
  try {
    supabase = await requireStaff();
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

  const isCourse = await isCourseReview(supabase, id);

  if (!author) return { error: "Укажите имя" };
  if (text.length < 5) return { error: "Текст слишком короткий" };
  // Направление обязательно только для пациентских отзывов.
  if (!isCourse && !dirs.length)
    return { error: "Выберите хотя бы одно направление" };

  // Освобождаем номер у другого отзыва, если он уже занят (номер уникален).
  if (sortOrder !== null) {
    await supabase
      .from("reviews")
      .update({ sort_order: null })
      .eq("sort_order", sortOrder)
      .neq("id", id);
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

  // Разделы курс-отзыва — сохраняем как есть (trim), только для курс-отзыва.
  if (isCourse) {
    const trimOrNull = (v: string) => v.trim() || null;
    patch.pros = trimOrNull(String(formData.get("pros") || ""));
    patch.cons = trimOrNull(String(formData.get("cons") || ""));
    patch.wishes = trimOrNull(String(formData.get("wishes") || ""));
  }

  const { error } = await supabase.from("reviews").update(patch).eq("id", id);
  if (error) return { error: error.message };

  revalidateReviews();
  return { ok: true };
}
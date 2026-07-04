"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { getCourseBySlug } from "@/lib/courses";

type Result = { error?: string; ok?: boolean };

function normalizeInstagram(value: string): string | null {
  const s = value.trim().replace(/^@/, "");
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  return `https://www.instagram.com/${s}`;
}

export async function submitReview(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  if (String(formData.get("company") || "").trim()) {
    return { ok: true };
  }

  const author = String(formData.get("author") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const doctorSlug = String(formData.get("doctorSlug") || "") || null;
  const courseSlug = String(formData.get("courseSlug") || "") || null;
  const instagram = normalizeInstagram(String(formData.get("instagram") || ""));

  // Разделы курс-отзыва (по пункту в строке). Только для курс-отзыва.
  const trimOrNull = (v: string) => v.trim() || null;
  const pros = courseSlug ? trimOrNull(String(formData.get("pros") || "")) : null;
  const cons = courseSlug ? trimOrNull(String(formData.get("cons") || "")) : null;
  const wishes = courseSlug
    ? trimOrNull(String(formData.get("wishes") || ""))
    : null;

  // Курс-отзыв: фиксируем слепок — ведущего врача и название курса.
  // Так отзыв остаётся полноценным даже после удаления курса.
  let courseTitle: string | null = null;
  let courseDoctorSlug: string | null = null;
  if (courseSlug) {
    const course = await getCourseBySlug(courseSlug);
    if (course) {
      courseTitle = course.title;
      courseDoctorSlug = course.doctorSlug;
    }
  }
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!author) return { error: "Укажите фамилию и имя" };
  if (!phone) return { error: "Укажите телефон" };
  if (text.length < 20)
    return { error: "Отзыв слишком короткий (минимум 20 символов)" };
  if (text.length > 4000) return { error: "Отзыв слишком длинный" };

  const id = crypto.randomUUID();

  // Необязательное фото посетителя -> в бакет через сервис-роль.
  let image: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/"))
      return { error: "Фото должно быть изображением" };
    if (photo.size > 5 * 1024 * 1024)
      return { error: "Фото слишком большое (до 5 МБ)" };
    try {
      const admin = createAdminClient();
      const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${id}/visitor-${Date.now()}.${ext}`;
      const { error: upErr } = await admin.storage
        .from("review-images")
        .upload(path, photo, { contentType: photo.type, upsert: true });
      if (!upErr) {
        const { data } = admin.storage
          .from("review-images")
          .getPublicUrl(path);
        image = data.publicUrl;
      }
    } catch {
      // если фото не загрузилось — отзыв всё равно отправляем без него
    }
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reviews").insert({
    id,
    author,
    text,
    doctor_slug: courseSlug ? courseDoctorSlug : doctorSlug,
    course_slug: courseSlug,
    course_title: courseTitle,
    pros,
    cons,
    wishes,
    instagram,
    image,
    status: "pending",
    verified: false,
  });
  if (error) {
    return { error: "Не удалось отправить отзыв. Попробуйте позже." };
  }

  if (phone) {
    await supabase.from("review_contacts").insert({ review_id: id, phone });
  }

  revalidatePath("/admin/reviews");
  return { ok: true };
}
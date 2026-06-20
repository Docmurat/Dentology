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
  const instagram = normalizeInstagram(String(formData.get("instagram") || ""));
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!author) return { error: "Укажите фамилию и имя" };
  if (!phone) return { error: "Укажите телефон" };
  if (text.length < 20)
    return { error: "Отзыв слишком короткий (минимум 20 символов)" };
  if (text.length > 4000) return { error: "Отзыв слишком длинный" };

  const id = crypto.randomUUID();
  const supabase = await createClient();

  const { error } = await supabase.from("reviews").insert({
    id,
    author,
    text,
    doctor_slug: doctorSlug,
    instagram,
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
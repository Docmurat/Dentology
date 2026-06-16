"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { slugify } from "@/lib/slugify";

async function requireDoctor() {
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

  if (!profile || !["doctor", "admin"].includes(profile.role)) {
    throw new Error("Недостаточно прав");
  }
  return { supabase, user };
}

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
  const { supabase, user } = await requireDoctor();

  const fields = readFields(formData);
  if (!fields.title) return { error: "Заголовок обязателен" };

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `case-${Date.now()}`;

  const { error } = await supabase
    .from("cases")
    .insert({ slug, ...fields, published: false, created_by: user.id });

  if (error) {
    if (error.code === "23505")
      return { error: "Кейс с таким slug уже существует" };
    return { error: error.message };
  }

  revalidatePath("/doctor");
  revalidatePath("/admin/cases");
  return { slug };
}

// Правка врачом своего кейса, пока он на модерации.
// RLS не даст обновить опубликованный или чужой кейс.
export async function updateDoctorCase(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const { supabase } = await requireDoctor();

  const originalSlug = String(formData.get("originalSlug") || "");
  if (!originalSlug) return { error: "Не указан кейс для обновления" };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Заголовок обязателен" };

  const { error } = await supabase
    .from("cases")
    .update(fields)
    .eq("slug", originalSlug)
    .eq("published", false);

  if (error) return { error: error.message };

  revalidatePath("/doctor");
  revalidatePath("/admin/cases");
  return { slug: originalSlug };
}

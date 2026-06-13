"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { slugify } from "@/lib/slugify";

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
  return { supabase, user };
}

// Общий набор полей из формы (картинки приходят уже ссылками).
function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") || "").trim(),
    excerpt: String(formData.get("excerpt") || ""),
    category: String(formData.get("category") || "") || null,
    direction_slug: String(formData.get("directionSlug") || "") || null,
    status: String(formData.get("status") || "") || null,
    doctor_slug: String(formData.get("doctorSlug") || "") || null,
    cover_image: String(formData.get("coverImage") || "") || null,
    image_before: String(formData.get("imageBefore") || "") || null,
    image_after: String(formData.get("imageAfter") || "") || null,
    protocol_images: (formData.getAll("protocolImages") as string[]).filter(
      Boolean
    ),
    situation: String(formData.get("situation") || ""),
    diagnostics: String(formData.get("diagnostics") || "") || null,
    decision: String(formData.get("decision") || "") || null,
    result: String(formData.get("result") || "") || null,
  };
}

export async function createCase(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const { supabase, user } = await requireStaff();

  const fields = readFields(formData);
  if (!fields.title) return { error: "Заголовок обязателен" };

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `case-${Date.now()}`;

  const { error } = await supabase
    .from("cases")
    .insert({ slug, ...fields, created_by: user.id });

  if (error) {
    if (error.code === "23505")
      return { error: "Кейс с таким slug уже существует" };
    return { error: error.message };
  }

  revalidatePath("/cases");
  revalidatePath(`/cases/${slug}`);
  revalidatePath("/admin/cases");
  return { slug };
}

export async function updateCase(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const { supabase } = await requireStaff();

  const originalSlug = String(formData.get("originalSlug") || "");
  if (!originalSlug) return { error: "Не указан кейс для обновления" };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Заголовок обязателен" };

  const { error } = await supabase
    .from("cases")
    .update(fields)
    .eq("slug", originalSlug);

  if (error) return { error: error.message };

  revalidatePath("/cases");
  revalidatePath(`/cases/${originalSlug}`);
  revalidatePath("/admin/cases");
  return { slug: originalSlug };
}

export async function deleteCase(formData: FormData) {
  const { supabase } = await requireStaff();
  const slug = String(formData.get("slug") || "");

  const { error } = await supabase.from("cases").delete().eq("slug", slug);
  if (error) throw error;

  revalidatePath("/cases");
  revalidatePath("/admin/cases");
}

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
  return supabase;
}

function readFields(formData: FormData) {
  return {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    doctor_slug: String(formData.get("doctorSlug") || "") || null,
    metric_treated: String(formData.get("metricTreated") || "").trim() || null,
    metric_radical: Number(formData.get("metricRadical") || 0) || 0,
    published: formData.get("published") === "on",
    sort_order: Number(formData.get("sortOrder") || 0) || 0,
  };
}

function revalidateCourses(slug?: string) {
  revalidatePath("/education");
  revalidatePath("/admin/education");
  if (slug) revalidatePath(`/education/${slug}`);
}

export async function createCourse(formData: FormData) {
  const supabase = await requireStaff();
  const fields = readFields(formData);
  if (!fields.title) return;

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `course-${Date.now()}`;

  await supabase.from("courses").insert({ slug, ...fields });
  revalidateCourses(slug);
}

export async function updateCourse(formData: FormData) {
  const supabase = await requireStaff();
  const slug = String(formData.get("originalSlug") || "");
  if (!slug) return;

  const fields = readFields(formData);
  if (!fields.title) return;

  await supabase.from("courses").update(fields).eq("slug", slug);
  revalidateCourses(slug);
}

export async function deleteCourse(formData: FormData) {
  const supabase = await requireStaff();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  await supabase.from("courses").delete().eq("slug", slug);
  revalidateCourses(slug);
}
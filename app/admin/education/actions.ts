"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { slugify } from "@/lib/slugify";
import { readCourseFields } from "@/lib/course-fields";

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

function revalidateCourses(slug?: string) {
  revalidatePath("/education");
  revalidatePath("/admin/education");
  if (slug) revalidatePath(`/education/${slug}`);
}

export async function createCourse(formData: FormData) {
  const supabase = await requireStaff();
  const fields = readCourseFields(formData);
  if (!fields.title) return;

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `course-${Date.now()}`;

  const { error } = await supabase.from("courses").insert({ slug, ...fields });
  if (error) console.error("createCourse error:", error.message);
  revalidateCourses(slug);
}

export async function updateCourse(formData: FormData) {
  const supabase = await requireStaff();
  const slug = String(formData.get("originalSlug") || "");
  if (!slug) return;

  const fields = readCourseFields(formData);
  if (!fields.title) return;

  const { error } = await supabase
    .from("courses")
    .update(fields)
    .eq("slug", slug);
  if (error) console.error("updateCourse error:", error.message);
  revalidateCourses(slug);
}

export async function setCourseArchived(slug: string, archived: boolean) {
  const supabase = await requireStaff();
  if (!slug) return;
  const { error } = await supabase
    .from("courses")
    .update({ archived })
    .eq("slug", slug);
  if (error) console.error("setCourseArchived error:", error.message);
  revalidateCourses(slug);
}

export async function toggleArchiveAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const archived = String(formData.get("archived") || "") === "true";
  await setCourseArchived(slug, archived);
}

export async function deleteCourse(formData: FormData) {
  const supabase = await requireStaff();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  await supabase.from("courses").delete().eq("slug", slug);
  revalidateCourses(slug);
}
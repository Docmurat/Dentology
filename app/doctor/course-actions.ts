"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { slugify } from "@/lib/slugify";
import { readCourseFields } from "@/lib/course-fields";

// Доступ: сотрудник ИЛИ спикер (его карточка команды is_speaker).
async function requireSpeaker() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизован");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, doctor_slug")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) throw new Error("Нет профиля");

  if (["admin", "editor"].includes(profile.role)) {
    return { supabase, user };
  }
  if (!profile.doctor_slug) throw new Error("Недостаточно прав");

  const { data: card } = await supabase
    .from("team_members")
    .select("is_speaker")
    .eq("slug", profile.doctor_slug)
    .maybeSingle();
  if (!card?.is_speaker) throw new Error("Недостаточно прав");

  return { supabase, user };
}

function revalidate(slug?: string) {
  revalidatePath("/doctor/courses");
  revalidatePath("/education");
  revalidatePath("/admin/education");
  if (slug) revalidatePath(`/education/${slug}`);
}

export async function createSpeakerCourse(formData: FormData) {
  const { supabase, user } = await requireSpeaker();
  const fields = readCourseFields(formData);
  if (!fields.title) return;

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `course-${Date.now()}`;

  const { error } = await supabase
    .from("courses")
    .insert({ slug, ...fields, created_by: user.id });
  if (error) console.error("createSpeakerCourse:", error.message);
  revalidate(slug);
}

export async function updateSpeakerCourse(formData: FormData) {
  const { supabase } = await requireSpeaker();
  const slug = String(formData.get("originalSlug") || "");
  if (!slug) return;

  const fields = readCourseFields(formData);
  if (!fields.title) return;

  // RLS не даст обновить чужой курс.
  const { error } = await supabase
    .from("courses")
    .update(fields)
    .eq("slug", slug);
  if (error) console.error("updateSpeakerCourse:", error.message);
  revalidate(slug);
}
"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { buildInsert, buildUpdate } from "@/lib/sql-helpers";
import { getCurrentUser, type SessionUser } from "@/lib/auth-guards";
import { slugify } from "@/lib/slugify";
import { readCourseFields } from "@/lib/course-fields";

// Доступ: сотрудник ИЛИ спикер (его карточка команды помечена is_speaker).
async function requireSpeaker(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Не авторизован");

  if (["admin", "editor"].includes(user.role)) return user;
  if (!user.doctorSlug) throw new Error("Недостаточно прав");

  const card = await queryOne<{ is_speaker: boolean }>(
    `select is_speaker from team_members where slug = $1`,
    [user.doctorSlug]
  );
  if (!card?.is_speaker) throw new Error("Недостаточно прав");

  return user;
}

function revalidate(slug?: string) {
  revalidatePath("/doctor/courses");
  revalidatePath("/education");
  revalidatePath("/admin/education");
  if (slug) revalidatePath(`/education/${slug}`);
}

export async function createSpeakerCourse(formData: FormData) {
  const user = await requireSpeaker();
  const fields = readCourseFields(formData);
  if (!fields.title) return;

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `course-${Date.now()}`;

  try {
    const { text, values } = buildInsert("courses", {
      slug,
      ...fields,
      created_by: user.id,
    });
    await query(text, values);
  } catch (err) {
    console.error(
      "createSpeakerCourse:",
      err instanceof Error ? err.message : err
    );
  }
  revalidate(slug);
}

export async function updateSpeakerCourse(formData: FormData) {
  const user = await requireSpeaker();
  const slug = String(formData.get("originalSlug") || "");
  if (!slug) return;

  const fields = readCourseFields(formData);
  if (!fields.title) return;

  // Раньше чужой курс не давала обновить RLS — теперь проверяем в коде:
  // сотрудник правит любой курс, спикер — только свой.
  const isStaff = ["admin", "editor"].includes(user.role);
  if (!isStaff) {
    const owner = await queryOne<{ created_by: string | null }>(
      `select created_by from courses where slug = $1`,
      [slug]
    );
    if (!owner || owner.created_by !== user.id) {
      console.error("updateSpeakerCourse: попытка правки чужого курса");
      return;
    }
  }

  try {
    const { text, values } = buildUpdate("courses", fields, "slug", slug);
    await query(text, values);
  } catch (err) {
    console.error(
      "updateSpeakerCourse:",
      err instanceof Error ? err.message : err
    );
  }
  revalidate(slug);
}
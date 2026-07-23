"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { buildInsert, buildUpdate } from "@/lib/sql-helpers";
import { requireStaff, requireAdmin } from "@/lib/auth-guards";
import { slugify } from "@/lib/slugify";
import { readCourseFields } from "@/lib/course-fields";

function revalidateCourses(slug?: string) {
  revalidatePath("/education");
  revalidatePath("/admin/education");
  if (slug) revalidatePath(`/education/${slug}`);
}

export async function createCourse(formData: FormData) {
  const user = await requireStaff();
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
      "createCourse error:",
      err instanceof Error ? err.message : err
    );
  }
  revalidateCourses(slug);
}

export async function updateCourse(formData: FormData) {
  await requireStaff();
  const slug = String(formData.get("originalSlug") || "");
  if (!slug) return;

  const fields = readCourseFields(formData);
  if (!fields.title) return;

  try {
    const { text, values } = buildUpdate("courses", fields, "slug", slug);
    await query(text, values);
  } catch (err) {
    console.error(
      "updateCourse error:",
      err instanceof Error ? err.message : err
    );
  }
  revalidateCourses(slug);
}

export async function setCourseArchived(slug: string, archived: boolean) {
  await requireStaff();
  if (!slug) return;
  try {
    await query(`update courses set archived = $1 where slug = $2`, [
      archived,
      slug,
    ]);
  } catch (err) {
    console.error(
      "setCourseArchived error:",
      err instanceof Error ? err.message : err
    );
  }
  revalidateCourses(slug);
}

export async function toggleArchiveAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const archived = String(formData.get("archived") || "") === "true";
  await setCourseArchived(slug, archived);
}

// Удаление курса — только администратор.
export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  await query(`delete from courses where slug = $1`, [slug]);
  revalidateCourses(slug);
}
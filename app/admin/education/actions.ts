// app/admin/education/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { buildInsert, buildUpdate } from "@/lib/sql-helpers";
import { requireStaff, requireAdmin } from "@/lib/auth-guards";
import { slugify } from "@/lib/slugify";
import { readCourseFields } from "@/lib/course-fields";

// Результат экшена для формы: пусто — успех, { error } — показать сообщение.
type Result = { error?: string };

function errText(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

/**
 * Дополняет поля курса снимком имени спикера.
 *
 * Курс должен пережить удаление карточки врача и сохранить, кто его вёл —
 * тот же приём, что с course_title в отзывах. Имени в форме нет, есть
 * только слаг, поэтому добираем его отдельным запросом.
 *
 * Если карточка не найдена, doctor_name в набор не попадает вовсе: при
 * обновлении это сохранит ранее записанный снимок вместо того, чтобы
 * затереть его пустым значением.
 */
async function withDoctorName(
  fields: ReturnType<typeof readCourseFields>
): Promise<Record<string, unknown>> {
  if (!fields.doctor_slug) return { ...fields, doctor_name: null };

  const row = await queryOne<{ name: string }>(
    `select name from team_members where slug = $1`,
    [fields.doctor_slug]
  );
  if (!row) return { ...fields };

  return { ...fields, doctor_name: row.name };
}

function revalidateCourses(slug?: string) {
  revalidatePath("/education");
  revalidatePath("/admin/education");
  if (slug) revalidatePath(`/education/${slug}`);
}

export async function createCourse(formData: FormData): Promise<Result> {
  let userId: string;
  try {
    userId = (await requireStaff()).id;
  } catch (err) {
    return { error: errText(err, "Недостаточно прав") };
  }

  const fields = readCourseFields(formData);
  if (!fields.title) return { error: "Укажите название курса" };

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `course-${Date.now()}`;

  try {
    const data = await withDoctorName(fields);
    const { text, values } = buildInsert("courses", {
      slug,
      ...data,
      created_by: userId,
    });
    await query(text, values);
  } catch (err) {
    console.error("createCourse error:", err);
    // 23505 — нарушение уникальности: такой адрес уже занят.
    if ((err as { code?: string })?.code === "23505") {
      return { error: `Курс с адресом «${slug}» уже существует` };
    }
    return { error: errText(err, "Не удалось создать курс") };
  }

  revalidateCourses(slug);
  return {};
}

export async function updateCourse(formData: FormData): Promise<Result> {
  try {
    await requireStaff();
  } catch (err) {
    return { error: errText(err, "Недостаточно прав") };
  }

  const slug = String(formData.get("originalSlug") || "");
  if (!slug) return { error: "Не указан курс для обновления" };

  const fields = readCourseFields(formData);
  if (!fields.title) return { error: "Укажите название курса" };

  try {
    const data = await withDoctorName(fields);
    const { text, values } = buildUpdate("courses", data, "slug", slug);
    await query(text, values);
  } catch (err) {
    console.error("updateCourse error:", err);
    return { error: errText(err, "Не удалось сохранить курс") };
  }

  revalidateCourses(slug);
  return {};
}

export async function setCourseArchived(
  slug: string,
  archived: boolean
): Promise<Result> {
  try {
    await requireStaff();
  } catch (err) {
    return { error: errText(err, "Недостаточно прав") };
  }
  if (!slug) return { error: "Не указан курс" };

  try {
    await query(`update courses set archived = $1 where slug = $2`, [
      archived,
      slug,
    ]);
  } catch (err) {
    console.error("setCourseArchived error:", err);
    return { error: errText(err, "Не удалось изменить статус архива") };
  }

  revalidateCourses(slug);
  return {};
}

export async function toggleArchiveAction(formData: FormData) {
  const slug = String(formData.get("slug") || "");
  const archived = String(formData.get("archived") || "") === "true";
  await setCourseArchived(slug, archived);
}

// Удаление курса — только администратор и только из архива.
// Проверка в разметке ненадёжна: форму можно отправить в обход кнопки,
// поэтому условие дублируется здесь.
export async function deleteCourse(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  const row = await queryOne<{ archived: boolean | null }>(
    `select archived from courses where slug = $1`,
    [slug]
  );
  if (!row) return;
  if (!row.archived) {
    console.warn(`deleteCourse: попытка удалить неархивный курс ${slug}`);
    return;
  }

  await query(`delete from courses where slug = $1`, [slug]);
  revalidateCourses(slug);
}
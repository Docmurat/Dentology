// app/doctor/course-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { buildInsert, buildUpdate } from "@/lib/sql-helpers";
import { getCurrentUser, type SessionUser } from "@/lib/auth-guards";
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

export async function createSpeakerCourse(
  formData: FormData
): Promise<Result> {
  let user: SessionUser;
  try {
    user = await requireSpeaker();
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
      created_by: user.id,
    });
    await query(text, values);
  } catch (err) {
    console.error("createSpeakerCourse:", err);
    // 23505 — нарушение уникальности: такой адрес уже занят.
    if ((err as { code?: string })?.code === "23505") {
      return { error: `Курс с адресом «${slug}» уже существует` };
    }
    return { error: errText(err, "Не удалось создать курс") };
  }

  revalidate(slug);
  return {};
}

export async function updateSpeakerCourse(
  formData: FormData
): Promise<Result> {
  let user: SessionUser;
  try {
    user = await requireSpeaker();
  } catch (err) {
    return { error: errText(err, "Недостаточно прав") };
  }

  const slug = String(formData.get("originalSlug") || "");
  if (!slug) return { error: "Не указан курс для обновления" };

  const fields = readCourseFields(formData);
  if (!fields.title) return { error: "Укажите название курса" };

  // Сотрудник правит любой курс, спикер — только свой.
  const isStaff = ["admin", "editor"].includes(user.role);
  if (!isStaff) {
    const owner = await queryOne<{ created_by: string | null }>(
      `select created_by from courses where slug = $1`,
      [slug]
    );
    if (!owner) return { error: "Курс не найден" };
    if (owner.created_by !== user.id) {
      console.error("updateSpeakerCourse: попытка правки чужого курса");
      return { error: "Можно редактировать только свои курсы" };
    }
  }

  try {
    const data = await withDoctorName(fields);
    const { text, values } = buildUpdate("courses", data, "slug", slug);
    await query(text, values);
  } catch (err) {
    console.error("updateSpeakerCourse:", err);
    return { error: errText(err, "Не удалось сохранить курс") };
  }

  revalidate(slug);
  return {};
}
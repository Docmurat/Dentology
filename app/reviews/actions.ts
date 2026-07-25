// app/reviews/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { sendTelegramMessage, tgEscape } from "@/lib/telegram";
import { query } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { getCourseBySlug } from "@/lib/courses";
import { getTeamMembers } from "@/lib/team";
import {
  isHoneypotFilled,
  isTooFast,
  rateLimit,
  formatRetryAfter,
} from "@/lib/anti-spam";

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
  // Скрытое поле заполнено — это бот. Отвечаем «успехом», чтобы он
  // не подбирал обход.
  if (isHoneypotFilled(formData.get("company"))) {
    return { ok: true };
  }

  // Форма отправлена быстрее, чем её физически можно заполнить.
  if (isTooFast(formData.get("startedAt"))) {
    return { ok: true };
  }

  // Три отзыва с одного адреса в час — с запасом для честного человека.
  const limit = await rateLimit("review", { limit: 3, windowSec: 3600 });
  if (!limit.allowed) {
    return {
      error: `Слишком много отправок. Попробуйте через ${formatRetryAfter(limit.retryAfterSec)}`,
    };
  }

  // Согласие на обработку персональных данных (152-ФЗ) — обязательно.
  if (formData.get("consent") !== "on") {
    return {
      error: "Необходимо согласие на обработку персональных данных",
    };
  }

  const author = String(formData.get("author") || "").trim();
  const text = String(formData.get("text") || "").trim();
  const doctorSlug = String(formData.get("doctorSlug") || "") || null;
  const courseSlug = String(formData.get("courseSlug") || "") || null;
  const instagram = normalizeInstagram(String(formData.get("instagram") || ""));

  const trimOrNull = (v: string) => v.trim() || null;
  const pros = courseSlug ? trimOrNull(String(formData.get("pros") || "")) : null;
  const cons = courseSlug ? trimOrNull(String(formData.get("cons") || "")) : null;
  const wishes = courseSlug
    ? trimOrNull(String(formData.get("wishes") || ""))
    : null;

  // Курс-отзыв: фиксируем слепок — ведущего врача и название курса.
  let courseTitle: string | null = null;
  let courseDoctorSlug: string | null = null;
  if (courseSlug) {
    const course = await getCourseBySlug(courseSlug);
    if (course) {
      courseTitle = course.title;
      courseDoctorSlug = course.doctorSlug;
    }
  }
  const phone = String(formData.get("phone") || "").trim() || null;

  if (!author) return { error: "Укажите фамилию и имя" };
  if (!phone) return { error: "Укажите телефон" };
  if (text.length < 20)
    return { error: "Отзыв слишком короткий (минимум 20 символов)" };
  if (text.length > 4000) return { error: "Отзыв слишком длинный" };

  const id = crypto.randomUUID();

  // Необязательное фото посетителя -> в Object Storage.
  let image: string | null = null;
  const photo = formData.get("photo");
  if (photo instanceof File && photo.size > 0) {
    if (!photo.type.startsWith("image/"))
      return { error: "Фото должно быть изображением" };
    if (photo.size > 5 * 1024 * 1024)
      return { error: "Фото слишком большое (до 5 МБ)" };
    try {
      const ext = (photo.name.split(".").pop() || "jpg").toLowerCase();
      const path = `review-images/${id}/visitor-${Date.now()}.${ext}`;
      image = await uploadFile(path, photo);
    } catch {
      // если фото не загрузилось — отзыв всё равно отправляем без него
    }
  }

  try {
    await query(
      `insert into reviews
         (id, author, text, doctor_slug, course_slug, course_title,
          pros, cons, wishes, instagram, image, status, verified)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',false)`,
      [
        id,
        author,
        text,
        courseSlug ? courseDoctorSlug : doctorSlug,
        courseSlug,
        courseTitle,
        pros,
        cons,
        wishes,
        instagram,
        image,
      ]
    );
  } catch {
    return { error: "Не удалось отправить отзыв. Попробуйте позже." };
  }

  if (phone) {
    try {
      await query(
        `insert into review_contacts (review_id, phone) values ($1, $2)`,
        [id, phone]
      );
    } catch {
      // телефон не критичен для самого отзыва
    }
  }

  // Имя врача для уведомления (slug → имя из «Команды»).
  const notifyDoctorSlug = courseSlug ? courseDoctorSlug : doctorSlug;
  let doctorName: string | null = null;
  if (notifyDoctorSlug) {
    try {
      const team = await getTeamMembers();
      doctorName =
        team.find((m) => m.slug === notifyDoctorSlug)?.name ?? notifyDoctorSlug;
    } catch {
      doctorName = notifyDoctorSlug;
    }
  }

  // Уведомление в Telegram: ⭐️ — отзыв о клинике/враче, 🎓 — о курсе.
  const headerEmoji = courseSlug ? "🎓" : "⭐️";
  const kind = courseSlug
    ? `Курс: ${tgEscape(courseTitle || courseSlug)}`
    : "Отзыв о клинике/враче";
  const tgLines = [
    `${headerEmoji} <b>Новый отзыв — требует модерации</b>`,
    "",
    `<b>Тип:</b> ${kind}`,
    courseSlug
      ? doctorName
        ? `<b>Ведущий:</b> ${tgEscape(doctorName)}`
        : ""
      : `<b>Врач:</b> ${doctorName ? tgEscape(doctorName) : "не выбран"}`,
    `<b>Автор:</b> ${tgEscape(author)}`,
    `<b>Телефон:</b> ${tgEscape(phone || "не указан")}`,
    instagram ? `<b>Instagram:</b> ${tgEscape(instagram)}` : "",
    "",
    `<b>Отзыв:</b> ${tgEscape(text)}`,
    pros ? `<b>Плюсы:</b> ${tgEscape(pros)}` : "",
    cons ? `<b>Минусы:</b> ${tgEscape(cons)}` : "",
    wishes ? `<b>Пожелания:</b> ${tgEscape(wishes)}` : "",
    image ? "<b>Фото:</b> приложено" : "",
    "",
    "Подтвердить/отклонить: /admin/reviews",
  ].filter(Boolean);
  await sendTelegramMessage(tgLines.join("\n"));

  revalidatePath("/admin/reviews");
  return { ok: true };
}
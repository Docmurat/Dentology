"use server";

import { getCurrentUser } from "@/lib/auth-guards";
import { queryOne } from "@/lib/db";
import { uploadFile } from "@/lib/storage";

const MAX_SIZE = 15 * 1024 * 1024; // 15 МБ

// Куда кому можно писать (повторяет прежние политики хранилища):
//   сотрудник (admin/editor) — во все папки;
//   врач (doctor)            — картинки своих кейсов;
//   врач-спикер              — плюс картинки курсов (цитата курса).
const STAFF_PREFIXES = ["case-images", "team-images", "review-images"];
const DOCTOR_PREFIXES = ["case-images"];
const SPEAKER_PREFIXES = ["case-images", "team-images/courses"];

function folderAllowed(folder: string, prefixes: string[]): boolean {
  return prefixes.some((p) => folder === p || folder.startsWith(`${p}/`));
}

// Спикер — врач, у чьей карточки в команде стоит флаг is_speaker.
async function isSpeaker(doctorSlug: string | null): Promise<boolean> {
  if (!doctorSlug) return false;
  const card = await queryOne<{ is_speaker: boolean }>(
    `select is_speaker from team_members where slug = $1`,
    [doctorSlug]
  );
  return Boolean(card?.is_speaker);
}

/**
 * Загружает изображение в Object Storage и возвращает публичную ссылку.
 * Вызывается из клиентских форм админки и кабинета врача.
 * folder — путь внутри бакета, например "team-images/lead-doctor".
 */
export async function uploadImage(
  formData: FormData
): Promise<{ url?: string; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: "Не авторизован" };

  const isStaff = user.role === "admin" || user.role === "editor";
  const isDoctor = user.role === "doctor";
  if (!isStaff && !isDoctor) return { error: "Недостаточно прав" };

  const file = formData.get("file");
  const folder = String(formData.get("folder") || "").replace(/^\/+|\/+$/g, "");
  const name = String(formData.get("name") || "").trim();

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Файл не выбран" };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Можно загружать только изображения" };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Файл слишком большой (до 15 МБ)" };
  }

  let allowed = STAFF_PREFIXES;
  if (!isStaff) {
    allowed = (await isSpeaker(user.doctorSlug))
      ? SPEAKER_PREFIXES
      : DOCTOR_PREFIXES;
  }
  if (!folderAllowed(folder, allowed)) {
    return { error: "Недопустимая папка загрузки" };
  }

  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const base = name || crypto.randomUUID();
  const path = `${folder}/${base}-${Date.now()}.${ext}`;

  try {
    const url = await uploadFile(path, file);
    return { url };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Не удалось загрузить файл",
    };
  }
}
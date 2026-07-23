"use client";

import { uploadImage } from "@/app/admin/upload-actions";

/**
 * Загружает Blob (например, результат кропа) через серверный экшен
 * и возвращает публичную ссылку. Бросает ошибку при неудаче.
 *
 * folder — путь внутри бакета: "case-images/blocks", "team-images/<slug>" и т.п.
 * name   — понятный префикс имени файла ("photo", "diploma", "cover").
 */
export async function uploadImageBlob(
  folder: string,
  blob: Blob,
  name = "image"
): Promise<string> {
  const type = blob.type || "image/jpeg";
  const ext = type.includes("png")
    ? "png"
    : type.includes("webp")
      ? "webp"
      : "jpg";

  const fd = new FormData();
  fd.set("folder", folder);
  fd.set("name", name);
  fd.set("file", new File([blob], `${name}.${ext}`, { type }));

  const res = await uploadImage(fd);
  if (res.error || !res.url) {
    throw new Error(res.error || "Не удалось загрузить файл");
  }
  return res.url;
}

/** То же для готового File (без кропа). */
export async function uploadImageFile(
  folder: string,
  file: File,
  name = "photo"
): Promise<string> {
  const fd = new FormData();
  fd.set("folder", folder);
  fd.set("name", name);
  fd.set("file", file);

  const res = await uploadImage(fd);
  if (res.error || !res.url) {
    throw new Error(res.error || "Не удалось загрузить файл");
  }
  return res.url;
}
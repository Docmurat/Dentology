// lib/archive-sniff.ts
//
// Архивы КЛКТ: допустимые форматы и проверка по первым байтам файла.
// Используется и сервером (после загрузки), и браузером (до загрузки —
// чтобы не гнать полтора гигабайта ради отказа в конце).

export type SniffedArchive = { ext: string; contentType: string };

// Типы архивов КЛКТ. Сверяются с первыми байтами уже загруженного файла.
export const ARCHIVE_TYPES: Record<string, string> = {
  zip: "application/zip",
  rar: "application/vnd.rar",
  "7z": "application/x-7z-compressed",
};

export function isArchiveType(contentType: string): boolean {
  return Object.values(ARCHIVE_TYPES).includes(contentType);
}

/** Тип архива по имени файла (до загрузки) — null, если не архив. */
export function archiveExtFromName(name: string): string | null {
  const ext = (name.split(".").pop() || "").toLowerCase();
  return ext in ARCHIVE_TYPES ? ext : null;
}

/** Тип архива по содержимому (после загрузки) — null, если не архив. */
export function sniffArchive(b: Uint8Array): SniffedArchive | null {
  if (b.length < 6) return null;
  // ZIP: "PK\x03\x04" (обычный) или "PK\x05\x06" (пустой)
  if (
    b[0] === 0x50 &&
    b[1] === 0x4b &&
    ((b[2] === 0x03 && b[3] === 0x04) || (b[2] === 0x05 && b[3] === 0x06))
  ) {
    return { ext: "zip", contentType: ARCHIVE_TYPES.zip };
  }
  // RAR: "Rar!\x1a\x07"
  if (
    b[0] === 0x52 &&
    b[1] === 0x61 &&
    b[2] === 0x72 &&
    b[3] === 0x21 &&
    b[4] === 0x1a &&
    b[5] === 0x07
  ) {
    return { ext: "rar", contentType: ARCHIVE_TYPES.rar };
  }
  // 7z: "7z\xbc\xaf\x27\x1c"
  if (
    b[0] === 0x37 &&
    b[1] === 0x7a &&
    b[2] === 0xbc &&
    b[3] === 0xaf &&
    b[4] === 0x27 &&
    b[5] === 0x1c
  ) {
    return { ext: "7z", contentType: ARCHIVE_TYPES["7z"] };
  }
  return null;
}

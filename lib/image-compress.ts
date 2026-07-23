// Сжимает изображение в браузере перед загрузкой в хранилище:
// уменьшает до максимальной стороны и перекодирует с заданным качеством.
// Возвращает File, готовый к отправке в Supabase Storage.
//
// Используется для фото, которые НЕ проходят кроп (напр. блоки описания
// кейса). Для кропа см. lib/crop-image.ts.
export type CompressOptions = {
  /** Максимальная длина большей стороны, px. По умолчанию 1600. */
  maxDimension?: number;
  /** Качество JPEG/WebP, 0–1. По умолчанию 0.82. */
  quality?: number;
  /** Формат результата. По умолчанию "image/jpeg". */
  mimeType?: "image/jpeg" | "image/webp";
};

const DEFAULTS: Required<CompressOptions> = {
  maxDimension: 1600,
  quality: 0.82,
  mimeType: "image/jpeg",
};

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Не удалось прочитать изображение"));
    };
    img.src = url;
  });
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  // Анимированные GIF и векторные SVG не трогаем — вернём как есть.
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    return file;
  }

  const { maxDimension, quality, mimeType } = { ...DEFAULTS, ...options };

  let image: HTMLImageElement;
  try {
    image = await loadImageFromFile(file);
  } catch {
    // Если не смогли прочитать — грузим оригинал, чтобы не потерять фото.
    return file;
  }

  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const longest = Math.max(w, h);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const targetW = Math.max(1, Math.round(w * scale));
  const targetH = Math.max(1, Math.round(h * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, targetW, targetH);

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), mimeType, quality)
  );
  if (!blob) return file;

  // Если картинка и так меньше и сжатие не помогло — оставляем оригинал.
  if (blob.size >= file.size && scale === 1) return file;

  const ext = mimeType === "image/webp" ? "webp" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.${ext}`, { type: mimeType });
}
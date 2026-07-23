// Обрезает картинку по выбранной области (в пикселях исходника), при
// необходимости уменьшает её до разумного размера и возвращает сжатый
// Blob (JPEG по умолчанию), готовый к загрузке в хранилище.
//
// Зачем даунскейл: без ограничения по стороне в хранилище попадали
// многомегабайтные оригиналы (напр. 4000+ px), из-за чего страницы
// долго грузили фото. 1600 px по большей стороне достаточно для веба,
// в т.ч. на дисплеях с высокой плотностью.
type Area = { x: number; y: number; width: number; height: number };

export type CropOptions = {
  /** Максимальная длина большей стороны результата, px. По умолчанию 1600. */
  maxDimension?: number;
  /** Качество для JPEG/WebP, 0–1. По умолчанию 0.82. */
  quality?: number;
  /** Формат результата. По умолчанию "image/jpeg". */
  mimeType?: "image/jpeg" | "image/webp";
};

const DEFAULTS: Required<CropOptions> = {
  maxDimension: 1600,
  quality: 0.82,
  mimeType: "image/jpeg",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
    img.src = src;
  });
}

export async function getCroppedBlob(
  src: string,
  area: Area,
  options: CropOptions = {}
): Promise<Blob> {
  const { maxDimension, quality, mimeType } = { ...DEFAULTS, ...options };

  const image = await loadImage(src);

  const cropW = Math.max(1, Math.round(area.width));
  const cropH = Math.max(1, Math.round(area.height));

  // Масштаб, чтобы большая сторона не превышала maxDimension (не увеличиваем).
  const longest = Math.max(cropW, cropH);
  const scale = longest > maxDimension ? maxDimension / longest : 1;
  const targetW = Math.max(1, Math.round(cropW * scale));
  const targetH = Math.max(1, Math.round(cropH * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas не поддерживается браузером");

  // Качественный ресемплинг при уменьшении.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    image,
    // область-источник в пикселях оригинала
    area.x,
    area.y,
    area.width,
    area.height,
    // назначение — уже уменьшенный размер
    0,
    0,
    targetW,
    targetH
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Не удалось обрезать картинку")),
      mimeType,
      quality
    );
  });
}
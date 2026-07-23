"use client";

import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedBlob } from "@/lib/crop-image";

type Area = { x: number; y: number; width: number; height: number };
export type AspectChoice = number | "free";

const RATIOS: { label: string; value: AspectChoice }[] = [
  { label: "Свободно", value: "free" },
  { label: "3:2", value: 3 / 2 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
];

// Модалка кропа одной картинки. aspect: число — формат зафиксирован (кнопки
// форматов скрыты); "free" — по пропорциям картинки; null — пользователь
// выбирает формат сам. onDone получает готовый blob и числовое соотношение,
// которым реально обрезали (чтобы следующую картинку зафиксировать в нём же).
export function CropModal({
  src,
  label,
  aspect,
  compress,
  onDone,
  onCancel,
}: {
  src: string;
  label: string;
  aspect: AspectChoice | null;
  compress?: { maxDimension?: number; quality?: number };
  onDone: (blob: Blob, usedAspect: number) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const [chosen, setChosen] = useState<AspectChoice>(
    aspect === null ? RATIOS[0].value : aspect
  );
  const [busy, setBusy] = useState(false);

  // Натуральные пропорции нужны для режима «Свободно».
  useEffect(() => {
    const img = new window.Image();
    img.onload = () => setNaturalRatio(img.naturalWidth / img.naturalHeight);
    img.src = src;
  }, [src]);

  const selectable = aspect === null;
  const resolvedChoice: AspectChoice = selectable ? chosen : aspect;
  const effectiveAspect =
    resolvedChoice === "free" ? naturalRatio ?? 1 : resolvedChoice;

  const onCropComplete = useCallback(
    (_: Area, px: Area) => setAreaPixels(px),
    []
  );

  async function confirm() {
    if (!areaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, areaPixels, compress);
      await onDone(blob, effectiveAspect);
      // при успехе модалка закрывается родителем (busy оставляем)
    } catch {
      alert("Не удалось обрезать изображение");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5">
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          {label} — выберите область
        </p>

        {selectable ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {RATIOS.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setChosen(r.value)}
                className={
                  chosen === r.value
                    ? "rounded-full bg-[var(--color-navy)] px-4 py-1.5 text-sm font-medium text-white"
                    : "rounded-full border border-[var(--color-gray-200)] px-4 py-1.5 text-sm text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]"
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-xs text-[var(--color-gray-500)]">
            {aspect === "free"
              ? "Формат свободный (по пропорциям картинки) — доступна только область кропа."
              : "Формат задан первой картинкой — доступна только область кропа."}
          </p>
        )}

        <div className="relative mt-4 h-[320px] w-full overflow-hidden rounded-lg bg-[var(--color-gray-100)]">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={effectiveAspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-[var(--color-gray-500)]">Масштаб</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1"
          />
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)] disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="rounded-lg bg-[var(--color-navy)] px-5 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Обработка…" : "Готово"}
          </button>
        </div>
      </div>
    </div>
  );
}
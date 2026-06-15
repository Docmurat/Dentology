"use client";

import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import { getCroppedBlob } from "@/lib/crop-image";

type Area = { x: number; y: number; width: number; height: number };
type AspectChoice = number | "free";

const RATIOS: { label: string; value: AspectChoice }[] = [
  { label: "Свободно", value: "free" },
  { label: "3:2", value: 3 / 2 },
  { label: "4:3", value: 4 / 3 },
  { label: "1:1", value: 1 },
  { label: "4:5", value: 4 / 5 },
];

const labelCls = "text-sm font-medium text-[var(--color-navy)]";

export function CropField({
  label,
  aspect,
  existingUrl,
  onCropped,
  onRemovedToggle,
}: {
  label: string;
  /** Число — формат зафиксирован; "free" — по пропорциям картинки;
   *  null — пользователь выбирает формат сам. */
  aspect: AspectChoice | null;
  existingUrl?: string;
  onCropped: (blob: Blob, aspect: AspectChoice) => void;
  onRemovedToggle?: (removed: boolean) => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [naturalRatio, setNaturalRatio] = useState<number | null>(null);
  const [chosen, setChosen] = useState<AspectChoice>(
    aspect === null ? RATIOS[0].value : aspect
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);

  const selectable = aspect === null;
  // То, что отдадим наверх (число или "free")
  const resolvedChoice: AspectChoice = selectable ? chosen : aspect;
  // То, что нужно передать Cropper'у — всегда число
  const effectiveAspect =
    resolvedChoice === "free" ? naturalRatio ?? 1 : resolvedChoice;

  function pick(file: File | undefined) {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setNaturalRatio(img.naturalWidth / img.naturalHeight);
      setSrc(url);
      setChosen(aspect === null ? RATIOS[0].value : aspect);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setOpen(true);
    };
    img.src = url;
  }

  const onCropComplete = useCallback(
    (_: Area, px: Area) => setAreaPixels(px),
    []
  );

  async function confirm() {
    if (!src || !areaPixels) return;
    setBusy(true);
    try {
      const blob = await getCroppedBlob(src, areaPixels);
      setPreview(URL.createObjectURL(blob));
      onCropped(blob, resolvedChoice);
      setOpen(false);
    } catch {
      alert("Не удалось обрезать изображение");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className={labelCls}>{label}</label>

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="mt-2 w-full rounded-lg border border-[var(--color-gray-200)] object-cover"
        />
      ) : existingUrl && !removed ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={existingUrl}
            alt=""
            className="mt-2 w-full rounded-lg border border-[var(--color-gray-200)] object-cover"
          />
          {onRemovedToggle ? (
            <label className="mt-1 flex items-center gap-2 text-xs text-[var(--color-gray-600)]">
              <input
                type="checkbox"
                onChange={(e) => {
                  setRemoved(e.target.checked);
                  onRemovedToggle(e.target.checked);
                }}
              />
              Удалить текущее
            </label>
          ) : null}
        </>
      ) : null}

      <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-3 text-center text-sm text-[var(--color-gray-600)] transition hover:border-[var(--color-teal)] hover:bg-white hover:text-[var(--color-navy)]">
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
        {preview ? "Заменить и обрезать" : "Выбрать и обрезать"}
      </label>

      {open && src ? (
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
                onClick={() => setOpen(false)}
                className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]"
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
      ) : null}
    </div>
  );
}
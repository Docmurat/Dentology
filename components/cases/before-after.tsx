"use client";

import Image from "next/image";
import { useState } from "react";
import { Lightbox } from "@/components/cases/image-lightbox";

type Dim = { w: number; h: number };

type Props = {
  before?: string;
  after?: string;
};

// Обе картинки на всю ширину колонки. Когда загружены обе — общая высота
// берётся по более «плоской» (низкой при равной ширине): её пропорция
// применяется к обоим контейнерам, более высокая картинка кропается
// сверху/снизу через object-cover. Если картинка одна — показываем как есть.
// Клик по фото открывает полноэкранный просмотр с листанием «До ↔ После».
export function BeforeAfter({ before, after }: Props) {
  const [beforeDim, setBeforeDim] = useState<Dim | null>(null);
  const [afterDim, setAfterDim] = useState<Dim | null>(null);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const both = Boolean(before && after);

  // Массив для лайтбокса и позиции каждой картинки в нём.
  const lightboxImages = [before, after].filter(Boolean) as string[];
  const beforeIndex = before ? 0 : -1;
  const afterIndex = after ? (before ? 1 : 0) : -1;

  let sharedRatio: string | undefined;
  if (both && beforeDim && afterDim) {
    // Чем больше width/height, тем картинка ниже при одинаковой ширине.
    const flatter =
      beforeDim.w / beforeDim.h >= afterDim.w / afterDim.h
        ? beforeDim
        : afterDim;
    sharedRatio = `${flatter.w} / ${flatter.h}`;
  }

  function renderCell(
    src: string | undefined,
    caption: string,
    onDim: (d: Dim) => void,
    lbIndex: number
  ) {
    return (
      <div className="overflow-hidden rounded-2xl bg-[var(--color-gray-100)]">
        {src ? (
          <button
            type="button"
            onClick={() => setOpenIndex(lbIndex)}
            aria-label={`Открыть фото: ${caption}`}
            className="group block w-full cursor-zoom-in"
          >
            <div style={sharedRatio ? { aspectRatio: sharedRatio } : undefined}>
              <Image
                src={src}
                alt={caption}
                width={800}
                height={600}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                onLoad={(e) =>
                  onDim({
                    w: e.currentTarget.naturalWidth,
                    h: e.currentTarget.naturalHeight,
                  })
                }
                className={
                  sharedRatio
                    ? "h-full w-full object-cover transition group-hover:opacity-95"
                    : "block h-auto w-full transition group-hover:opacity-95"
                }
              />
            </div>
          </button>
        ) : null}
        <div className="border-t border-[var(--color-gray-200)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--color-navy)]">
            {caption}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {renderCell(before, "До лечения", setBeforeDim, beforeIndex)}
        {renderCell(after, "После лечения", setAfterDim, afterIndex)}
      </div>

      {openIndex !== null ? (
        <Lightbox
          images={lightboxImages}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      ) : null}
    </>
  );
}
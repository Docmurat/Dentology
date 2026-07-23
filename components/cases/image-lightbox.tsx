"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// Полноэкранный просмотр набора фото с листанием (Esc / стрелки / клик по фону).
// Рендерится через портал в document.body — чтобы оверлей не «зажимался»
// родителями с transform/overflow. Переиспользуется галереей блоков,
// блоком «До/После» и дипломом врача.
export function Lightbox({
  images,
  index,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  onClose: () => void;
  onIndexChange: (i: number) => void;
}) {
  const count = images.length;
  const go = useCallback(
    (i: number) => onIndexChange(((i % count) + count) % count),
    [count, onIndexChange]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, go, onClose]);

  if (typeof document === "undefined") return null;

  const single = count <= 1;

  const overlay = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white transition hover:bg-white/20"
      >
        ✕
      </button>

      {!single ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(index - 1);
            }}
            aria-label="Предыдущее фото"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(index + 1);
            }}
            aria-label="Следующее фото"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ›
          </button>
        </>
      ) : null}

      <div
        className="relative flex max-h-[90vh] max-w-[92vw] items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[index]}
          alt=""
          width={1600}
          height={1200}
          sizes="92vw"
          priority
          style={{ width: "auto", height: "auto" }}
          className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain"
        />
      </div>

      {!single ? (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white">
          {index + 1} / {count}
        </div>
      ) : null}
    </div>
  );

  return createPortal(overlay, document.body);
}

// Кликабельная галерея фото кейса: миниатюры + полноэкранный просмотр.
export function CaseImages({ images }: { images: string[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!images.length) return null;

  const single = images.length === 1;

  return (
    <>
      {single ? (
        <button
          type="button"
          onClick={() => setOpenIndex(0)}
          aria-label="Открыть фото"
          className="group block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-100)]"
        >
          <Image
            src={images[0]}
            alt=""
            width={800}
            height={600}
            sizes="(max-width: 768px) 100vw, 800px"
            className="block h-auto w-full transition group-hover:opacity-95"
          />
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label="Открыть фото"
              className="group cursor-zoom-in overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-100)]"
            >
              <div className="aspect-[4/3]">
                <Image
                  src={url}
                  alt=""
                  width={500}
                  height={375}
                  sizes="(max-width: 768px) 50vw, 400px"
                  className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
                />
              </div>
            </button>
          ))}
        </div>
      )}

      {openIndex !== null ? (
        <Lightbox
          images={images}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
        />
      ) : null}
    </>
  );
}
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

    // Фиксируем страницу под окном: иначе на телефоне жест масштабирования
    // увеличивает саму страницу, а не фотографию. Позицию запоминаем.
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";

    // Браузер обрабатывает щипок на уровне всей страницы, поэтому гасим жест
    // вручную: двумя пальцами — блокируем, одним — оставляем прокрутку.
    function onTouchMove(e: TouchEvent) {
      if (e.touches.length > 1) e.preventDefault();
    }
    // Safari шлёт собственные события масштабирования.
    function onGesture(e: Event) {
      e.preventDefault();
    }
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("gesturestart", onGesture as EventListener);
    document.addEventListener("gesturechange", onGesture as EventListener);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("gesturestart", onGesture as EventListener);
      document.removeEventListener("gesturechange", onGesture as EventListener);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [index, go, onClose]);

  if (typeof document === "undefined") return null;

  const single = count <= 1;

  const overlay = (
    <div
      className="fixed inset-0 z-[100] overflow-auto overscroll-contain bg-black/90 sm:p-4"
      style={{ touchAction: "pan-x pan-y" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Закрыть"
        className="fixed right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-lg text-white backdrop-blur transition hover:bg-white/25 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
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
            className="fixed left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
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
            className="fixed right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
          >
            ›
          </button>
        </>
      ) : null}

      {/* На телефоне фото открывается во всю ширину и прокручивается,
          от 640px — вписывается в экран целиком. */}
      <div
        className="flex min-h-full items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={images[index]}
          alt=""
          width={1600}
          height={1200}
          sizes="(max-width: 1024px) 100vw, 1200px"
          priority
          className="h-auto w-full sm:max-h-[90vh] sm:rounded-lg sm:object-contain lg:max-w-[1200px]"
        />
      </div>

      {!single ? (
        <div className="fixed bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/15 px-3 py-1 text-sm text-white backdrop-blur">
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
  // Одна картинка — во всю ширину, две и больше — сеткой по две в ряд.
  // Три штуки укладываются как 2 + 1 (последняя занимает всю ширину).
  const three = images.length === 3;

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
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label="Открыть фото"
              className={`group cursor-zoom-in overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-100)] ${
                three && i === 2 ? "col-span-2" : ""
              }`}
            >
              <div className={three && i === 2 ? "aspect-[16/9]" : "aspect-[4/3]"}>
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
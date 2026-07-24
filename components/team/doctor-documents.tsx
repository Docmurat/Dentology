"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Card } from "@/components/ui/card";

// useLayoutEffect на сервере шумит варнингом — на сервере берём useEffect.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Раскладка «Диплом + Дополнительное образование + Отзывы».
 * Диплом — слева, образование — справа.
 * Если образование по высоте больше диплома в 1.5 раза (на десктопе),
 * отзывы встают под диплом в левую колонку (столбиком — reviewsBeside).
 * Иначе отзывы занимают всю ширину снизу (каруселью — reviewsWide).
 *
 * Диплом рендерится ЗДЕСЬ (а не приходит пропом), чтобы кнопка увеличения
 * гарантированно была интерактивной. Состояние просмотра живёт в этом
 * компоненте — он сам не перемонтируется, поэтому окно не закрывается при
 * пересчёте раскладки.
 */
export function DoctorDocuments({
  diplomaSrc,
  diplomaAlt,
  education,
  reviewsBeside,
  reviewsWide,
  initialBeside = false,
}: {
  diplomaSrc?: string | null;
  diplomaAlt: string;
  education: ReactNode;
  reviewsBeside: ReactNode | null;
  reviewsWide: ReactNode | null;
  initialBeside?: boolean;
}) {
  const dipRef = useRef<HTMLDivElement>(null);
  const eduRef = useRef<HTMLDivElement>(null);
  const [beside, setBeside] = useState(initialBeside);
  const [zoom, setZoom] = useState(false);

  const hasReviews = reviewsBeside != null;

  useIsoLayoutEffect(() => {
    if (!hasReviews) {
      setBeside(false);
      return;
    }

    const measure = () => {
      const dh = dipRef.current?.offsetHeight ?? 0;
      const eh = eduRef.current?.offsetHeight ?? 0;
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      const next = isDesktop && dh > 0 && eh > dh * 1.5;
      setBeside((prev) => (prev === next ? prev : next));
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (dipRef.current) ro.observe(dipRef.current);
    if (eduRef.current) ro.observe(eduRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [hasReviews, beside]);

  useEffect(() => {
    if (!zoom) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoom(false);
    }
    document.addEventListener("keydown", onKey);

    // Фиксируем страницу под окном просмотра: на телефоне иначе фон
    // прокручивается вместе с жестом. Позицию запоминаем и возвращаем.
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";

    return () => {
      document.removeEventListener("keydown", onKey);
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [zoom]);

  const diplomaCard = (
    <Card>
      <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
        Диплом специалиста
      </h2>

      {diplomaSrc ? (
        <button
          type="button"
          onClick={() => setZoom(true)}
          aria-label="Открыть диплом крупно"
          className="mt-5 block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-[var(--color-gray-100)]"
        >
          <Image
            src={diplomaSrc}
            alt={diplomaAlt}
            width={1000}
            height={750}
            sizes="(max-width: 768px) 100vw, 700px"
            className="h-auto w-full transition hover:opacity-95"
          />
        </button>
      ) : (
        <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
          Скан диплома появится после загрузки в админ-панели.
        </p>
      )}
    </Card>
  );

  const overlay =
    zoom && diplomaSrc && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed inset-0 z-[100] overflow-auto overscroll-contain bg-black/90 sm:p-4"
            onClick={() => setZoom(false)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setZoom(false)}
              aria-label="Закрыть"
              className="fixed right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-lg text-white backdrop-blur transition hover:bg-white/25 sm:right-4 sm:top-4 sm:h-10 sm:w-10"
            >
              ✕
            </button>

            {/* На телефоне диплом открывается во всю ширину и прокручивается,
                чтобы текст можно было прочитать. От 640px — вписывается в экран. */}
            <div
              className="flex min-h-full items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={diplomaSrc}
                alt={diplomaAlt}
                width={1600}
                height={1200}
                sizes="(max-width: 1024px) 100vw, 1200px"
                priority
                className="h-auto w-full sm:max-h-[90vh] sm:rounded-lg sm:object-contain lg:max-w-[1200px]"
              />
            </div>
          </div>,
          document.body
        )
      : null;

  if (beside && hasReviews) {
    return (
      <>
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="grid gap-8">
            <div ref={dipRef}>{diplomaCard}</div>
            <div>{reviewsBeside}</div>
          </div>
          <div ref={eduRef}>{education}</div>
        </div>
        {overlay}
      </>
    );
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div ref={dipRef}>{diplomaCard}</div>
        <div ref={eduRef}>{education}</div>
      </div>
      {hasReviews ? <div>{reviewsWide}</div> : null}
      {overlay}
    </>
  );
}
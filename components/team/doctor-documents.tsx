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
    return () => document.removeEventListener("keydown", onKey);
  }, [zoom]);

  const diplomaCard = (
    <Card>
      <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setZoom(false)}
            role="dialog"
            aria-modal="true"
          >
            <button
              type="button"
              onClick={() => setZoom(false)}
              aria-label="Закрыть"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lg text-white transition hover:bg-white/20"
            >
              ✕
            </button>

            <div
              className="relative flex max-h-[90vh] max-w-[92vw] items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={diplomaSrc}
                alt={diplomaAlt}
                width={1600}
                height={1200}
                sizes="92vw"
                priority
                style={{ width: "auto", height: "auto" }}
                className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain"
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
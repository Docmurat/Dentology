"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Lightbox } from "@/components/cases/image-lightbox";
import { typography } from "@/lib/typography";

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
 *
 * Просмотр крупно — общий Lightbox из components/cases/image-lightbox.tsx.
 * Раньше здесь была своя копия портала, обработчика Escape и фиксации
 * прокрутки: две независимые реализации расходились в поведении, и жест
 * увеличения работал по-разному в кейсах и на странице врача.
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

  const diplomaCard = (
    <Card>
      <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
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
        <p className={`mt-4 ${typography.body} text-[var(--color-gray-700)]`}>
          Скан диплома появится после загрузки в админ-панели.
        </p>
      )}
    </Card>
  );

  // Потолок увеличения выше, чем у фотографий: диплом открывают, чтобы
  // прочитать текст, и там запас важнее чистоты картинки.
  const overlay =
    zoom && diplomaSrc ? (
      <Lightbox
        images={[diplomaSrc]}
        index={0}
        onClose={() => setZoom(false)}
        onIndexChange={() => {}}
        maxScale={4}
      />
    ) : null;

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
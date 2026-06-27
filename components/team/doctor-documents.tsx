"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// useLayoutEffect на сервере шумит варнингом — на сервере берём useEffect.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Раскладка «Диплом + Дополнительное образование + Отзывы».
 * Диплом — слева, образование — справа.
 * Если образование по высоте больше диплома в 1.5 раза (на десктопе),
 * отзывы встают под диплом в левую колонку (столбиком — reviewsBeside).
 * Иначе отзывы занимают всю ширину снизу (каруселью — reviewsWide).
 */
export function DoctorDocuments({
  diploma,
  education,
  reviewsBeside,
  reviewsWide,
  initialBeside = false,
}: {
  diploma: ReactNode;
  education: ReactNode;
  reviewsBeside: ReactNode | null;
  reviewsWide: ReactNode | null;
  initialBeside?: boolean;
}) {
  const dipRef = useRef<HTMLDivElement>(null);
  const eduRef = useRef<HTMLDivElement>(null);
  const [beside, setBeside] = useState(initialBeside);

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

  if (beside && hasReviews) {
    return (
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div className="grid gap-8">
          <div ref={dipRef}>{diploma}</div>
          <div>{reviewsBeside}</div>
        </div>
        <div ref={eduRef}>{education}</div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
        <div ref={dipRef}>{diploma}</div>
        <div ref={eduRef}>{education}</div>
      </div>
      {hasReviews ? <div>{reviewsWide}</div> : null}
    </>
  );
}
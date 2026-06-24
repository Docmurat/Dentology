"use client";

import { useRef } from "react";
import { ReviewCard } from "@/components/reviews/review-card";
import type { ReviewItem } from "@/lib/reviews-data";

type Item = ReviewItem & { date?: string };

export function ReviewsCarousel({ reviews }: { reviews: Item[] }) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.9 * dir, behavior: "smooth" });
  };

  return (
    <div>
      <div
        ref={ref}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r) => (
          <div
            key={r.slug}
            className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
          >
            <ReviewCard review={r} date={r.date} compact />
          </div>
        ))}
      </div>

      {reviews.length > 1 ? (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Предыдущие отзывы"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-white text-[var(--color-navy)] transition hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Следующие отзывы"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-white text-[var(--color-navy)] transition hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]"
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ReviewCard } from "@/components/reviews/review-card";
import type { ReviewItem } from "@/lib/reviews-data";

type FilterOption = { slug: string; label: string };

type ReviewsPageContentProps = {
  reviews: ReviewItem[];
  directions?: FilterOption[];
  // Фильтр по курсам (для страницы «Отзывы курсов»). Если задан — фильтруем по курсам.
  courses?: FilterOption[];
  doctorFilter?: { slug: string; name: string } | null;
  // Акцент активных элементов: "gold" — для учебного раздела (отзывы курсов).
  variant?: "default" | "gold";
  // Стартовый активный фильтр (напр. текущий курс).
  initialFilter?: string;
};

const ITEMS_PER_PAGE = 6;

export function ReviewsPageContent({
  reviews,
  directions = [],
  courses = [],
  doctorFilter = null,
  variant = "default",
  initialFilter = "all",
}: ReviewsPageContentProps) {
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);

  // Стиль кнопок-фильтров. Золотой режим — как кнопка gold-outline:
  // золотая обводка и золотой текст; активная — со светло-золотой заливкой.
  const activeCls =
    variant === "gold"
      ? "border border-[var(--color-gold)] bg-[var(--color-gold)]/10 text-[var(--color-gold)]"
      : "bg-[var(--color-navy)] text-white";
  const inactiveCls =
    variant === "gold"
      ? "border border-[var(--color-gold)] bg-white text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/10"
      : "border border-[var(--color-gray-200)] bg-white text-[var(--color-navy)] transition hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]";

  // Режим курсов имеет приоритет: кнопки — из курсов, иначе из направлений.
  const byCourse = courses.length > 0;
  const source = byCourse ? courses : directions;

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "Все отзывы" },
      ...source.map((d) => ({ value: d.slug, label: d.label })),
    ],
    [source]
  );

  const filteredReviews = useMemo(() => {
    if (doctorFilter) return reviews;
    if (activeFilter === "all") return reviews;
    if (byCourse) {
      return reviews.filter((item) => item.courseSlug === activeFilter);
    }
    return reviews.filter((item) => item.directionSlugs?.includes(activeFilter));
  }, [activeFilter, reviews, doctorFilter, byCourse]);

  const totalPages = Math.ceil(filteredReviews.length / ITEMS_PER_PAGE);

  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredReviews.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredReviews, currentPage]);

  const selectFilter = (value: string) => {
    setActiveFilter(value);
    setCurrentPage(1);
  };

  return (
    <div>
      {doctorFilter ? (
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/reviews"
            className="inline-flex items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-navy)] transition hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]"
          >
            Все отзывы
          </Link>
          <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium text-white">
            {doctorFilter.name}
          </span>
        </div>
      ) : (
        <div className="mb-6 flex flex-wrap gap-2 sm:mb-8 sm:gap-3">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectFilter(option.value)}
                className={
                  isActive
                    ? `inline-flex items-center justify-center rounded-full ${activeCls} px-4 py-2 text-[13px] font-medium sm:px-5 sm:py-2.5 sm:text-sm`
                    : `inline-flex items-center justify-center rounded-full ${inactiveCls} px-4 py-2 text-[13px] font-medium sm:px-5 sm:py-2.5 sm:text-sm`
                }
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {paginatedReviews.length ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-8">
            {paginatedReviews.map((item) => (
              <ReviewCard key={item.slug} review={item} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm text-[var(--color-navy)] disabled:opacity-30"
              >
                ←
              </button>

              {Array.from({ length: totalPages }).map((_, index) => {
                const page = index + 1;
                const isActive = currentPage === page;
                return (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={
                      isActive
                        ? `rounded-full ${activeCls} px-3 py-1 text-sm`
                        : "rounded-full px-3 py-1 text-sm text-[var(--color-navy)] hover:bg-[var(--color-gray-100)]"
                    }
                  >
                    {page}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm text-[var(--color-navy)] disabled:opacity-30"
              >
                →
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white px-6 py-8">
          <p className="text-base leading-7 text-[var(--color-gray-700)]">
            Отзывов пока нет.
          </p>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useMemo, useState } from "react";
import { ReviewCard } from "@/components/reviews/review-card";
import type { ReviewItem } from "@/lib/reviews-data";

type ReviewsPageContentProps = {
  reviews: ReviewItem[];
};

const ITEMS_PER_PAGE = 6;

const filterOptions = [
  { value: "all", label: "Все отзывы" },
  { value: "endodontics", label: "Эндодонтия" },
  { value: "restoration", label: "Реставрации" },
  { value: "prosthetics", label: "Ортопедия" },
  { value: "implantation", label: "Имплантация" },
  { value: "gnathology", label: "Гнатология" },
];

export function ReviewsPageContent({ reviews }: ReviewsPageContentProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => {
      media.removeEventListener("change", update);
    };
  }, []);

  const filteredReviews = useMemo(() => {
    if (activeFilter === "all") return reviews;
    return reviews.filter((item) => item.directionSlugs?.includes(activeFilter));
  }, [activeFilter, reviews]);

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
      {isMobile ? (
        <div className="mb-8 mt-2 px-14">
          <div
            className="grid grid-cols-2"
            style={{ columnGap: "12px", rowGap: "14px" }}
          >
            {filterOptions.map((option, index) => {
              const isActive = activeFilter === option.value;
              return (
                <div
                  key={option.value}
                  style={{ marginLeft: index % 2 === 0 ? "50px" : "14px" }}
                >
                  <button
                    type="button"
                    onClick={() => selectFilter(option.value)}
                    className={
                      isActive
                        ? "inline-flex min-h-[36px] items-center justify-center rounded-full bg-[var(--color-navy)] px-4 py-1.5 text-[13px] font-medium text-white"
                        : "inline-flex min-h-[36px] items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-white px-4 py-1.5 text-[13px] font-medium text-[var(--color-navy)] transition active:scale-[0.98]"
                    }
                  >
                    {option.label}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="mb-8 flex flex-wrap gap-3">
          {filterOptions.map((option) => {
            const isActive = activeFilter === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectFilter(option.value)}
                className={
                  isActive
                    ? "inline-flex items-center justify-center rounded-full bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium text-white"
                    : "inline-flex items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-navy)] transition hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]"
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
          <div className="grid gap-8 lg:grid-cols-2">
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
                        ? "rounded-full bg-[var(--color-navy)] px-3 py-1 text-sm text-white"
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
            По выбранному направлению отзывов пока нет.
          </p>
        </div>
      )}
    </div>
  );
}
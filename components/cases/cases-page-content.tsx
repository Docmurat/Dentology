"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { CaseItem } from "@/lib/cases-data";
import { CaseCard } from "@/components/cases/case-card";
import { teamData } from "@/lib/team-data";

const ITEMS_PER_PAGE = 6;

export function CasesPageContent({
  cases,
  directions = [],
  doctorFilter = null,
  hideFilters = false,
  initialFilter = "all",
}: {
  cases: CaseItem[];
  directions?: { slug: string; label: string }[];
  doctorFilter?: { slug: string; name: string } | null;
  // Полностью скрыть строку фильтров (напр. переход с курса: врач + направление).
  hideFilters?: boolean;
  // Какое направление выбрано при открытии (переход со страницы направления).
  // Кнопки фильтра остаются видимыми — можно посмотреть и другие направления.
  initialFilter?: string;
}) {
  const [activeFilter, setActiveFilter] = useState(initialFilter);
  const [currentPage, setCurrentPage] = useState(1);

  // Кнопки фильтра и карта подписей — из направлений БД.
  const filterOptions = useMemo(
    () => [
      { value: "all", label: "Все случаи" },
      ...directions.map((d) => ({ value: d.slug, label: d.label })),
    ],
    [directions]
  );
  const dirLabel = useMemo(
    () => Object.fromEntries(directions.map((d) => [d.slug, d.label])),
    [directions]
  );

  const filteredCases = useMemo(() => {
    if (doctorFilter || hideFilters) return cases;
    if (activeFilter === "all") return cases;

    return cases.filter((item) => item.directionSlug === activeFilter);
  }, [activeFilter, cases, doctorFilter, hideFilters]);

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredCases.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCases, currentPage]);

  return (
    <div>
      {hideFilters ? null : (
        <div className="mb-8 flex flex-wrap gap-3">
          {doctorFilter ? (
            <>
              <Link
                href="/cases"
                className="inline-flex items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-navy)] transition hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]"
              >
                Все случаи
              </Link>
              <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium text-white">
                {doctorFilter.name}
              </span>
            </>
          ) : (
            filterOptions.map((option) => {
              const isActive = activeFilter === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setActiveFilter(option.value);
                    setCurrentPage(1);
                  }}
                  className={
                    isActive
                      ? "inline-flex items-center justify-center rounded-full bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium text-white"
                      : "inline-flex items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-white px-5 py-2.5 text-sm font-medium text-[var(--color-navy)] transition hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]"
                  }
                >
                  {option.label}
                </button>
              );
            })
          )}
        </div>
      )}

      {paginatedCases.length ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {paginatedCases.map((item) => {
              const doctor = teamData.find(
                (doc) => doc.slug === item.doctorSlug
              );

              return (
                <CaseCard
                  key={item.slug}
                  item={item}
                  dirLabel={dirLabel}
                  doctorName={doctor?.name}
                />
              );
            })}
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
            По выбранному направлению кейсов пока нет.
          </p>
        </div>
      )}
    </div>
  );
}
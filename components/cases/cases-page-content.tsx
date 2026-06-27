"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { CaseItem } from "@/lib/cases-data";
import { directionLabel } from "@/lib/directions";
import { CaseExcerpt } from "@/components/cases/case-excerpt";
import { teamData } from "@/lib/team-data";

const ITEMS_PER_PAGE = 6;

const filterOptions = [
  { value: "all", label: "Все случаи" },
  { value: "endodontics", label: "Эндодонтия" },
  { value: "restoration", label: "Реставрация" },
  { value: "prosthetics", label: "Ортопедия" },
  { value: "implantation", label: "Имплантация" },
  { value: "gnathology", label: "Гнатология" },
];

export function CasesPageContent({
  cases,
  doctorFilter = null,
}: {
  cases: CaseItem[];
  doctorFilter?: { slug: string; name: string } | null;
}) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredCases = useMemo(() => {
    if (doctorFilter) return cases;
    if (activeFilter === "all") return cases;

    return cases.filter((item) => item.directionSlug === activeFilter);
  }, [activeFilter, cases, doctorFilter]);

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);

  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;

    return filteredCases.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCases, currentPage]);

  return (
    <div>
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

      {paginatedCases.length ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            {paginatedCases.map((item) => {
              const doctor = teamData.find(
                (doc) => doc.slug === item.doctorSlug
              );

              return (
                <Link
                  key={item.slug}
                  href={`/cases/${item.slug}`}
                  className="group block h-full"
                >
                  <Card className="flex h-full flex-col overflow-hidden transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg">
                    <div className="relative mb-5">
                      <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-[var(--color-gray-100)]">
                        {item.coverImage ? (
                          <Image
                            src={item.coverImage}
                            alt={item.title}
                            width={1500}
                            height={1000}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                    </div>

                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                      {directionLabel(item.directionSlug)}
                    </p>

                    <h2 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                      {item.title}
                    </h2>

                    <CaseExcerpt text={item.excerpt} />

                    {doctor ? (
                      <p className="mt-5 text-sm font-medium text-[var(--color-navy-secondary)]">
                        {doctor.name}
                      </p>
                    ) : null}
                  </Card>
                </Link>
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
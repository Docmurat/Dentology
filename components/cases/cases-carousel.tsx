// components/cases/cases-carousel.tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { directionLabel } from "@/lib/directions";
import { CaseExcerpt } from "@/components/cases/case-excerpt";
import type { CaseItem } from "@/lib/cases-data";

export function CasesCarousel({
  cases,
  dirLabel = {},
}: {
  cases: CaseItem[];
  dirLabel?: Record<string, string>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth * 0.9 * dir, behavior: "smooth" });
  };

  // Прокручиваемая область без клавиатуры недоступна: мышью её листают,
  // с клавиатуры — нечем. Даём фокус и стрелки.
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scroll(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      scroll(-1);
    }
  };

  return (
    <div>
      <div
        ref={ref}
        role="region"
        aria-label="Клинические случаи, листается стрелками влево и вправо"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-1 py-8 -mx-1 -my-8 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-[var(--color-teal)] [&::-webkit-scrollbar]:hidden"
      >
        {cases.map((item) => (
          <div
            key={item.slug}
            className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
          >
            <Link
              href={`/cases/${item.slug}`}
              className="group block h-full"
            >
              <Card className="flex h-full flex-col overflow-hidden transition group-hover:-translate-y-1 group-hover:shadow-lg">
                <div className="relative mb-5">
                  <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl">
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
                  {directionLabel(item.directionSlug, dirLabel)}
                </p>

                <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                  {item.title}
                </h3>

                <CaseExcerpt text={item.excerpt} />
              </Card>
            </Link>
          </div>
        ))}
      </div>

      {cases.length > 1 ? (
        <div className="mt-6 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label="Предыдущие случаи"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-white text-[var(--color-navy)] transition hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label="Следующие случаи"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-gray-200)] bg-white text-[var(--color-navy)] transition hover:border-[var(--color-gray-300)] hover:bg-[var(--color-gray-50)]"
          >
            →
          </button>
        </div>
      ) : null}
    </div>
  );
}
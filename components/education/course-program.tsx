"use client";

import { useState } from "react";
import type { CourseModule } from "@/lib/courses";

/**
 * Программа курса.
 *
 * Телефон: список свёрнут до ~820px, кнопка «Показать всю программу».
 *   Разметка одна, весь текст остаётся в DOM — важно для SEO.
 * От 768px: сетка в две колонки, свёртка отключена.
 * От 1280px: три колонки — иначе строка пункта уходит за комфортные 75 символов.
 */
export function CourseProgram({ modules }: { modules: CourseModule[] }) {
  const [expanded, setExpanded] = useState(false);

  // Сворачиваем, только если модулей действительно много.
  const collapsible = modules.length > 4;
  const collapsed = collapsible && !expanded;

  return (
    <div className="relative">
      <div
        className={`grid gap-4 sm:gap-5 md:max-h-none md:grid-cols-2 md:overflow-visible xl:grid-cols-3 ${
          collapsed ? "max-h-[820px] overflow-hidden" : ""
        }`}
      >
        {modules.map((mod, i) => (
          <div
            key={mod.title}
            className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)]/10 text-xs font-semibold text-[var(--color-gold)]">
                {i + 1}
              </span>
              <h3 className="text-sm font-semibold leading-6 text-[var(--color-navy)] sm:text-base sm:leading-7">
                {mod.title}
              </h3>
            </div>

            {/* На телефоне без отступа под номер — экономим ширину строки */}
            <ul className="mt-3 space-y-2 sm:pl-9">
              {mod.items.map((item) => (
                <li
                  key={item}
                  className="flex gap-2 text-sm leading-6 text-[var(--color-gray-700)]"
                >
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-gold)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {collapsed ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white to-transparent md:hidden"
        />
      ) : null}

      {collapsible ? (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="relative mt-4 w-full rounded-xl border border-[var(--color-gold)] px-5 py-3 text-sm font-medium text-[var(--color-gold)] transition hover:bg-[var(--color-gold)]/10 md:hidden"
        >
          {expanded
            ? "Свернуть программу"
            : `Показать всю программу · ${modules.length} модулей`}
        </button>
      ) : null}
    </div>
  );
}
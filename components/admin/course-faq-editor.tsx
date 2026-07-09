"use client";

import { useState } from "react";
import type { CourseFaq } from "@/lib/courses";

const inputCls =
  "w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function CourseFaqEditor({ initial = [] }: { initial?: CourseFaq[] }) {
  const [rows, setRows] = useState<CourseFaq[]>(
    initial.length ? initial : [{ q: "", a: "" }]
  );

  const update = (i: number, key: keyof CourseFaq, v: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));
  const add = () => setRows((r) => [...r, { q: "", a: "" }]);
  const remove = (i: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));

  const clean = rows
    .map((r) => ({ q: r.q.trim(), a: r.a.trim() }))
    .filter((r) => r.q || r.a);

  return (
    <div className="space-y-3">
      <input type="hidden" name="faq" value={JSON.stringify(clean)} />

      {rows.map((row, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--color-gray-200)] bg-white p-3"
        >
          <div className="flex items-start gap-2">
            <span className="mt-2 text-xs font-semibold text-[var(--color-gray-400)]">
              {i + 1}
            </span>
            <div className="flex-1 space-y-2">
              <input
                value={row.q}
                onChange={(e) => update(i, "q", e.target.value)}
                className={inputCls}
                placeholder="Вопрос"
              />
              <textarea
                value={row.a}
                onChange={(e) => update(i, "a", e.target.value)}
                className={inputCls}
                rows={2}
                placeholder="Ответ"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Удалить"
              className="mt-1 shrink-0 rounded-lg border border-[var(--color-gray-200)] px-2.5 py-1 text-sm text-[var(--color-gray-500)] hover:text-red-600"
            >
              ✕
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-dashed border-[var(--color-gray-300)] px-3 py-1.5 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]"
      >
        + Добавить вопрос
      </button>
    </div>
  );
}
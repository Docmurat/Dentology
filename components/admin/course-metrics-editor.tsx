"use client";

import { useState } from "react";
import type { CourseMetric } from "@/lib/courses";

const inputCls =
  "w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function CourseMetricsEditor({
  initial = [],
}: {
  initial?: CourseMetric[];
}) {
  const [rows, setRows] = useState<CourseMetric[]>(
    initial.length ? initial : [{ value: "", label: "" }]
  );

  const update = (i: number, key: keyof CourseMetric, v: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));

  const add = () => setRows((r) => [...r, { value: "", label: "" }]);
  const remove = (i: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));

  // В форму уходит очищенный JSON-массив.
  const clean = rows
    .map((r) => ({ value: r.value.trim(), label: r.label.trim() }))
    .filter((r) => r.value || r.label);

  return (
    <div className="space-y-3">
      <input type="hidden" name="metrics" value={JSON.stringify(clean)} />

      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="w-40 shrink-0">
            <input
              value={row.value}
              onChange={(e) => update(i, "value", e.target.value)}
              className={inputCls}
              placeholder="Цифра (5 000+)"
            />
          </div>
          <div className="flex-1">
            <input
              value={row.label}
              onChange={(e) => update(i, "label", e.target.value)}
              className={inputCls}
              placeholder="Название (пролечено зубов)"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Удалить"
            className="mt-1 shrink-0 rounded-lg border border-[var(--color-gray-200)] px-3 py-1.5 text-sm text-[var(--color-gray-500)] hover:text-red-600"
          >
            ✕
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="rounded-lg border border-dashed border-[var(--color-gray-300)] px-3 py-1.5 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]"
      >
        + Добавить метрику
      </button>
    </div>
  );
}
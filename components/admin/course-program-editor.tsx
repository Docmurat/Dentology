"use client";

import { useState } from "react";
import type { CourseModule } from "@/lib/courses";

const inputCls =
  "w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

type Row = { title: string; itemsText: string };

export function CourseProgramEditor({
  initial = [],
}: {
  initial?: CourseModule[];
}) {
  const [rows, setRows] = useState<Row[]>(
    initial.length
      ? initial.map((m) => ({ title: m.title, itemsText: m.items.join("\n") }))
      : [{ title: "", itemsText: "" }]
  );

  const update = (i: number, key: keyof Row, v: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));
  const add = () => setRows((r) => [...r, { title: "", itemsText: "" }]);
  const remove = (i: number) =>
    setRows((r) => (r.length > 1 ? r.filter((_, idx) => idx !== i) : r));

  // В форму уходит массив модулей: заголовок + пункты (каждая строка — пункт).
  const clean = rows
    .map((r) => ({
      title: r.title.trim(),
      items: r.itemsText
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
    }))
    .filter((m) => m.title || m.items.length);

  return (
    <div className="space-y-3">
      <input type="hidden" name="program" value={JSON.stringify(clean)} />

      {rows.map((row, i) => (
        <div
          key={i}
          className="rounded-lg border border-[var(--color-gray-200)] bg-white p-3"
        >
          <div className="flex items-start gap-2">
            <span className="mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)]/10 text-xs font-semibold text-[var(--color-gold)]">
              {i + 1}
            </span>
            <div className="flex-1 space-y-2">
              <input
                value={row.title}
                onChange={(e) => update(i, "title", e.target.value)}
                className={inputCls}
                placeholder="Заголовок модуля"
              />
              <textarea
                value={row.itemsText}
                onChange={(e) => update(i, "itemsText", e.target.value)}
                className={inputCls}
                rows={3}
                placeholder="Пункты модуля — каждый с новой строки"
              />
            </div>
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Удалить модуль"
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
        + Добавить модуль
      </button>
    </div>
  );
}
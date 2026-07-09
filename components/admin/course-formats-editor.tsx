"use client";

import { useState } from "react";
import type { CourseFormat } from "@/lib/courses";

const LEARNING_TYPES = ["Индивидуальное", "Групповое", "Онлайн-консультация"];

const inputCls =
  "w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";
const labelCls = "text-xs font-medium text-[var(--color-gray-600)]";

type Row = {
  type: string;
  enabled: boolean;
  summary: string;
  pointsText: string;
  duration: string;
  price: string;
  priceNote: string;
  ctaLabel: string;
};

function buildRows(initial: CourseFormat[]): { rows: Row[]; rec: string } {
  let rec = "";
  // Порядок: сначала сохранённые форматы в их последовательности,
  // затем оставшиеся типы из фиксированного списка (в конец).
  const orderedTypes = [
    ...initial.map((f) => f.type).filter((t) => LEARNING_TYPES.includes(t)),
    ...LEARNING_TYPES.filter((t) => !initial.some((f) => f.type === t)),
  ];
  const rows = orderedTypes.map((type) => {
    const f = initial.find((x) => x.type === type);
    if (f?.recommended) rec = type;
    return {
      type,
      enabled: f ? f.enabled : false,
      summary: f?.summary ?? "",
      pointsText: f?.points.join("\n") ?? "",
      duration: f?.duration ?? "",
      price: f?.price ?? "",
      priceNote: f?.priceNote ?? "",
      ctaLabel: f?.ctaLabel ?? "Оставить заявку",
    };
  });
  return { rows, rec };
}

export function CourseFormatsEditor({
  initial = [],
}: {
  initial?: CourseFormat[];
}) {
  const start = buildRows(initial);
  const [rows, setRows] = useState<Row[]>(start.rows);
  const [recommended, setRecommended] = useState<string>(start.rec);

  const update = (i: number, key: keyof Row, v: string | boolean) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));

  const move = (i: number, dir: -1 | 1) =>
    setRows((r) => {
      const j = i + dir;
      if (j < 0 || j >= r.length) return r;
      const copy = [...r];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  // Сохраняем все форматы, где есть данные или которые включены —
  // чтобы выключенный формат не терял введённый текст.
  const clean = rows
    .filter(
      (r) =>
        r.enabled ||
        r.summary.trim() ||
        r.pointsText.trim() ||
        r.duration.trim() ||
        r.price.trim() ||
        r.priceNote.trim()
    )
    .map((r) => ({
      type: r.type,
      summary: r.summary.trim(),
      points: r.pointsText
        .split("\n")
        .map((x) => x.trim())
        .filter(Boolean),
      duration: r.duration.trim(),
      price: r.price.trim(),
      priceNote: r.priceNote.trim(),
      ctaLabel: r.ctaLabel.trim() || "Оставить заявку",
      recommended: r.enabled && r.type === recommended,
      enabled: r.enabled,
    }));

  return (
    <div className="space-y-3">
      <input type="hidden" name="formats" value={JSON.stringify(clean)} />

      {rows.map((row, i) => (
        <div
          key={row.type}
          className={`rounded-xl border p-4 transition ${
            row.enabled
              ? "border-[var(--color-gold)]/50 bg-white"
              : "border-[var(--color-gray-200)] bg-[var(--color-gray-50)]"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex flex-col leading-none">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="Выше"
                  className="px-1 text-xs text-[var(--color-gray-500)] hover:text-[var(--color-navy)] disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  aria-label="Ниже"
                  className="px-1 text-xs text-[var(--color-gray-500)] hover:text-[var(--color-navy)] disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <label className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-navy)]">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) => update(i, "enabled", e.target.checked)}
                />
                {row.type}
              </label>
            </div>

            {row.enabled ? (
              <label className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-gold)]">
                <input
                  type="radio"
                  name="recommendedFormat"
                  checked={recommended === row.type}
                  onChange={() => setRecommended(row.type)}
                />
                Рекомендуемая (золотая)
              </label>
            ) : null}
          </div>

          {row.enabled ? (
            <div className="mt-3 space-y-2">
              <div>
                <label className={labelCls}>Описание</label>
                <input
                  value={row.summary}
                  onChange={(e) => update(i, "summary", e.target.value)}
                  className={inputCls}
                  placeholder="Короткое описание формата"
                />
              </div>
              <div>
                <label className={labelCls}>
                  Пункты (каждый с новой строки)
                </label>
                <textarea
                  value={row.pointsText}
                  onChange={(e) => update(i, "pointsText", e.target.value)}
                  className={inputCls}
                  rows={3}
                  placeholder="Что входит в формат"
                />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className={labelCls}>Длительность</label>
                  <input
                    value={row.duration}
                    onChange={(e) => update(i, "duration", e.target.value)}
                    className={inputCls}
                    placeholder="напр. Индивидуально · очно"
                  />
                </div>
                <div>
                  <label className={labelCls}>Цена</label>
                  <input
                    value={row.price}
                    onChange={(e) => update(i, "price", e.target.value)}
                    className={inputCls}
                    placeholder="напр. 150 000 ₽"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Приписка к цене (необязательно)</label>
                <input
                  value={row.priceNote}
                  onChange={(e) => update(i, "priceNote", e.target.value)}
                  className={inputCls}
                  placeholder="напр. Приём пациентов — 50% от прайса"
                />
              </div>
              <div>
                <label className={labelCls}>Текст кнопки</label>
                <input
                  value={row.ctaLabel}
                  onChange={(e) => update(i, "ctaLabel", e.target.value)}
                  className={inputCls}
                  placeholder="Оставить заявку"
                />
              </div>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
"use client";

import { useState } from "react";
import { saveWhyContent } from "@/app/admin/homepage/actions";
import { ICON_MAP, ICON_KEYS } from "@/components/ui/icon-map";
import type { WhyContent, WhyItem } from "@/lib/homepage";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function WhyEditor({ initial }: { initial: WhyContent }) {
  const [items, setItems] = useState<WhyItem[]>(
    initial.items.length ? initial.items : [{ title: "", text: "", icon: "team" }]
  );

  function patch(i: number, data: Partial<WhyItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...data } : it)));
  }
  function add() {
    setItems((prev) => [...prev, { title: "", text: "", icon: "team" }]);
  }
  function remove(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={saveWhyContent} className="space-y-4">
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div>
        <label className={labelCls}>Надзаголовок</label>
        <input name="eyebrow" defaultValue={initial.eyebrow} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Заголовок</label>
        <textarea
          name="title"
          rows={2}
          defaultValue={initial.title}
          className={inputCls}
        />
      </div>

      <p className="pt-2 text-sm font-semibold text-[var(--color-navy)]">
        Карточки
      </p>

      {items.map((item, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--color-gray-200)] bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-gray-500)]">Карточка {i + 1}</p>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Удалить
            </button>
          </div>

          <div className="mt-2 space-y-2">
            <input
              value={item.title}
              onChange={(e) => patch(i, { title: e.target.value })}
              className={inputCls}
              placeholder="Заголовок"
            />
            <textarea
              value={item.text}
              onChange={(e) => patch(i, { text: e.target.value })}
              rows={2}
              className={inputCls}
              placeholder="Текст"
            />
          </div>

          <div className="mt-3">
            <p className="text-xs text-[var(--color-gray-500)]">Иконка</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ICON_KEYS.map((key) => {
                const Icon = ICON_MAP[key].comp;
                const active = item.icon === key;
                return (
                  <button
                    key={key}
                    type="button"
                    title={ICON_MAP[key].label}
                    onClick={() => patch(i, { icon: key })}
                    className={
                      "flex h-10 w-10 items-center justify-center rounded-lg border transition " +
                      (active
                        ? "border-[var(--color-teal)] bg-[var(--color-teal)]/10 text-[var(--color-navy)]"
                        : "border-[var(--color-gray-200)] text-[var(--color-gray-500)] hover:border-[var(--color-teal)]")
                    }
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-xl border border-dashed border-[var(--color-gray-300)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-navy)] hover:border-[var(--color-teal)]"
      >
        + Добавить карточку
      </button>

      <button
        type="submit"
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90"
      >
        Сохранить блок
      </button>
    </form>
  );
}
"use client";

import { useState } from "react";
import { saveEducationContent } from "@/app/admin/homepage/actions";
import type { EducationContent } from "@/lib/homepage";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function EducationEditor({ initial }: { initial: EducationContent }) {
  const [bullets, setBullets] = useState<string[]>(
    initial.bullets.length ? initial.bullets : [""]
  );

  function patch(i: number, value: string) {
    setBullets((prev) => prev.map((b, idx) => (idx === i ? value : b)));
  }
  function add() {
    setBullets((prev) => [...prev, ""]);
  }
  function remove(i: number) {
    setBullets((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={saveEducationContent} className="space-y-4">
      <input type="hidden" name="bullets" value={JSON.stringify(bullets)} />

      <div>
        <label className={labelCls}>Надзаголовок</label>
        <input name="eyebrow" defaultValue={initial.eyebrow} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Заголовок</label>
        <textarea name="title" rows={2} defaultValue={initial.title} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Описание</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={initial.description}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Бейдж (в карточке справа)</label>
        <input name="badge" defaultValue={initial.badge} className={inputCls} />
      </div>

      <div>
        <p className={labelCls}>Пункты списка (в карточке справа)</p>
        <div className="mt-2 space-y-2">
          {bullets.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={b}
                onChange={(e) => patch(i, e.target.value)}
                className={inputCls}
                placeholder="Пункт"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
              >
                Удалить
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={add}
          className="mt-2 w-full rounded-xl border border-dashed border-[var(--color-gray-300)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-navy)] hover:border-[var(--color-teal)]"
        >
          + Добавить пункт
        </button>
      </div>

      <div>
        <label className={labelCls}>Текст кнопки</label>
        <input
          name="primaryLabel"
          defaultValue={initial.primaryLabel}
          className={inputCls}
          placeholder="напр. Смотреть курсы"
        />
        <p className="mt-1 text-xs text-[var(--color-gray-500)]">
          Кнопка ведёт в каталог обучения (/education).
        </p>
      </div>

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
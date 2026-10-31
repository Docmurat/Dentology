"use client";

import { useState } from "react";
import { saveEndoPricesContent } from "@/app/admin/homepage/actions";
import {
  TOOTH_VISUALS,
  type EndoPricesContent,
  type EndoStage,
} from "@/lib/endo-prices";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const hintCls = "mt-1 text-xs text-[var(--color-gray-500)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

const EMPTY: EndoStage = {
  title: "",
  text: "",
  price: 0,
  priceFrom: false,
  perCanal: false,
  scenario: "both",
  optional: false,
  condition: "",
  visual: "start",
};

export function EndoPricesEditor({ initial }: { initial: EndoPricesContent }) {
  const [stages, setStages] = useState<EndoStage[]>(
    initial.stages.length ? initial.stages : [EMPTY]
  );

  function patch(i: number, data: Partial<EndoStage>) {
    setStages((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...data } : it)));
  }
  function move(i: number, dir: -1 | 1) {
    setStages((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  // Этап без названия сайт не покажет, а пустой список заменится
  // стандартными этапами. Не даём сохранить такое молча.
  const invalid = !stages.length || stages.some((s) => !s.title.trim());

  return (
    <form action={saveEndoPricesContent} className="space-y-4">
      <input type="hidden" name="stages" value={JSON.stringify(stages)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Надзаголовок</label>
          <input name="eyebrow" defaultValue={initial.eyebrow} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Заголовок</label>
          <input name="title" defaultValue={initial.title} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Описание</label>
        <textarea name="description" rows={2} defaultValue={initial.description} className={inputCls} />
      </div>

      <p className="pt-2 text-sm font-semibold text-[var(--color-navy)]">Этапы</p>
      <p className={hintCls}>
        Порядок этапов — порядок на сайте. Цена в рублях, только число. Цена 0 —
        цена не показывается. Обязательные этапы входят в итог, необязательные
        перечисляются под ним отдельно.
      </p>

      {stages.map((stage, i) => (
        <div key={i} className="rounded-xl border border-[var(--color-gray-200)] bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--color-gray-500)]">Этап {i + 1}</p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Выше" className="text-sm disabled:opacity-30">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === stages.length - 1} aria-label="Ниже" className="text-sm disabled:opacity-30">↓</button>
              <button
                type="button"
                onClick={() => setStages((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-xs font-medium text-red-600 hover:text-red-700"
              >
                Удалить
              </button>
            </div>
          </div>

          <div className="mt-2 grid gap-3">
            <input
              value={stage.title}
              onChange={(e) => patch(i, { title: e.target.value })}
              className={inputCls}
              placeholder="Название этапа"
            />
            <textarea
              value={stage.text}
              rows={2}
              onChange={(e) => patch(i, { text: e.target.value })}
              className={inputCls}
              placeholder="Что делается на этапе"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Цена, ₽</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={stage.price || ""}
                  onChange={(e) => patch(i, { price: Number(e.target.value) || 0 })}
                  className={inputCls}
                  placeholder="0"
                />
              </div>
              <div>
                <label className={labelCls}>Для какого лечения</label>
                <select
                  value={stage.scenario}
                  onChange={(e) => patch(i, { scenario: e.target.value as EndoStage["scenario"] })}
                  className={inputCls}
                >
                  <option value="both">Для обоих</option>
                  <option value="primary">Только первичное</option>
                  <option value="retreat">Только перелечивание</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Картинка зуба</label>
                <select
                  value={stage.visual}
                  onChange={(e) => patch(i, { visual: e.target.value as EndoStage["visual"] })}
                  className={inputCls}
                >
                  {TOOTH_VISUALS.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--color-navy)]">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={stage.priceFrom} onChange={(e) => patch(i, { priceFrom: e.target.checked })} />
                Цена «от»
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={stage.perCanal} onChange={(e) => patch(i, { perCanal: e.target.checked })} />
                За каждый канал
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={stage.optional} onChange={(e) => patch(i, { optional: e.target.checked })} />
                Нужен не всегда
              </label>
            </div>

            {stage.optional ? (
              <input
                value={stage.condition}
                onChange={(e) => patch(i, { condition: e.target.value })}
                className={inputCls}
                placeholder="Когда нужен: «если в канале есть штифт»"
              />
            ) : null}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setStages((prev) => [...prev, EMPTY])}
        className="w-full rounded-xl border border-dashed border-[var(--color-gray-300)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-navy)] hover:border-[var(--color-teal)]"
      >
        + Добавить этап
      </button>

      <div>
        <label className={labelCls}>Пояснения под итогом</label>
        <textarea name="notes" rows={3} defaultValue={initial.notes.join("\n")} className={inputCls} />
        <p className={hintCls}>Каждое пояснение с новой строки.</p>
      </div>

      {invalid ? (
        <p className="text-sm text-red-600">
          Чтобы сохранить, у каждого этапа должно быть название, и хотя бы один
          этап должен остаться.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={invalid}
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-40"
      >
        Сохранить блок
      </button>
    </form>
  );
}

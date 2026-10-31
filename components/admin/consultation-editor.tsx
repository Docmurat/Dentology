"use client";

import { useState } from "react";
import { saveConsultationContent } from "@/app/admin/homepage/actions";
import type { ConsultationContent, ConsultationStep } from "@/lib/homepage";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const hintCls = "mt-1 text-xs text-[var(--color-gray-500)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function ConsultationEditor({ initial }: { initial: ConsultationContent }) {
  const [steps, setSteps] = useState<ConsultationStep[]>(
    initial.steps.length ? initial.steps : [{ title: "", text: "" }]
  );

  function patch(i: number, data: Partial<ConsultationStep>) {
    setSteps((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...data } : it)));
  }
  function add() {
    setSteps((prev) => [...prev, { title: "", text: "" }]);
  }
  function remove(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
  }

  return (
    <form action={saveConsultationContent} className="space-y-4">
      {/* Шаги уходят на сервер JSON-строкой. */}
      <input type="hidden" name="steps" value={JSON.stringify(steps)} />

      <div className="rounded-xl border border-[var(--color-teal)]/40 bg-white p-4">
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Цена, длительность и срок ответа
        </p>
        <p className={hintCls}>
          Показываются под кнопками записи по всему сайту и в этом блоке.
          Пустое поле просто не выводится.
        </p>

        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Стоимость</label>
            <input
              name="price"
              defaultValue={initial.price}
              className={inputCls}
              placeholder="например, 3 000 ₽"
            />
          </div>
          <div>
            <label className={labelCls}>Длительность</label>
            <input
              name="duration"
              defaultValue={initial.duration}
              className={inputCls}
              placeholder="например, 40 минут"
            />
          </div>
          <div>
            <label className={labelCls}>Срок ответа на заявку</label>
            <input
              name="responseNote"
              defaultValue={initial.responseNote}
              className={inputCls}
              placeholder="Ответим в течение дня"
            />
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Надзаголовок</label>
        <input name="eyebrow" defaultValue={initial.eyebrow} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Заголовок</label>
        <input name="title" defaultValue={initial.title} className={inputCls} />
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

      <p className="pt-2 text-sm font-semibold text-[var(--color-navy)]">Шаги</p>

      {steps.map((step, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--color-gray-200)] bg-white p-4"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-gray-500)]">Шаг {i + 1}</p>
            <button
              type="button"
              onClick={() => remove(i)}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Удалить
            </button>
          </div>
          <div className="mt-2 grid gap-3 sm:grid-cols-[1fr_2fr]">
            <input
              value={step.title}
              onChange={(e) => patch(i, { title: e.target.value })}
              className={inputCls}
              placeholder="Заголовок"
            />
            <textarea
              value={step.text}
              rows={2}
              onChange={(e) => patch(i, { text: e.target.value })}
              className={inputCls}
              placeholder="Текст"
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full rounded-xl border border-dashed border-[var(--color-gray-300)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-navy)] hover:border-[var(--color-teal)]"
      >
        + Добавить шаг
      </button>

      <div>
        <label className={labelCls}>Заголовок списка «Что взять с собой»</label>
        <input
          name="bringTitle"
          defaultValue={initial.bringTitle}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Что взять с собой</label>
        <textarea
          name="bring"
          rows={4}
          defaultValue={initial.bring.join("\n")}
          className={inputCls}
        />
        <p className={hintCls}>Каждый пункт с новой строки.</p>
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

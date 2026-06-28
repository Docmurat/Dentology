"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createDirection,
  updateDirection,
} from "@/app/admin/directions/actions";
import type { DirectionItem } from "@/lib/directions-db";

const cardCls =
  "rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 space-y-4";
const labelCls = "block text-sm font-medium text-[var(--color-navy)] mb-1";
const inputCls =
  "w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm";

type FaqItem = { question: string; answer: string };

export function DirectionForm({ initial }: { initial?: DirectionItem }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [faq, setFaq] = useState<FaqItem[]>(
    initial?.faq?.length ? initial.faq : [{ question: "", answer: "" }]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const formData = new FormData(e.currentTarget);
    formData.set(
      "faq",
      JSON.stringify(
        faq.filter((q) => q.question.trim() && q.answer.trim())
      )
    );

    const action = isEdit ? updateDirection : createDirection;
    const res = await action(formData);
    setPending(false);

    if (res?.error) {
      setError(res.error);
      return;
    }

    router.push("/admin/directions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isEdit ? (
        <input type="hidden" name="originalSlug" value={initial!.slug} />
      ) : null}

      {/* Основное */}
      <div className={cardCls}>
        <div>
          <label className={labelCls}>Название *</label>
          <input
            name="title"
            defaultValue={initial?.title}
            required
            className={inputCls}
            placeholder="Эндодонтия"
          />
        </div>

        <div>
          <label className={labelCls}>Короткая подпись</label>
          <input
            name="short"
            defaultValue={initial?.short}
            className={inputCls}
            placeholder="Лечение корневых каналов"
          />
        </div>

        <div>
          <label className={labelCls}>
            Slug (латиницей — в адресе страницы и привязке кейсов)
          </label>
          <input
            name="slug"
            defaultValue={initial?.slug}
            className={inputCls}
            placeholder="endodontics"
            readOnly={isEdit}
          />
          {isEdit ? (
            <p className="mt-1 text-xs text-[var(--color-gray-500)]">
              Slug менять нельзя — к нему привязаны кейсы и отзывы.
            </p>
          ) : null}
        </div>
      </div>

      {/* Описания */}
      <div className={cardCls}>
        <div>
          <label className={labelCls}>Краткое описание под заголовком</label>
          <textarea
            name="heroDescription"
            defaultValue={initial?.heroDescription}
            rows={2}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Полное описание (блок «О направлении»)</label>
          <textarea
            name="description"
            defaultValue={initial?.description}
            rows={5}
            className={inputCls}
          />
        </div>
      </div>

      {/* Коллаж на главной */}
      <div className={cardCls}>
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Коллаж на главной
        </p>

        <div>
          <label className={labelCls}>Позиция</label>
          <select
            name="collageRole"
            defaultValue={initial?.collageRole ?? "small"}
            className={inputCls}
          >
            <option value="featured">Главное (большая левая карточка)</option>
            <option value="large">Большое (широкая карточка)</option>
            <option value="small">Маленькое (в сетке)</option>
          </select>
          <p className="mt-1 text-xs text-[var(--color-gray-500)]">
            «Главное» направление может быть только одно — при выборе оно
            снимется у остальных.
          </p>
        </div>

        <div>
          <label className={labelCls}>Порядок (меньше число — выше)</label>
          <input
            name="sortOrder"
            type="number"
            defaultValue={initial?.sortOrder ?? 0}
            className={inputCls}
          />
        </div>
      </div>

      {/* Контентные блоки */}
      <div className={cardCls}>
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Контентные блоки (по одному пункту на строку)
        </p>

        <div>
          <label className={labelCls}>С какими проблемами приходят</label>
          <textarea
            name="problems"
            defaultValue={initial?.problems?.join("\n")}
            rows={5}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Опасения пациентов</label>
          <textarea
            name="fears"
            defaultValue={initial?.fears?.join("\n")}
            rows={4}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Наш подход</label>
          <textarea
            name="approach"
            defaultValue={initial?.approach?.join("\n")}
            rows={4}
            className={inputCls}
          />
        </div>
      </div>

      {/* Вставка-insight */}
      <div className={cardCls}>
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Блок-вставка
        </p>

        <div>
          <label className={labelCls}>Заголовок вставки</label>
          <input
            name="insightTitle"
            defaultValue={initial?.insightTitle}
            className={inputCls}
            placeholder="Когда диагноз требует пересмотра"
          />
        </div>

        <div>
          <label className={labelCls}>Абзацы вставки (по одному на строку)</label>
          <textarea
            name="insightText"
            defaultValue={initial?.insightText?.join("\n")}
            rows={4}
            className={inputCls}
          />
        </div>
      </div>

      {/* FAQ */}
      <div className={cardCls}>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-navy)]">
            Частые вопросы
          </p>
          <button
            type="button"
            onClick={() => setFaq([...faq, { question: "", answer: "" }])}
            className="text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
          >
            + Вопрос
          </button>
        </div>

        {faq.map((item, i) => (
          <div
            key={i}
            className="space-y-2 rounded-xl border border-[var(--color-gray-200)] p-4"
          >
            <input
              value={item.question}
              onChange={(e) => {
                const next = [...faq];
                next[i] = { ...next[i], question: e.target.value };
                setFaq(next);
              }}
              className={inputCls}
              placeholder="Вопрос"
            />
            <textarea
              value={item.answer}
              onChange={(e) => {
                const next = [...faq];
                next[i] = { ...next[i], answer: e.target.value };
                setFaq(next);
              }}
              rows={2}
              className={inputCls}
              placeholder="Ответ"
            />
            <button
              type="button"
              onClick={() => setFaq(faq.filter((_, j) => j !== i))}
              className="text-xs font-medium text-red-600 hover:text-red-700"
            >
              Удалить вопрос
            </button>
          </div>
        ))}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          style={{ color: "#ffffff" }}
          className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
        >
          {pending
            ? "Сохранение…"
            : isEdit
              ? "Сохранить"
              : "Добавить направление"}
        </button>
      </div>
    </form>
  );
}
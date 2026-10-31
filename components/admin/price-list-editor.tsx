"use client";

import { useState } from "react";
import { savePriceListContent } from "@/app/admin/prices/actions";
import type {
  PriceCategory,
  PriceItem,
  PriceListContent,
} from "@/lib/price-list";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const hintCls = "mt-1 text-xs text-[var(--color-gray-500)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";
const smallBtn = "text-sm text-[var(--color-navy)] disabled:opacity-30";

const EMPTY_ITEM: PriceItem = {
  name: "",
  price: 0,
  priceFrom: false,
  unit: "",
  note: "",
};

const EMPTY_CATEGORY: PriceCategory = {
  slug: "",
  title: "",
  description: "",
  directionSlug: "",
  source: "none",
  items: [],
};

const SOURCE_HINT: Record<PriceCategory["source"], string> = {
  none: "",
  "endo-stages":
    "Цены лечения каналов берутся из блока «Этапы и стоимость лечения каналов» (Главная → конструктор). Здесь можно добавить другие позиции.",
  consultation:
    "Цена и длительность консультации берутся из блока «Как проходит консультация» (Главная → конструктор). Здесь можно добавить диагностику: снимки, КЛКТ.",
};

function move<T>(list: T[], i: number, dir: -1 | 1): T[] {
  const j = i + dir;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

export function PriceListEditor({ initial }: { initial: PriceListContent }) {
  const [categories, setCategories] = useState<PriceCategory[]>(
    initial.categories,
  );

  function patchCategory(ci: number, data: Partial<PriceCategory>) {
    setCategories((prev) =>
      prev.map((c, idx) => (idx === ci ? { ...c, ...data } : c)),
    );
  }
  function patchItem(ci: number, ii: number, data: Partial<PriceItem>) {
    setCategories((prev) =>
      prev.map((c, idx) =>
        idx === ci
          ? {
              ...c,
              items: c.items.map((it, j) =>
                j === ii ? { ...it, ...data } : it,
              ),
            }
          : c,
      ),
    );
  }

  const invalid =
    categories.some((c) => !c.title.trim()) ||
    categories.some((c) => c.items.some((it) => !it.name.trim()));

  return (
    <form action={savePriceListContent} className="space-y-6">
      <input
        type="hidden"
        name="categories"
        value={JSON.stringify(categories)}
      />

      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
        <div>
          <label className={labelCls}>Заголовок страницы</label>
          <input
            name="title"
            defaultValue={initial.title}
            className={inputCls}
          />
        </div>
        <div className="mt-4">
          <label className={labelCls}>Описание</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={initial.description}
            className={inputCls}
          />
        </div>
      </div>

      {categories.map((category, ci) => (
        <div
          key={ci}
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--color-navy)]">
              Раздел {ci + 1}
              {category.title ? ` — ${category.title}` : ""}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={smallBtn}
                disabled={ci === 0}
                aria-label="Раздел выше"
                onClick={() => setCategories((p) => move(p, ci, -1))}
              >
                ↑
              </button>
              <button
                type="button"
                className={smallBtn}
                disabled={ci === categories.length - 1}
                aria-label="Раздел ниже"
                onClick={() => setCategories((p) => move(p, ci, 1))}
              >
                ↓
              </button>
              <button
                type="button"
                className="text-xs font-medium text-red-600 hover:text-red-700"
                onClick={() =>
                  setCategories((p) => p.filter((_, idx) => idx !== ci))
                }
              >
                Удалить раздел
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Название раздела</label>
              <input
                value={category.title}
                onChange={(e) => patchCategory(ci, { title: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Ссылка на направление</label>
              <input
                value={category.directionSlug}
                onChange={(e) =>
                  patchCategory(ci, { directionSlug: e.target.value })
                }
                className={inputCls}
                placeholder="например, restoration"
              />
              <p className={hintCls}>
                Адрес направления на сайте после /directions/. Пусто — без
                ссылки.
              </p>
            </div>
          </div>
          <div className="mt-3">
            <label className={labelCls}>Описание раздела</label>
            <textarea
              value={category.description}
              rows={2}
              onChange={(e) =>
                patchCategory(ci, { description: e.target.value })
              }
              className={inputCls}
            />
          </div>

          {SOURCE_HINT[category.source] ? (
            <p className="mt-3 rounded-lg bg-[var(--color-teal)]/10 px-3 py-2 text-xs leading-5 text-[var(--color-navy)]">
              {SOURCE_HINT[category.source]}
            </p>
          ) : null}

          <div className="mt-4 space-y-3">
            {category.items.map((item, ii) => (
              <div
                key={ii}
                className="rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-3"
              >
                <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
                  <input
                    value={item.name}
                    onChange={(e) =>
                      patchItem(ci, ii, { name: e.target.value })
                    }
                    className={inputCls}
                    placeholder="Услуга"
                  />
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={item.price || ""}
                    onChange={(e) =>
                      patchItem(ci, ii, { price: Number(e.target.value) || 0 })
                    }
                    className={inputCls}
                    placeholder="Цена, ₽ (пусто — по запросу)"
                  />
                  <input
                    value={item.unit}
                    onChange={(e) =>
                      patchItem(ci, ii, { unit: e.target.value })
                    }
                    className={inputCls}
                    placeholder="за зуб, за единицу…"
                  />
                </div>
                <input
                  value={item.note}
                  onChange={(e) => patchItem(ci, ii, { note: e.target.value })}
                  className={`${inputCls} mt-2`}
                  placeholder="Пояснение (необязательно)"
                />
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 text-sm text-[var(--color-navy)]">
                    <input
                      type="checkbox"
                      checked={item.priceFrom}
                      onChange={(e) =>
                        patchItem(ci, ii, { priceFrom: e.target.checked })
                      }
                    />
                    Цена «от»
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={smallBtn}
                      disabled={ii === 0}
                      aria-label="Выше"
                      onClick={() =>
                        patchCategory(ci, {
                          items: move(category.items, ii, -1),
                        })
                      }
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={smallBtn}
                      disabled={ii === category.items.length - 1}
                      aria-label="Ниже"
                      onClick={() =>
                        patchCategory(ci, {
                          items: move(category.items, ii, 1),
                        })
                      }
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="text-xs font-medium text-red-600 hover:text-red-700"
                      onClick={() =>
                        patchCategory(ci, {
                          items: category.items.filter((_, j) => j !== ii),
                        })
                      }
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                patchCategory(ci, { items: [...category.items, EMPTY_ITEM] })
              }
              className="w-full rounded-xl border border-dashed border-[var(--color-gray-300)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-navy)] hover:border-[var(--color-teal)]"
            >
              + Добавить позицию
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setCategories((p) => [...p, EMPTY_CATEGORY])}
        className="w-full rounded-xl border border-dashed border-[var(--color-gray-300)] bg-white px-4 py-3 text-sm font-medium text-[var(--color-navy)] hover:border-[var(--color-teal)]"
      >
        + Добавить раздел
      </button>

      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
        <label className={labelCls}>Пояснения внизу страницы</label>
        <textarea
          name="notes"
          rows={3}
          defaultValue={initial.notes.join("\n")}
          className={inputCls}
        />
        <p className={hintCls}>Каждое пояснение с новой строки.</p>
      </div>

      {invalid ? (
        <p className="text-sm text-red-600">
          Чтобы сохранить, у каждого раздела и каждой позиции должно быть
          название.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={invalid}
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-40"
      >
        Сохранить цены
      </button>
    </form>
  );
}

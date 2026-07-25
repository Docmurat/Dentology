// components/admin/review-edit-form.tsx
"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateReview } from "@/app/admin/reviews/actions";
import { ReviewImageField } from "@/components/admin/review-image-field";

type State = { error?: string; ok?: boolean };

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function ReviewEditForm({
  review,
  doctors,
  directions,
  backTo = "/admin/reviews",
}: {
  review: {
    id: string;
    author: string;
    text: string;
    doctor_slug: string | null;
    direction_slugs: string[] | null;
    instagram: string | null;
    review_date: string | null;
    sort_order: number | null;
    image: string | null;
    course_slug: string | null;
    course_title: string | null;
    pros: string | null;
    cons: string | null;
    wishes: string | null;
  };
  doctors: { slug: string; name: string }[];
  directions: { slug: string; label: string }[];
  /** Куда вернуться после сохранения. У модератора свой раздел. */
  backTo?: string;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<State, FormData>(
    updateReview,
    {}
  );
  const [dirs, setDirs] = useState<string[]>(review.direction_slugs ?? []);

  const isCourse = Boolean(review.course_slug);

  useEffect(() => {
    if (state.ok) {
      router.push(backTo);
      router.refresh();
    }
  }, [state.ok, router, backTo]);

  const toggle = (slug: string) =>
    setDirs((prev) =>
      prev.includes(slug)
        ? prev.filter((s) => s !== slug)
        : prev.length < 3
          ? [...prev, slug]
          : prev
    );

  return (
    <form action={action} className="max-w-xl space-y-4">
      <input type="hidden" name="id" value={review.id} />

      {isCourse ? (
        <div className="rounded-lg bg-[var(--color-gold)]/10 px-3 py-2 text-sm text-[var(--color-navy)]">
          Отзыв о курсе:{" "}
          <span className="font-medium">
            {review.course_title || review.course_slug}
          </span>
        </div>
      ) : null}

      <div>
        <label className={labelCls}>Фамилия и имя *</label>
        <input
          name="author"
          required
          defaultValue={review.author}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Instagram</label>
        <input
          name="instagram"
          defaultValue={review.instagram ?? ""}
          className={inputCls}
          placeholder="@username или ссылка"
        />
      </div>

      {/* Врач и направления — только для пациентских отзывов. */}
      {isCourse ? null : (
        <>
          <div>
            <label className={labelCls}>Врач</label>
            <select
              name="doctorSlug"
              defaultValue={review.doctor_slug ?? ""}
              className={inputCls}
            >
              <option value="">— не выбран —</option>
              {doctors.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Направления (до 3) *</label>
            <div className="mt-2 flex flex-wrap gap-3">
              {directions.map((d) => {
                const isOn = dirs.includes(d.slug);
                return (
                  <label
                    key={d.slug}
                    className={
                      "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm " +
                      (isOn
                        ? "border-[var(--color-teal)] bg-[var(--color-teal)]/10 text-[var(--color-navy)]"
                        : "border-[var(--color-gray-200)] text-[var(--color-navy)]")
                    }
                  >
                    <input
                      type="checkbox"
                      name="directionSlug"
                      value={d.slug}
                      checked={isOn}
                      onChange={() => toggle(d.slug)}
                      disabled={!isOn && dirs.length >= 3}
                    />
                    {d.label}
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Дата</label>
          <input
            name="reviewDate"
            type="date"
            defaultValue={review.review_date ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Порядковый номер</label>
          <input
            name="sortOrder"
            type="number"
            min={1}
            defaultValue={review.sort_order ?? ""}
            className={inputCls}
            placeholder="напр. 3 — всегда третий"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Текст отзыва *</label>
        <textarea
          name="text"
          rows={6}
          required
          defaultValue={review.text}
          className={inputCls}
        />
      </div>

      {/* Разделы курс-отзыва — сплошной текст, каждая строка станет пунктом. */}
      {isCourse ? (
        <>
          <div>
            <label className={labelCls}>Плюсы</label>
            <textarea
              name="pros"
              rows={3}
              defaultValue={review.pros ?? ""}
              className={inputCls}
              placeholder="Каждый пункт — с новой строки"
            />
          </div>
          <div>
            <label className={labelCls}>Минусы</label>
            <textarea
              name="cons"
              rows={3}
              defaultValue={review.cons ?? ""}
              className={inputCls}
              placeholder="Каждый пункт — с новой строки"
            />
          </div>
          <div>
            <label className={labelCls}>Что бы я добавил</label>
            <textarea
              name="wishes"
              rows={3}
              defaultValue={review.wishes ?? ""}
              className={inputCls}
              placeholder="Каждый пункт — с новой строки"
            />
          </div>
        </>
      ) : null}

      <div>
        <label className={labelCls}>Фото</label>
        <div className="mt-2">
          <ReviewImageField id={review.id} current={review.image} />
        </div>
      </div>

      {state.error ? (
        <p className="text-sm text-red-600">{state.error}</p>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Сохранение…" : "Сохранить"}
        </button>
        <button
          type="button"
          onClick={() => router.push(backTo)}
          className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
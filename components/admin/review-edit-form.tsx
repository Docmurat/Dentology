"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateReview } from "@/app/admin/reviews/actions";

type State = { error?: string; ok?: boolean };

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

const DIRECTIONS = [
  { slug: "endodontics", label: "Эндодонтия" },
  { slug: "implantation", label: "Имплантация" },
  { slug: "gnathology", label: "Гнатология" },
  { slug: "prosthetics", label: "Ортопедия" },
  { slug: "restoration", label: "Реставрация" },
];

export function ReviewEditForm({
  review,
}: {
  review: {
    id: string;
    author: string;
    text: string;
    direction_slug: string | null;
    review_date: string | null;
  };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<State, FormData>(
    updateReview,
    {}
  );

  useEffect(() => {
    if (state.ok) {
      router.push("/admin/reviews");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <form action={action} className="max-w-xl space-y-4">
      <input type="hidden" name="id" value={review.id} />

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
        <label className={labelCls}>Направление *</label>
        <select
          name="directionSlug"
          defaultValue={review.direction_slug ?? ""}
          required
          className={inputCls}
        >
          <option value="" disabled>
            — выберите —
          </option>
          {DIRECTIONS.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

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
        <label className={labelCls}>Текст отзыва *</label>
        <textarea
          name="text"
          rows={6}
          required
          defaultValue={review.text}
          className={inputCls}
        />
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
          onClick={() => router.push("/admin/reviews")}
          className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
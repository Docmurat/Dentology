"use client";

import { useActionState, useEffect, useState } from "react";
import { submitReview } from "@/app/reviews/actions";

type State = { error?: string; ok?: boolean };
type DoctorOption = { slug: string; name: string };

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

function ReviewModal({
  doctors,
  courseSlug,
  onClose,
}: {
  doctors: DoctorOption[];
  courseSlug?: string;
  onClose: () => void;
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    submitReview,
    {}
  );
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  // После успешной отправки окно закрывается само через 3 секунды.
  useEffect(() => {
    if (!state.ok) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [state.ok, onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        {state.ok ? (
          <p className="py-10 text-center text-lg font-medium text-[var(--color-navy)]">
            Спасибо за отзыв
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-[var(--color-navy)]">
                Оставить отзыв
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="text-xl leading-none text-[var(--color-gray-400)] hover:text-[var(--color-navy)]"
              >
                ×
              </button>
            </div>

            <form action={action} className="mt-4 space-y-4">
              {/* honeypot */}
              <input
                type="text"
                name="company"
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* Режим курса: отзыв привязывается к курсу, выбор врача не нужен. */}
              {courseSlug ? (
                <input type="hidden" name="courseSlug" value={courseSlug} />
              ) : null}

              <div>
                <label className={labelCls}>Как вас зовут *</label>
                <input
                  name="author"
                  required
                  className={inputCls}
                  placeholder="Имя Фамилия"
                />
              </div>

              {courseSlug ? null : (
                <div>
                  <label className={labelCls}>Врач</label>
                  <select name="doctorSlug" defaultValue="" className={inputCls}>
                    <option value="">— не выбирать —</option>
                    {doctors.map((d) => (
                      <option key={d.slug} value={d.slug}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className={labelCls}>Instagram</label>
                <input
                  name="instagram"
                  className={inputCls}
                  placeholder="@username или ссылка"
                />
              </div>

              <div>
                <label className={labelCls}>Телефон *</label>
                <input
                  name="phone"
                  type="tel"
                  required
                  className={inputCls}
                  placeholder="+7 ___ ___ __ __"
                />
                <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                  Не отображается на сайте — нужен только клинике для
                  подтверждения отзыва.
                </p>
              </div>

              <div>
                <label className={labelCls}>Ваш отзыв *</label>
                <textarea
                  name="text"
                  rows={5}
                  required
                  minLength={20}
                  maxLength={4000}
                  className={inputCls}
                  placeholder="Расскажите о вашем опыте…"
                />
              </div>

              {courseSlug ? (
                <>
                  <div>
                    <label className={labelCls}>Плюсы</label>
                    <textarea
                      name="pros"
                      rows={3}
                      maxLength={2000}
                      className={inputCls}
                      placeholder="Что понравилось (по желанию)"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Минусы</label>
                    <textarea
                      name="cons"
                      rows={3}
                      maxLength={2000}
                      className={inputCls}
                      placeholder="Что можно улучшить (по желанию)"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Что бы я добавил</label>
                    <textarea
                      name="wishes"
                      rows={3}
                      maxLength={2000}
                      className={inputCls}
                      placeholder="Чего не хватило (по желанию)"
                    />
                  </div>
                </>
              ) : null}

              <div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-[var(--color-gray-300)] px-3 py-2 text-sm text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]">
                  <span>Добавить фото (по желанию)</span>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setPhotoName(e.target.files?.[0]?.name ?? null)
                    }
                  />
                </label>
                {photoName ? (
                  <p className="mt-1 truncate text-xs text-[var(--color-gray-500)]">
                    {photoName}
                  </p>
                ) : null}
              </div>

              <label className="flex items-start gap-2 text-xs leading-5 text-[var(--color-gray-600)]">
                <input
                  type="checkbox"
                  name="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  Я даю согласие на обработку персональных данных и подтверждаю
                  ознакомление с{" "}
                  <a
                    href="/legal/privacy"
                    target="_blank"
                    className="underline hover:text-[var(--color-navy)]"
                  >
                    Политикой обработки персональных данных
                  </a>
                  .
                </span>
              </label>

              {state.error ? (
                <p className="text-sm text-red-600">{state.error}</p>
              ) : null}

              <button
                type="submit"
                disabled={pending || !consent}
                className="w-full rounded-lg bg-[var(--color-navy)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              >
                {pending ? "Отправляем…" : "Отправить отзыв"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export function ReviewForm({
  doctors = [],
  courseSlug,
  variant = "teal",
}: {
  doctors?: DoctorOption[];
  courseSlug?: string;
  variant?: "teal" | "gold";
}) {
  const [open, setOpen] = useState(false);

  const triggerClass =
    variant === "gold"
      ? "bg-[var(--color-gold)] hover:opacity-90"
      : "bg-[var(--color-teal)] hover:opacity-90";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-white transition ${triggerClass}`}
      >
        + Оставить отзыв
      </button>

      {open ? (
        <ReviewModal
          doctors={doctors}
          courseSlug={courseSlug}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
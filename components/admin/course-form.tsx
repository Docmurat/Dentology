"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CropField } from "@/components/admin/crop-field";
import { uploadImageBlob } from "@/lib/upload-client";
import { CourseMetricsEditor } from "@/components/admin/course-metrics-editor";
import { CourseFaqEditor } from "@/components/admin/course-faq-editor";
import { CourseProgramEditor } from "@/components/admin/course-program-editor";
import { CourseFormatsEditor } from "@/components/admin/course-formats-editor";
import type { Course } from "@/lib/courses";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

type DoctorOption = { slug: string; name: string };
type DirectionOption = { slug: string; label: string };
type CourseAction = (formData: FormData) => void | Promise<void>;

// Управляемая сворачиваемая секция. Контент остаётся в DOM (hidden) —
// значения полей сохраняются при сворачивании. В шапке — необязательный
// тумблер «Показывать на сайте» (не влияет на сохранение данных).
function FormSection({
  title,
  hint,
  defaultOpen = false,
  toggleName,
  toggleDefault = true,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  toggleName?: string;
  toggleDefault?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-[var(--color-gray-200)] bg-white">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span className="text-sm font-semibold text-[var(--color-navy)]">
            {title}
          </span>
        </button>

        <div className="flex items-center gap-3">
          {toggleName ? (
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-gray-600)]">
              <input
                type="checkbox"
                name={toggleName}
                defaultChecked={toggleDefault}
              />
              Показывать
            </label>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Свернуть" : "Развернуть"}
            className="text-lg leading-none text-[var(--color-gray-400)]"
          >
            <span
              className={`inline-block transition ${open ? "rotate-45" : ""}`}
            >
              +
            </span>
          </button>
        </div>
      </div>

      <div
        className={
          open
            ? "space-y-4 border-t border-[var(--color-gray-100)] px-4 py-4"
            : "hidden"
        }
      >
        {hint ? (
          <p className="text-xs text-[var(--color-gray-500)]">{hint}</p>
        ) : null}
        {children}
      </div>
    </div>
  );
}

// Загрузка через серверный экшен (Object Storage).
async function uploadBlob(blob: Blob): Promise<string> {
  return uploadImageBlob("team-images/courses", blob, "quote");
}

export function CourseForm({
  doctors,
  directions,
  initial,
  action,
  redirectTo = "/admin/education",
  submitLabel,
  hideOrder = false,
  lockedDoctorSlug,
}: {
  doctors: DoctorOption[];
  directions: DirectionOption[];
  initial?: Course;
  action: CourseAction;
  redirectTo?: string;
  submitLabel: string;
  hideOrder?: boolean;
  lockedDoctorSlug?: string;
}) {
  const router = useRouter();

  const selectedDirs = new Set(initial?.directionSlugs ?? []);
  const [quoteBlob, setQuoteBlob] = useState<Blob | null>(null);
  const [quoteRemoved, setQuoteRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const show = (v: boolean | undefined) => (initial ? Boolean(v) : true);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!String(formData.get("title") || "").trim()) {
      setError("Укажите название курса (секция «Основное»).");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      let quoteImage = initial?.quoteImage ?? "";
      if (quoteBlob) quoteImage = await uploadBlob(quoteBlob);
      else if (quoteRemoved) quoteImage = "";
      formData.set("quoteImage", quoteImage);

      await action(formData);
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-3">
      {initial ? (
        <input type="hidden" name="originalSlug" value={initial.slug} />
      ) : null}

      <p className="text-xs text-[var(--color-gray-500)]">
        Секции идут в порядке блоков на странице. Тумблер «Показывать» скрывает
        блок на сайте, не удаляя данные. Пустой блок не показывается.
      </p>

      {/* Основное */}
      <FormSection title="Основное" defaultOpen>
        <div>
          <label className={labelCls}>Название курса</label>
          <input
            name="title"
            defaultValue={initial?.title ?? ""}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Подзаголовок (описание)</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={initial?.description ?? ""}
            className={inputCls}
            placeholder="Короткое описание — на карточке и под заголовком курса."
          />
        </div>
        <div>
          <label className={labelCls}>Спикер</label>
          {lockedDoctorSlug ? (
            <>
              <input type="hidden" name="doctorSlug" value={lockedDoctorSlug} />
              <p className="mt-1 rounded-lg border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-2 text-sm text-[var(--color-navy)]">
                {doctors.find((d) => d.slug === lockedDoctorSlug)?.name ??
                  "Вы (спикер курса)"}
              </p>
              <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                Спикер курса — вы. Изменить нельзя.
              </p>
            </>
          ) : (
            <>
              <select
                name="doctorSlug"
                defaultValue={initial?.doctorSlug ?? ""}
                className={inputCls}
              >
                <option value="">— выберите врача —</option>
                {doctors.map((d) => (
                  <option key={d.slug} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                Фото (3:4) и ФИО берутся из карточки выбранного врача.
              </p>
            </>
          )}
        </div>
        <div>
          <label className={labelCls}>
            Направления кейсов (для блока «Клинические случаи»)
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {directions.map((d) => (
              <label
                key={d.slug}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-gray-200)] px-3 py-1.5 text-sm text-[var(--color-navy)]"
              >
                <input
                  type="checkbox"
                  name="directionSlug"
                  value={d.slug}
                  defaultChecked={selectedDirs.has(d.slug)}
                />
                {d.label}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-[var(--color-gray-500)]">
            Кейсы — только ведущего врача и по выбранным направлениям.
          </p>
        </div>
      </FormSection>

      {/* Форматы обучения */}
      <FormSection
        title="Форматы обучения (по типам)"
        hint="Включи нужные типы — по карточке на каждый. Одну можно отметить «Рекомендуемая» (золотая). Порядок — стрелками."
      >
        <CourseFormatsEditor initial={initial?.formats} />
      </FormSection>

      {/* Метрика */}
      <FormSection
        title="Метрика"
        hint="Цифра + название. Пустые строки не показываются."
        toggleName="showMetrics"
        toggleDefault={show(initial?.showMetrics)}
      >
        <CourseMetricsEditor initial={initial?.metrics} />
      </FormSection>

      {/* Для кого */}
      <FormSection
        title="Блок «Для кого этот курс»"
        hint="Каждая строка — отдельный пункт."
        toggleName="showAudience"
        toggleDefault={show(initial?.showAudience)}
      >
        <div>
          <label className={labelCls}>Заголовок</label>
          <input
            name="audienceTitle"
            defaultValue={initial?.audienceTitle ?? ""}
            className={inputCls}
            placeholder="Для кого этот курс"
          />
        </div>
        <div>
          <label className={labelCls}>Пункты</label>
          <textarea
            name="audienceText"
            rows={5}
            defaultValue={initial?.audienceText ?? ""}
            className={inputCls}
            placeholder="Каждый пункт — с новой строки"
          />
        </div>
      </FormSection>

      {/* Что вы получите */}
      <FormSection
        title="Блок «Что вы получите»"
        hint="Каждая строка — отдельный пункт."
        toggleName="showOutcomes"
        toggleDefault={show(initial?.showOutcomes)}
      >
        <div>
          <label className={labelCls}>Заголовок</label>
          <input
            name="outcomesTitle"
            defaultValue={initial?.outcomesTitle ?? ""}
            className={inputCls}
            placeholder="Что вы получите"
          />
        </div>
        <div>
          <label className={labelCls}>Пункты</label>
          <textarea
            name="outcomesText"
            rows={5}
            defaultValue={initial?.outcomesText ?? ""}
            className={inputCls}
            placeholder="Каждый пункт — с новой строки"
          />
        </div>
      </FormSection>

      {/* Цитата и фото */}
      <FormSection
        title="Цитата и портрет спикера"
        toggleName="showQuote"
        toggleDefault={show(initial?.showQuote)}
      >
        <div>
          <label className={labelCls}>Цитата спикера</label>
          <textarea
            name="quote"
            rows={3}
            defaultValue={initial?.quote ?? ""}
            className={inputCls}
            placeholder="Короткая прямая речь спикера."
          />
        </div>
        <div>
          <div className="max-w-[220px]">
            <CropField
              label="Портрет спикера (3:4)"
              aspect={3 / 4}
              existingUrl={initial?.quoteImage ?? undefined}
              onCropped={(blob) => setQuoteBlob(blob)}
              onRemovedToggle={setQuoteRemoved}
            />
          </div>
        </div>
      </FormSection>

      {/* Программа */}
      <FormSection
        title="Программа курса"
        hint="Модуль = заголовок + пункты (каждый с новой строки)."
        toggleName="showProgram"
        toggleDefault={show(initial?.showProgram)}
      >
        <CourseProgramEditor initial={initial?.program} />
      </FormSection>

      {/* FAQ */}
      <FormSection
        title="Частые вопросы"
        hint="Вопрос + ответ."
        toggleName="showFaq"
        toggleDefault={show(initial?.showFaq)}
      >
        <CourseFaqEditor initial={initial?.faq} />
      </FormSection>

      {/* Эффективность */}
      <FormSection
        title="Блок «Эффективность»"
        hint="Крупная цифра. Оставьте процент 0, чтобы скрыть блок."
      >
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <div>
            <label className={labelCls}>Эффективность, %</label>
            <input
              type="number"
              name="effectivenessPercent"
              min={0}
              max={100}
              defaultValue={initial?.effectivenessPercent || ""}
              className={inputCls}
              placeholder="98"
            />
          </div>
          <div>
            <label className={labelCls}>Текст рядом с цифрой</label>
            <textarea
              name="effectivenessText"
              rows={2}
              defaultValue={initial?.effectivenessText || ""}
              className={inputCls}
            />
          </div>
        </div>
      </FormSection>

      {/* Био спикера */}
      <FormSection
        title="Био спикера (под фото в Hero)"
        toggleName="showBio"
        toggleDefault={show(initial?.showBio)}
      >
        <textarea
          name="instructorBio"
          rows={4}
          defaultValue={initial?.instructorBio ?? ""}
          className={inputCls}
          placeholder="Короткое описание спикера."
        />
      </FormSection>

      {/* Финальный блок (CTA) */}
      <FormSection
        title="Текст финального блока «Готовы начать?»"
        hint="Кнопка «Оставить заявку» остаётся всегда; скрывается только текст."
        toggleName="showCta"
        toggleDefault={show(initial?.showCta)}
      >
        <textarea
          name="ctaNote"
          rows={3}
          defaultValue={initial?.ctaNote ?? ""}
          className={inputCls}
          placeholder="Текст под заголовком в финальном CTA."
        />
      </FormSection>

      {/* Публикация */}
      <FormSection title="Публикация" defaultOpen>
        <div className="grid gap-4 sm:grid-cols-2">
          {hideOrder ? null : (
            <div>
              <label className={labelCls}>Порядок (меньше — выше)</label>
              <input
                type="number"
                name="sortOrder"
                defaultValue={initial?.sortOrder ?? 0}
                className={inputCls}
              />
            </div>
          )}
          <label className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--color-navy)]">
            <input
              type="checkbox"
              name="published"
              defaultChecked={initial ? initial.published : false}
            />
            Опубликован
          </label>
        </div>
      </FormSection>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={saving}
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Сохранение…" : submitLabel}
      </button>
    </form>
  );
}
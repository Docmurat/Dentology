// components/ui/faq-section.tsx
import { JsonLd, faqJsonLd } from "@/components/seo/json-ld";

export type FaqEntry = { question: string; answer: string };

/**
 * Блок «Частые вопросы».
 *
 * Раньше эта разметка была продублирована на странице курса и на странице
 * направления — любая правка требовала двух одинаковых изменений, и они
 * начали расходиться. Теперь одно место, оно же отдаёт разметку FAQPage.
 *
 * Оформление: без внешней карточки, кегль 14px на телефоне и 16px от 640px.
 * От 834px (iPad Pro портрет) ограничиваем ширину строки — ответ во всю
 * секцию это ~150 символов, читать тяжело.
 */
export function FaqSection({
  items,
  title = "Частые вопросы",
  headingClassName = "text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight",
  withJsonLd = true,
}: {
  items: FaqEntry[];
  title?: string;
  /** Кегль заголовка отличается между страницами — задаётся снаружи. */
  headingClassName?: string;
  withJsonLd?: boolean;
}) {
  const entries = items.filter((i) => i.question || i.answer);
  if (!entries.length) return null;

  const schema = withJsonLd ? faqJsonLd(entries) : null;

  return (
    <div className="mx-auto w-full min-[834px]:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      {schema ? <JsonLd data={schema} /> : null}

      <h2 className={headingClassName}>{title}</h2>

      <div className="mt-6 space-y-4 md:mt-8">
        {entries.map((item) => (
          <details
            key={item.question}
            className="group rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-4"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
              <span className="text-sm font-medium leading-6 text-[var(--color-navy)] sm:text-base sm:leading-7">
                {item.question}
              </span>

              <span className="shrink-0 text-[var(--color-gray-400)] transition group-open:rotate-45">
                +
              </span>
            </summary>

            <div className="pt-4">
              <p className="text-sm leading-6 text-[var(--color-gray-700)] sm:text-base sm:leading-7">
                {item.answer}
              </p>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
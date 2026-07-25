// components/education/course-stats.tsx
import type { CourseMetric } from "@/lib/courses";

/**
 * Метрика курса — произвольные показатели (цифра + название),
 * задаются в кабинете. Пустой список не выводится.
 *
 * Телефон: строки «значение — подпись».
 * 640–767: сетка 2 колонки с крупными цифрами.
 * Планшет мини (768–1023): все метрики в одну линию, кегль и отступы
 *   уменьшены — иначе на 4 показателя колонка сжимается до ~130px
 *   и «150 000 ₽» переносится.
 * От 1024px: полный размер.
 */
export function CourseStats({ metrics }: { metrics: CourseMetric[] }) {
  const items = metrics.filter((m) => m.value || m.label);
  if (!items.length) return null;

  // Классы перечислены явно: Tailwind не видит имена, собранные из строк.
  const cols =
    items.length >= 4
      ? "md:grid-cols-4"
      : items.length === 3
        ? "md:grid-cols-3"
        : items.length === 2
          ? "sm:grid-cols-2"
          : "sm:grid-cols-1";

  return (
    <div className="rounded-[24px] border border-[var(--color-gray-200)] bg-white p-4 sm:p-6 md:p-6 lg:p-8">
      {/* Телефон: строки «значение — подпись» */}
      <div className="divide-y divide-[var(--color-gray-200)] sm:hidden">
        {items.map((it, i) => (
          <div
            key={`m-${it.label}-${i}`}
            className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <p className="shrink-0 text-xl font-semibold text-[var(--color-navy)]">
              {it.value}
            </p>
            {it.label ? (
              <p className="min-w-0 text-right text-xs leading-5 text-[var(--color-gray-600)]">
                {it.label}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {/* От 640px: сетка */}
      <div
        className={`hidden gap-6 text-center sm:grid sm:grid-cols-2 md:gap-4 lg:gap-8 ${cols}`}
      >
        {items.map((it, i) => (
          <div key={`${it.label}-${i}`}>
            <p className="text-4xl font-semibold leading-tight text-[var(--color-navy)] md:text-2xl lg:text-4xl xl:text-5xl">
              {it.value}
            </p>
            {it.label ? (
              <p className="mt-1 text-sm leading-5 text-[var(--color-gray-600)] md:text-xs lg:mt-2 lg:text-sm lg:leading-6">
                {it.label}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Блок «Эффективность» — одна крупная цифра (напр. 98%) и пояснение рядом.
 * Скрыт, если процент не задан.
 *
 * Телефон: цифра над текстом.
 * От 768px: цифра слева, текст справа; на планшете мини кегль уменьшен,
 *   чтобы строка пояснения не сжималась до трёх слов.
 */
export function CourseEffectiveness({
  percent,
  text,
}: {
  percent: number;
  text: string;
}) {
  if (!percent) return null;

  return (
    <div className="rounded-[24px] bg-[var(--color-navy)] px-5 py-8 text-white sm:px-6 sm:py-10 md:px-8 md:py-10 lg:px-10 lg:py-14">
      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:gap-8 lg:gap-10">
        <p className="text-5xl font-semibold leading-none text-[var(--color-gold)] sm:text-6xl md:shrink-0 md:text-6xl lg:text-7xl">
          {percent}%
        </p>
        {text ? (
          <p className="max-w-2xl text-sm leading-6 text-white/90 sm:text-base sm:leading-7 md:text-base md:leading-7 lg:text-lg lg:leading-8">
            {text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
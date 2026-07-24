import type { CourseMetric } from "@/lib/courses";

/**
 * Метрика курса — произвольные показатели (цифра + название),
 * задаются в кабинете. Пустой список не выводится.
 *
 * На телефоне метрики идут строками: значение слева, подпись справа.
 * От 640px — прежняя сетка с крупными цифрами по центру.
 */
export function CourseStats({ metrics }: { metrics: CourseMetric[] }) {
  const items = metrics.filter((m) => m.value || m.label);
  if (!items.length) return null;

  const cols =
    items.length >= 4
      ? "lg:grid-cols-4"
      : items.length === 3
        ? "lg:grid-cols-3"
        : items.length === 2
          ? "lg:grid-cols-2"
          : "lg:grid-cols-1";

  return (
    <div className="rounded-[24px] border border-[var(--color-gray-200)] bg-white p-4 sm:p-6 md:p-8">
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

      {/* От 640px: прежняя сетка */}
      <div className={`hidden gap-6 text-center sm:grid sm:grid-cols-2 ${cols}`}>
        {items.map((it, i) => (
          <div key={`${it.label}-${i}`}>
            <p className="text-4xl font-semibold text-[var(--color-navy)] md:text-5xl">
              {it.value}
            </p>
            {it.label ? (
              <p className="mt-1 text-sm text-[var(--color-gray-600)]">
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
 * Блок «Эффективность» — крупная цифра (напр. 98%) + описание.
 * Скрыт, если процент не задан.
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
    <div className="rounded-[24px] bg-[var(--color-navy)] px-5 py-8 text-white sm:px-6 sm:py-10 md:px-10 md:py-14">
      <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-center md:gap-10">
        <p className="text-5xl font-semibold leading-none text-[var(--color-gold)] sm:text-6xl md:text-7xl">
          {percent}%
        </p>
        {text ? (
          <p className="max-w-2xl text-sm leading-6 text-white/90 sm:text-base sm:leading-7 md:text-lg md:leading-8">
            {text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
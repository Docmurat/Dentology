import type { CourseMetric } from "@/lib/courses";

/**
 * Метрика курса — произвольные показатели (цифра + название),
 * задаются в кабинете. Пустой список не выводится.
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
    <div className="rounded-[24px] border border-[var(--color-gray-200)] bg-white p-6 md:p-8">
      <div
        className={`grid grid-cols-2 gap-6 text-center ${cols}`}
      >
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
    <div className="rounded-[24px] bg-[var(--color-navy)] px-6 py-10 text-white md:px-10 md:py-14">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
        <p className="text-6xl font-semibold leading-none text-[var(--color-gold)] md:text-7xl">
          {percent}%
        </p>
        {text ? (
          <p className="max-w-2xl text-lg leading-8 text-white/90">{text}</p>
        ) : null}
      </div>
    </div>
  );
}
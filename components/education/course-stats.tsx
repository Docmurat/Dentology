/**
 * Блок-метрика по зубам. Переиспользуемый: можно ставить на курсе,
 * главной, странице врача. Числа приходят пропсами (редактируются в кабинете).
 */
export function CourseStats({
  treated,
  radicalPercent,
}: {
  treated: string;
  radicalPercent: number;
}) {
  const radical = Math.min(100, Math.max(0, radicalPercent));
  const saved = 100 - radical;

  return (
    <div className="rounded-[24px] border border-[var(--color-gray-200)] bg-white p-6 md:p-8">
      <div className="grid gap-6 text-center sm:grid-cols-3 sm:text-left">
        <div>
          <p className="text-4xl font-semibold text-[var(--color-navy)] md:text-5xl">
            {treated}
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            зубов пролечено
          </p>
        </div>

        <div>
          <p className="text-4xl font-semibold text-[var(--color-teal)] md:text-5xl">
            {saved}%
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            зубов сохранено
          </p>
        </div>

        <div>
          <p className="text-4xl font-semibold text-[var(--color-navy)] md:text-5xl">
            {radical}%
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            радикальный подход — удаление или резекция
          </p>
        </div>
      </div>

      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-[var(--color-gray-100)]">
        <div
          className="h-full rounded-full bg-[var(--color-teal)]"
          style={{ width: `${saved}%` }}
        />
      </div>
    </div>
  );
}
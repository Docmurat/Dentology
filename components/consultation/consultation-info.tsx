import { Card } from "@/components/ui/card";
import { PrimaryCtaButton } from "@/components/contact/contact-modal";
import { getConsultationContent } from "@/lib/homepage";
import { typography } from "@/lib/typography";

/**
 * «Как проходит консультация»: шаги, что взять с собой, цена и длительность.
 *
 * Один и тот же блок стоит на главной, на страницах направлений, ситуаций
 * и в контактах, поэтому заголовок рисует тот, кто его встраивает.
 * Тексты, цена и длительность редактируются в админке.
 */
export async function ConsultationInfo({
  context,
  showButton = true,
}: {
  /** Откуда заявка — попадёт в поле «Заявка по» у администратора. */
  context?: string;
  showButton?: boolean;
}) {
  const c = await getConsultationContent();

  const steps = c.steps.filter((s) => s.title || s.text);
  const bring = c.bring.filter(Boolean);

  // Факты показываем только заполненные: пустая «Стоимость: —» выглядит
  // хуже, чем её отсутствие.
  const facts = [
    { label: "Стоимость", value: c.price.trim() },
    { label: "Длительность", value: c.duration.trim() },
    { label: "Ответ на заявку", value: c.responseNote.trim() },
  ].filter((f) => f.value);

  return (
    <div className="grid gap-6 sm:gap-8 [&>*]:min-w-0">
      {steps.length ? (
        <ol className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={index} className="flex">
              <Card className="w-full p-4 sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-teal)] text-sm font-semibold text-white">
                  {index + 1}
                </div>

                <h3 className={`mt-4 ${typography.h4} text-[var(--color-navy)]`}>
                  {step.title}
                </h3>

                <p
                  className={`mt-2 ${typography.bodySm} text-[var(--color-gray-700)]`}
                >
                  {step.text}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      ) : null}

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {bring.length ? (
          <Card className="p-4 sm:p-6">
            <h3 className={`${typography.h4} text-[var(--color-navy)]`}>
              {c.bringTitle}
            </h3>

            <ul
              className={`mt-3 space-y-2 ${typography.bodySm} text-[var(--color-gray-700)]`}
            >
              {bring.map((item) => (
                <li key={item} className="flex gap-3">
                  <span
                    aria-hidden
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-teal)]"
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : null}

        {facts.length || showButton ? (
          <Card className="flex flex-col justify-between gap-6 bg-[var(--color-gray-50)] p-4 sm:p-6">
            {facts.length ? (
              <dl className="grid gap-4 sm:grid-cols-2">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt
                      className={`${typography.caption} text-[var(--color-gray-500)]`}
                    >
                      {fact.label}
                    </dt>
                    <dd
                      className={`mt-1 ${typography.h4} text-[var(--color-navy)]`}
                    >
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {showButton ? (
              <div className="[&>*]:w-full sm:[&>*]:w-auto">
                <PrimaryCtaButton context={context} />
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>
    </div>
  );
}

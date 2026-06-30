import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";

export function EducationPreview() {
  return (
    <Section id="education" className="py-20 md:py-28">
      <Card className="bg-[var(--color-gray-50)]">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Обучение"
              title="Образовательное направление для врачей"
              description="Курсы для врачей стоматологов"
            />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <Button href="#contacts">Смотреть обучение</Button>
              <Button href="#contacts" variant="secondary">
                Оставить заявку
              </Button>
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--color-gray-200)] bg-white p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-gold)]">
              Dentology Обучение
            </p>
            <div className="mt-5 space-y-4 text-sm leading-7 text-[var(--color-gray-700)]">
              <p>— смешанный формат обучения</p>
              <p>— клинические кейсы и реальная практика</p>
              <p>— академичная и спокойная подача материала</p>
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
}
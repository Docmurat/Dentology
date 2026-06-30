import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Обучение",
  description:
    "Dentology Обучение — практико-ориентированные курсы для врачей стоматологов по эндодонтии, диагностике и сложным клиническим случаям.",
};

const courses = [
  {
    title: "Курс по сложной эндодонтии",
    text: "Практико-ориентированное обучение, основанное на разборе реальных клинических случаев.",
  },
  {
    title: "Диагностика и принятие решений",
    text: "Фокус на логике лечения, оценке рисков и выборе тактики в сложных ситуациях.",
  },
];

export default function EducationPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Обучение"
        title="Образовательное направление Dentology"
        description="Курсы для врачей стоматологов"
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-6 lg:grid-cols-2">
          {courses.map((item) => (
            <Card key={item.title}>
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-gold)]">
                Dentology Обучение
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-[var(--color-navy)]">
                {item.title}
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
                {item.text}
              </p>
              <div className="mt-8">
                <Button href="/contacts" variant="secondary">
                  Оставить заявку
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
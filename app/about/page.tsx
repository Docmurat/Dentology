import Image from "next/image";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { ContactButton } from "@/components/contact/contact-modal";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "О враче",
  description:
    "Практика Lucenta с ведущим фокусом на сложной эндодонтии, точной диагностике и междисциплинарном подходе к лечению.",
};

export default function AboutPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="О враче"
        title="Практика с ведущим фокусом на сложной эндодонтии"
        description="Подход строится вокруг точной диагностики, сохранения зубов и ведения клинических ситуаций, где стандартных решений оказывается недостаточно."
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[28px] bg-[var(--color-gray-100)] p-4 shadow-[0_8px_28px_rgba(0,0,0,0.06)] md:p-6">
            <div className="overflow-hidden rounded-[22px] border border-[var(--color-gray-200)] bg-white">
              <Image
                src="/doctor-photo.jpg"
                alt="Врач Lucenta"
                width={900}
                height={1200}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Подход
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
                Практика основана на анализе клинической ситуации,
                междисциплинарном подходе и стремлении сохранить зубы в тех
                случаях, где это возможно.
              </p>
            </Card>

            <Card>
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Направления работы
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
                Основной фокус — эндодонтическое лечение сложных случаев. В
                зависимости от задачи в общую систему лечения могут быть
                включены имплантация, ортодонтия и гнатология.
              </p>
            </Card>

            <Card>
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Обучение
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
                Образовательное направление позволяет передавать клинический
                опыт врачам и усиливает академичность всей практики.
              </p>
            </Card>

            <div>
              <ContactButton
                label="Записаться на консультацию"
                variant="teal"
                context="Страница «О враче»"
              />
            </div>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
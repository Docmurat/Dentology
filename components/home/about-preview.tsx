import Image from "next/image";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";

export function AboutPreview() {
  return (
    <Section id="about" className="py-20 md:py-28">
      <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[28px] bg-[var(--color-gray-100)] p-4 shadow-[0_8px_28px_rgba(0,0,0,0.06)] md:p-6">
          <div className="overflow-hidden rounded-[22px] border border-[var(--color-gray-200)] bg-white">
            <Image
              src="/doctor-photo.jpg"
              alt="Врач Dentology"
              width={900}
              height={1200}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow="О враче"
            title="Практика с ведущим фокусом на сложной эндодонтии"
            description="Работа строится вокруг точной диагностики, сохранения зубов и ведения клинических ситуаций, где стандартных решений оказывается недостаточно."
          />

          <div className="mt-6 space-y-4 text-base leading-8 text-[var(--color-gray-700)]">
            <p>
              Помимо эндодонтического лечения, в рамках практики рассматриваются
              задачи имплантации, ортодонтии и гнатологии как части общего
              междисциплинарного подхода.
            </p>
            <p>
              Приём ведётся в Москве. Пациенты обращаются также из других
              регионов, когда требуется экспертная оценка сложного случая.
            </p>
          </div>

          <div className="mt-8">
            <Button href="/about" variant="secondary">
              Подробнее о враче
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
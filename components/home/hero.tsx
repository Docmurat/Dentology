import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/layout/section";

export function Hero() {
  return (
    <Section className="pt-10 pb-20 md:pt-14 md:pb-28">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="mb-6 text-sm uppercase tracking-[0.22em] text-[var(--color-gray-500)]">
            Экспертная стоматологическая практика
          </p>

          <h1 className="max-w-4xl text-4xl font-semibold leading-[1.06] text-[var(--color-navy)] md:text-6xl">
            Сохранение зубов в ситуациях, где часто рекомендуют удаление
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-gray-700)]">
            Ведущая экспертиза в сложной эндодонтии, дополненная имплантацией,
            ортодонтией и гнатологией как частью комплексного подхода к лечению.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/contacts">Записаться на консультацию</Button>
            <Button href="/cases" variant="secondary">
              Клинические случаи
            </Button>
          </div>

          <div className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 py-5">
              <p className="text-sm text-[var(--color-gray-500)]">
                Основной фокус
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-navy)]">
                Сложная эндодонтия
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-4 py-5">
              <p className="text-sm text-[var(--color-gray-500)]">Подход</p>
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-navy)]">
                Диагностика и системное лечение
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--color-gold)] bg-[var(--color-gold)]/10 px-4 py-5">
              <p className="text-sm font-medium text-[var(--color-gold)]">
                Education
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-[var(--color-navy)]">
                Обучение врачей по эндодонтии
              </p>
            </div>
          </div>
        </div>

        <div className="relative max-w-[520px] ml-auto">
          <div className="rounded-[32px] bg-[var(--color-gray-100)] shadow-[0_12px_36px_rgba(0,0,0,0.06)]">
            <div className="overflow-hidden rounded-[32px]">
              <Image
                src="/hero-doctor.jpg"
                alt="Dentology — врач"
                width={1000}
                height={1300}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="rounded-2xl border border-white/30 bg-white/60 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.08)] backdrop-blur-md">
              <p className="text-[32px] leading-none text-white/40">“</p>

              <p className="mt-2 text-base leading-7 text-[var(--color-navy)]">
                В ряде случаев зуб можно сохранить, даже если ранее
                рекомендовано удаление
              </p>

              <p className="mt-4 text-xs uppercase tracking-[0.18em] text-[var(--color-gray-600)]">
                Курджиев Мурат
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
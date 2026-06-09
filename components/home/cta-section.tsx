import Link from "next/link";
import { Section } from "@/components/layout/section";

export function CtaSection() {
  return (
    <Section className="py-20 md:py-28">
      <div className="rounded-[32px] bg-[var(--color-navy)] px-6 py-12 text-white md:px-12 md:py-16">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
            Запись на консультацию
          </h2>

          <p className="mt-6 text-base leading-7 text-white/80">
            Консультация позволяет оценить клиническую ситуацию, подтвердить
            диагноз и определить возможные варианты лечения.
          </p>

          <p className="mt-4 text-base leading-7 text-white/80">
            В ряде случаев возможно сохранить зуб даже при ранее рекомендованном
            удалении.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-teal)] px-6 py-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--color-teal-hover)]"
            >
              Записаться на консультацию
            </Link>

            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-xl border border-white px-6 py-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-white hover:text-[var(--color-navy)]"
            >
              Перейти к контактам
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
}
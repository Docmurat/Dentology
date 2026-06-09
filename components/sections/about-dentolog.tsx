import { Section } from "@/components/layout/section";

export function AboutDentology() {
  return (
    <Section className="py-8 md:py-10">
      <div className="rounded-[24px] bg-[var(--color-teal)]/10 px-6 py-6 md:px-8">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-teal)]">
          Dentology
        </p>

        <p className="mt-3 text-base leading-7 text-[var(--color-navy)] md:text-lg">
          Dentology — это команда врачей и система клинического мышления,
          где решение принимается не по шаблону, а на основе диагностики и
          реальной клинической картины.
        </p>

        <p className="mt-2 text-sm text-[var(--color-gray-700)]">
          В основе — стремление сохранить зуб и минимизировать вмешательство.
        </p>
      </div>
    </Section>
  );
}
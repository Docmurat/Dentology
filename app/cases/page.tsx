import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CasesPageContent } from "@/components/cases/cases-page-content";
import { getAllCases } from "@/lib/cases";

export const metadata: Metadata = {
  title: "Клинические случаи",
  description:
    "Реальные клинические случаи Dentology: сложная эндодонтия, повторное лечение и ситуации, где ранее рекомендовали удаление зуба.",
};

// Новые кейсы из кабинета появляются без пересборки.
export const revalidate = 60;

export default async function CasesPage() {
  const cases = await getAllCases();

  return (
    <SiteShell>
      <PageHero
        eyebrow="Клинические случаи"
        title="Реальные кейсы, в которых стандартного подхода было недостаточно"
        description="Клинические разборы, показывающие не рекламный результат, а логику принятия решений, диагностику и возможность сохранения зубов в сложных ситуациях."
      />

      <Section className="pb-20 md:pb-28">
        <CasesPageContent cases={cases} />

        <div className="mt-8 border-t border-[var(--color-gray-200)] pt-4">
          <p className="text-xs leading-6 text-[var(--color-gray-500)]">
            Каждый клинический случай на сайте показывает не только результат,
            но и логику диагностики, выбора тактики и обоснованность лечения.
          </p>
        </div>
      </Section>
    </SiteShell>
  );
}
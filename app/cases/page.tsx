import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CasesPageContent } from "@/components/cases/cases-page-content";
import { getAllCases } from "@/lib/cases";
import { getTeamMemberBySlug } from "@/lib/team";

export const metadata: Metadata = {
  title: "Клинические случаи",
  description:
    "Реальные клинические случаи Dentology: сложная эндодонтия, повторное лечение и ситуации, где ранее рекомендовали удаление зуба.",
};

// Новые кейсы из кабинета появляются без пересборки.
export const revalidate = 60;

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const { doctor: doctorSlug } = await searchParams;

  const [allCases, doctor] = await Promise.all([
    getAllCases(),
    doctorSlug ? getTeamMemberBySlug(doctorSlug) : Promise.resolve(null),
  ]);

  const cases = doctor
    ? allCases.filter((item) => item.doctorSlug === doctor.slug)
    : allCases;

  const genitive = doctor ? doctor.nameGenitive || doctor.name : null;

  return (
    <SiteShell>
      <PageHero
        eyebrow="Клинические случаи"
        title={
          doctor
            ? `Все кейсы ${genitive}`
            : "Реальные кейсы, в которых стандартного подхода было недостаточно"
        }
        description={
          doctor
            ? "Клинические случаи этого врача."
            : "Клинические разборы, показывающие не рекламный результат, а логику принятия решений, диагностику и возможность сохранения зубов в сложных ситуациях."
        }
      />

      <Section className="pb-20 md:pb-28">
        <CasesPageContent
          cases={cases}
          doctorFilter={
            doctor ? { slug: doctor.slug, name: doctor.name } : null
          }
        />

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
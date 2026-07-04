import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { CasesPageContent } from "@/components/cases/cases-page-content";
import { getAllCases } from "@/lib/cases";
import { getTeamMemberBySlug } from "@/lib/team";
import { getDirections, getDirectionLabelMap } from "@/lib/directions-db";
import { getPageHeading } from "@/lib/page-content";

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

  const [allCases, doctor, allDirections, labelMap] = await Promise.all([
    getAllCases(),
    doctorSlug ? getTeamMemberBySlug(doctorSlug) : Promise.resolve(null),
    getDirections(),
    getDirectionLabelMap(),
  ]);

  const heading = await getPageHeading("cases");

  // Какие направления реально встречаются в кейсах.
  const usedSlugs = new Set(
    allCases.map((c) => c.directionSlug).filter(Boolean)
  );

  // Активные направления (из БД) — только те, по которым есть кейсы.
  const activeDirections = allDirections
    .filter((d) => usedSlugs.has(d.slug))
    .map((d) => ({ slug: d.slug, label: d.title }));

  // Архивные направления, по которым есть кейсы, — в конец фильтра.
  const activeSlugs = new Set(allDirections.map((d) => d.slug));
  const archivedDirections = Array.from(usedSlugs)
    .filter((slug) => !activeSlugs.has(slug))
    .map((slug) => ({ slug, label: labelMap[slug] ?? slug }));

  const directions = [...activeDirections, ...archivedDirections];

  const cases = doctor
    ? allCases.filter((item) => item.doctorSlug === doctor.slug)
    : allCases;

  const genitive = doctor ? doctor.nameGenitive || doctor.name : null;

  return (
    <SiteShell>
      <PageHero
        eyebrow={heading.eyebrow}
        title={doctor ? `Все кейсы ${genitive}` : heading.title}
        description={
          doctor ? "Клинические случаи этого врача." : heading.description
        }
      />

      <Section className="pb-20 md:pb-28">
        <CasesPageContent
          cases={cases}
          directions={directions}
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
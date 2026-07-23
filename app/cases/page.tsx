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
    "Реальные клинические случаи Lucenta: сложная эндодонтия, повторное лечение и ситуации, где ранее рекомендовали удаление зуба.",
};

// Новые кейсы из кабинета появляются без пересборки.
export const revalidate = 60;

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; direction?: string }>;
}) {
  const { doctor: doctorSlug, direction: directionParam } = await searchParams;

  const [allCases, doctor, allDirections, labelMap] = await Promise.all([
    getAllCases(),
    doctorSlug ? getTeamMemberBySlug(doctorSlug) : Promise.resolve(null),
    getDirections(),
    getDirectionLabelMap(),
  ]);

  const heading = await getPageHeading("cases");

  // Направления из URL (через запятую) — для комбинированного фильтра «врач + направление».
  const directionSet = directionParam
    ? new Set(directionParam.split(",").map((s) => s.trim()).filter(Boolean))
    : null;

  // Какие направления реально встречаются в кейсах.
  const usedSlugs = new Set(
    allCases.map((c) => c.directionSlug).filter(Boolean)
  );

  const activeDirections = allDirections
    .filter((d) => usedSlugs.has(d.slug))
    .map((d) => ({ slug: d.slug, label: d.title }));

  const activeSlugs = new Set(allDirections.map((d) => d.slug));
  const archivedDirections = Array.from(usedSlugs)
    .filter((slug) => !activeSlugs.has(slug))
    .map((slug) => ({ slug, label: labelMap[slug] ?? slug }));

  const directions = [...activeDirections, ...archivedDirections];

  // Врач фильтруется на сервере. Направление — тоже, но только в связке
  // с врачом (переход с курса). Если задано одно направление без врача,
  // просто предвыбираем его в фильтрах, чтобы можно было переключиться.
  const cases = allCases.filter((item) => {
    if (doctor && item.doctorSlug !== doctor.slug) return false;
    if (
      doctor &&
      directionSet &&
      (!item.directionSlug || !directionSet.has(item.directionSlug))
    )
      return false;
    return true;
  });

  // Предвыбранное направление (переход со страницы направления).
  const preselected =
    !doctor && directionSet && directionSet.size === 1
      ? Array.from(directionSet)[0]
      : "all";

  const genitive = doctor ? doctor.nameGenitive || doctor.name : null;

  // Заголовок направления (если один) — для контекста.
  const dirTitle =
    directionSet && directionSet.size === 1
      ? labelMap[Array.from(directionSet)[0]] ?? null
      : null;

  const title = doctor
    ? dirTitle
      ? `Кейсы ${genitive}: ${dirTitle}`
      : `Все кейсы ${genitive}`
    : heading.title;

  return (
    <SiteShell>
      <PageHero
        eyebrow={heading.eyebrow}
        title={title}
        description={
          doctor ? "Клинические случаи этого врача." : heading.description
        }
      />

      <Section className="pb-20 md:pb-28">
        <CasesPageContent
          cases={cases}
          directions={directions}
          doctorFilter={doctor ? { slug: doctor.slug, name: doctor.name } : null}
          hideFilters={Boolean(doctor && directionSet)}
          initialFilter={preselected}
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
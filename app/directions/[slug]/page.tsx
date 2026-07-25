// app/directions/[slug]/page.tsx
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactButton } from "@/components/contact/contact-modal";
import {
  getDirectionBySlug,
  getDirectionLabelMap,
  getDirectionSlugs,
} from "@/lib/directions-db";
import { getLeadByDirection, getTeamMembers } from "@/lib/team";
import { getCasesForCards } from "@/lib/cases";
import { getApprovedReviews } from "@/lib/reviews";
import { CaseCard } from "@/components/cases/case-card";
import { ReviewCard } from "@/components/reviews/review-card";
import { ContraindicationsNote } from "@/components/legal/contraindications-note";
import { FaqSection } from "@/components/ui/faq-section";
import { typography } from "@/lib/typography";

export const revalidate = 60;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

// Страницы направлений собираются заранее, новые подхватываются по ISR.
export async function generateStaticParams() {
  try {
    const slugs = await getDirectionSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    // База недоступна на сборке — страницы отрисуются по запросу.
    return [];
  }
}

// Без этого все направления наследовали заголовок и описание из корневого
// layout: в выдаче и при шаринге страницы выглядели одинаково.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const direction = await getDirectionBySlug(slug);
  if (!direction) return {};

  const description =
    direction.heroDescription || direction.description || undefined;
  const url = `/directions/${slug}`;

  return {
    title: direction.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: direction.title,
      description,
      url,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: direction.title,
      description,
    },
  };
}

export default async function DirectionPage({ params }: Props) {
  const { slug } = await params;

  const direction = await getDirectionBySlug(slug);

  if (!direction) {
    notFound();
  }

  const relatedDoctor = await getLeadByDirection(slug);

  // Кейсы направления: фильтр и лимит в SQL. Раньше читались все
  // опубликованные кейсы целиком (вместе с content_blocks) и отсеивались в JS.
  // Больше четырёх ни одна раскладка не показывает.
  const [directionCases, dirLabel, allReviews, team] = await Promise.all([
    getCasesForCards({ directionSlug: slug, limit: 4 }),
    getDirectionLabelMap(),
    getApprovedReviews(),
    getTeamMembers(),
  ]);

  // Кейсы направления: 3 на телефоне и десктопе, 4 на планшете.
  // Остальные — по кнопке на /cases с фильтром.
  const relatedCases = directionCases.slice(0, 3);
  const tabletCases = directionCases.slice(0, 4);

  const doctorName = new Map(team.map((d) => [d.slug, d.name]));

  // Отзывы направления берём из БД (раньше читался пустой статический список).
  const directionReviews = allReviews.filter((item) =>
    item.directionSlugs?.includes(slug)
  );
  // 3 отзыва на телефоне и десктопе, 4 на планшете — как на главной.
  const relatedReviews = directionReviews.slice(0, 3);
  const tabletReviews = directionReviews.slice(0, 4);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Направление"
        title={direction.title}
        description={direction.heroDescription}
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-16 sm:gap-20 lg:gap-24 [&>*]:min-w-0">
          <div className="grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch [&>*]:min-w-0">
            {/* Левая колонка */}
            <div className="grid min-w-0 gap-6 sm:gap-8 [&>*]:min-w-0">
              <Card>
                <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                  О направлении
                </h2>

                <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-4 sm:text-base sm:leading-7">
                  {direction.description}
                </p>
              </Card>

              {direction.problems.length ? (
                <Card>
                  <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                    С какими проблемами приходят
                  </h2>

                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-4 sm:space-y-3 sm:text-base sm:leading-7">
                    {direction.problems.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>

            {/* Правая колонка */}
            {relatedDoctor ? (
              <Card className="overflow-hidden p-0">
                <div className="flex h-full flex-col">
                  <div className="h-[360px] overflow-hidden bg-[var(--color-gray-100)] md:h-[420px]">
                    <Image
                      src={relatedDoctor.leadImage || relatedDoctor.image}
                      alt={relatedDoctor.name}
                      width={900}
                      height={1200}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-6 md:p-8">
                    <p className={`${typography.eyebrow} text-[var(--color-teal)]`}>
                      Специалист направления
                    </p>

                    <h2 className={`mt-3 ${typography.h3} text-[var(--color-navy)]`}>
                      {relatedDoctor.name}
                    </h2>

                    <p className="mt-3 text-sm font-medium text-[var(--color-navy-secondary)]">
                      {slug === "restoration"
                        ? "Стоматолог-реставратор"
                        : slug === "prosthetics"
                          ? "Стоматолог-ортопед"
                          : relatedDoctor.role}
                    </p>

                    <div className="mt-4 border-l-2 border-[var(--color-teal)] pl-4">
                      <p className="text-sm leading-7 text-[var(--color-gray-700)]">
                        {relatedDoctor.leadQuote?.trim() ||
                          relatedDoctor.description}
                      </p>

                      <Link
                        href={`/team/${relatedDoctor.slug}`}
                        className={`mt-3 inline-flex ${typography.eyebrow} text-[var(--color-teal)] hover:text-[var(--color-navy)]`}
                      >
                        Подробнее о враче
                      </Link>
                    </div>

                    <div className="mt-8">
                      <ContactButton
                        label="Записаться на консультацию"
                        variant="teal"
                        context={direction.title}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}
          </div>

          {direction.fears.length ? (
            /* Без внешнего контейнера: карточки страхов занимают всю ширину
               колонки на любом экране. */
            <div>
              <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                Что беспокоит пациентов
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {direction.fears.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-[var(--color-gray-200)] bg-white px-4 py-4 sm:px-5 sm:py-5"
                  >
                    <div className="mb-3 h-1 w-10 rounded-full bg-[var(--color-teal)]" />
                    <p className="text-sm leading-7 text-[var(--color-gray-700)]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {direction.approach.length ||
          (direction.insightTitle && direction.insightText.length) ? (
            <div className="grid min-w-0 gap-6 sm:gap-8 lg:grid-cols-2 [&>*]:min-w-0">
              {/* ЛЕВАЯ КОЛОНКА — подход */}
              {direction.approach.length ? (
                <Card>
                  <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                    Как мы подходим к лечению
                  </h2>

                  <div className="mt-6 relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--color-gray-200)]" />

                    <div className="space-y-6">
                      {direction.approach.map((item, index) => (
                        <div key={item} className="relative flex gap-4">
                          <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-teal)] text-sm font-semibold text-white">
                            {index + 1}
                          </div>

                          <p className="text-sm leading-7 text-[var(--color-gray-700)]">
                            {item}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ) : null}

              {/* ПРАВАЯ КОЛОНКА — смысловой блок */}
              {direction.insightTitle && direction.insightText.length ? (
                <Card className="bg-[var(--color-gray-50)]">
                  <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                    {direction.insightTitle}
                  </h2>

                  <div className="mt-4 space-y-4 leading-7 text-[var(--color-gray-700)]">
                    {direction.insightText.map((item) => (
                      <p key={item}>{item}</p>
                    ))}
                  </div>
                </Card>
              ) : null}
            </div>
          ) : null}

          {relatedCases.length ? (
            /* Без внешнего контейнера: карточки кейсов занимают всю ширину. */
            <div>
              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                    Клинические случаи по направлению
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-3 sm:text-base sm:leading-7">
                    Примеры клинических ситуаций, связанных с этим направлением.
                  </p>
                </div>

                <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
                  <Button href={`/cases?direction=${slug}`} variant="secondary">
                    Все кейсы направления
                  </Button>
                </div>
              </div>

              {/* Телефон: три кейса в один столбец */}
              <div className="mt-8 grid gap-4 sm:hidden">
                {relatedCases.map((item) => (
                  <CaseCard
                    key={item.slug}
                    item={item}
                    dirLabel={dirLabel}
                    doctorName={
                      item.doctorSlug ? doctorName.get(item.doctorSlug) : null
                    }
                  />
                ))}
              </div>

              {/* Планшет: четыре кейса в две колонки */}
              <div className="mt-8 hidden gap-6 sm:grid sm:grid-cols-2 lg:hidden">
                {tabletCases.map((item) => (
                  <CaseCard
                    key={item.slug}
                    item={item}
                    dirLabel={dirLabel}
                    doctorName={
                      item.doctorSlug ? doctorName.get(item.doctorSlug) : null
                    }
                  />
                ))}
              </div>

              {/* Десктоп: три кейса в ряд */}
              <div className="mt-8 hidden gap-6 lg:grid lg:grid-cols-3">
                {relatedCases.map((item) => (
                  <CaseCard
                    key={item.slug}
                    item={item}
                    dirLabel={dirLabel}
                    doctorName={
                      item.doctorSlug ? doctorName.get(item.doctorSlug) : null
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {relatedReviews.length ? (
            /* Без внешнего контейнера: карточки отзывов занимают всю ширину. */
            <div>
              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                    Отзывы по направлению
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-3 sm:text-base sm:leading-7">
                    Отзывы пациентов, связанные именно с этим направлением
                    лечения.
                  </p>
                </div>

                <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
                  <Button href={`/reviews?direction=${slug}`} variant="secondary">
                    Все отзывы направления
                  </Button>
                </div>
              </div>

              {/* Телефон: три отзыва в один столбец */}
              <div className="mt-8 grid gap-4 sm:hidden">
                {relatedReviews.map((item) => (
                  <ReviewCard key={item.slug} review={item} />
                ))}
              </div>

              {/* Планшет: четыре отзыва в две колонки */}
              <div className="mt-8 hidden gap-6 sm:grid sm:grid-cols-2 lg:hidden">
                {tabletReviews.map((item) => (
                  <ReviewCard key={item.slug} review={item} />
                ))}
              </div>

              {/* Десктоп: три отзыва в ряд */}
              <div className="mt-8 hidden gap-6 lg:grid lg:grid-cols-3">
                {relatedReviews.map((item) => (
                  <ReviewCard key={item.slug} review={item} />
                ))}
              </div>
            </div>
          ) : null}

          {/* Частые вопросы — общий компонент, он же отдаёт разметку FAQPage.
              Разметка была продублирована со страницей курса; теперь одно место. */}
          <FaqSection items={direction.faq} />

          <div className="rounded-[28px] bg-[var(--color-navy)] px-5 py-8 text-white sm:px-6 sm:py-10 md:px-10 md:py-12">
            <div className="max-w-3xl">
              <h2 className={typography.h2}>
                {slug === "endodontics"
                  ? "Запись на консультацию по эндодонтическому лечению"
                  : "Запись на консультацию"}
              </h2>

              <p className="mt-4 text-sm leading-6 text-white/80 sm:mt-6 sm:text-base sm:leading-7">
                {slug === "endodontics"
                  ? "Консультация позволяет оценить клиническую ситуацию, уточнить диагноз и определить, возможно ли сохранить зуб даже в тех случаях, где ранее рекомендовано удаление."
                  : "Консультация позволяет оценить клиническую ситуацию и определить возможные варианты лечения."}
              </p>

              <div className="mt-8">
                <ContactButton
                  label="Записаться на консультацию"
                  variant="teal"
                  context={direction.title}
                />
              </div>
            </div>
          </div>

          <ContraindicationsNote className="text-center" />
        </div>
      </Section>
    </SiteShell>
  );
}
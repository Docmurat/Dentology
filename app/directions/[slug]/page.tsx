import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContactButton } from "@/components/contact/contact-modal";
import { getDirectionBySlug, getDirectionLabelMap } from "@/lib/directions-db";
import { getLeadByDirection, getTeamMembers } from "@/lib/team";
import { getAllCases } from "@/lib/cases";
import { getApprovedReviews } from "@/lib/reviews";
import { CaseCard } from "@/components/cases/case-card";
import { ReviewCard } from "@/components/reviews/review-card";
import { ContraindicationsNote } from "@/components/legal/contraindications-note";

export const revalidate = 60;

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function DirectionPage({ params }: Props) {
  const { slug } = await params;

  const direction = await getDirectionBySlug(slug);

  if (!direction) {
    notFound();
  }

  const relatedDoctor = await getLeadByDirection(slug);

  const [allCases, dirLabel, allReviews, team] = await Promise.all([
    getAllCases(),
    getDirectionLabelMap(),
    getApprovedReviews(),
    getTeamMembers(),
  ]);

  // Кейсы направления: 3 на телефоне и десктопе, 4 на планшете.
  // Остальные — по кнопке на /cases с фильтром.
  const directionCases = allCases.filter((item) => item.directionSlug === slug);
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
                <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
                  О направлении
                </h2>

                <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-4 sm:text-base sm:leading-7">
                  {direction.description}
                </p>
              </Card>

              {direction.problems.length ? (
                <Card>
                  <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
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
                    <p className="text-sm uppercase tracking-[0.14em] text-[var(--color-teal)]">
                      Специалист направления
                    </p>

                    <h2 className="mt-3 text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
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
                        className="mt-3 inline-flex text-xs uppercase tracking-[0.14em] text-[var(--color-teal)] hover:text-[var(--color-navy)]"
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
              <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
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
                  <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
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
                  <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
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
                  <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
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
                  <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
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

          {/* Частые вопросы — тоже без внешнего контейнера */}
          {/* Частые вопросы — без внешнего контейнера.
              От 834px (iPad Pro портрет) ограничиваем ширину: строка ответа
              в 1200px — это ~150 символов, читается тяжело. */}
          <div className="mx-auto w-full min-[834px]:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
            <h2 className="text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight">
              Частые вопросы
            </h2>

            <div className="mt-6 space-y-4">
              {direction.faq.map((q) => (
                <details
                  key={q.question}
                  className="group rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-4"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                    <span className="text-sm font-medium leading-6 text-[var(--color-navy)] sm:text-base sm:leading-7">
                      {q.question}
                    </span>

                    <span className="shrink-0 text-[var(--color-gray-400)] transition group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <div className="pt-4">
                    <p className="text-sm leading-6 text-[var(--color-gray-700)] sm:text-base sm:leading-7">
                      {q.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-[var(--color-navy)] px-5 py-8 text-white sm:px-6 sm:py-10 md:px-10 md:py-12">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-semibold leading-snug sm:text-3xl sm:leading-tight md:text-4xl">
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
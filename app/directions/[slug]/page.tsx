import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDirectionBySlug } from "@/lib/directions-db";
import { getLeadByDirection } from "@/lib/team";
import { getAllCases } from "@/lib/cases";
import { reviewsData } from "@/lib/reviews-data";
import { ReviewCard } from "@/components/reviews/review-card";
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

  const allCases = await getAllCases();
const relatedCases = allCases.filter((item) => item.directionSlug === slug);
const relatedReviews = reviewsData
  .filter((item) => item.directionSlugs?.includes(slug))
  .slice(0, 2

  );

  return (
    <SiteShell>
      <PageHero
        eyebrow="Направление"
        title={direction.title}
        description={direction.heroDescription}
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
  {/* Левая колонка */}
  <div className="grid gap-8">
    <Card>
      <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
        О направлении
      </h2>

      <p className="mt-4 leading-7 text-[var(--color-gray-700)]">
        {direction.description}
      </p>
    </Card>

    {direction.problems.length ? (
      <Card>
        <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
          С какими проблемами приходят
        </h2>

        <ul className="mt-4 space-y-3 leading-7 text-[var(--color-gray-700)]">
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

          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-navy)]">
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
    {relatedDoctor.leadQuote?.trim() || relatedDoctor.description}
  </p>

  <Link
    href={`/team/${relatedDoctor.slug}`}
    className="mt-3 inline-flex text-xs uppercase tracking-[0.14em] text-[var(--color-teal)] hover:text-[var(--color-navy)]"
  >
    Подробнее о враче
  </Link>
</div>

          <div className="mt-8">
            <Button href="/contacts" className="w-full justify-center">
              Записаться на консультацию
            </Button>
          </div>
        </div>
      </div>
    </Card>
  ) : null}
</div>

          {direction.fears.length ? (
  <Card className="bg-[var(--color-gray-50)]">

    <h2 className="mt-3 text-2xl font-semibold text-[var(--color-navy)]">
      Что беспокоит пациентов
    </h2>

    <div className="mt-6 grid gap-4 md:grid-cols-2">
      {direction.fears.map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-5"
        >
          <div className="mb-3 h-1 w-10 rounded-full bg-[var(--color-teal)]" />
          <p className="text-sm leading-7 text-[var(--color-gray-700)]">
            {item}
          </p>
        </div>
      ))}
    </div>
  </Card>
) : null}
         {direction.approach.length || (direction.insightTitle && direction.insightText.length) ? (
  <div className="grid gap-8 lg:grid-cols-2">

    {/* ЛЕВАЯ КОЛОНКА — подход */}
    {direction.approach.length ? (
      <Card>
        <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
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
        <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
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
            <Card>
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                    Клинические случаи по направлению
                  </h2>

                  <p className="mt-3 leading-7 text-[var(--color-gray-700)]">
                    Примеры клинических ситуаций, связанных с этим направлением.
                  </p>
                </div>

                <Link
                  href="/cases"
                  className="inline-flex text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                >
                  Смотреть все кейсы
                </Link>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-3">
                {relatedCases.map((item) => (
                  <div
                    key={item.slug}
                    className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5"
                  >
                    <div className="mb-4 grid grid-cols-2 overflow-hidden rounded-xl">
                      <div className="aspect-[4/3] bg-[var(--color-gray-100)]">
                        {item.imageBefore ? (
                          <Image
                            src={item.imageBefore}
                            alt="До лечения"
                            width={400}
                            height={300}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>

                      <div className="aspect-[4/3] bg-[var(--color-gray-100)]">
                        {item.imageAfter ? (
                          <Image
                            src={item.imageAfter}
                            alt="После лечения"
                            width={400}
                            height={300}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                    </div>

                    <h3 className="mt-3 text-lg font-semibold text-[var(--color-navy)]">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
                      {item.excerpt}
                    </p>

                    <Link
                      href={`/cases/${item.slug}`}
                      className="mt-5 inline-flex text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                    >
                      Смотреть случай
                    </Link>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

{relatedReviews.length ? (
  <Card>
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
          Отзывы по направлению
        </h2>

        <p className="mt-3 leading-7 text-[var(--color-gray-700)]">
          Отзывы пациентов, связанные именно с этим направлением лечения.
        </p>
      </div>

      <Link
        href="/reviews"
        className="inline-flex text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
      >
        Все отзывы
      </Link>
    </div>

    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      {relatedReviews.map((item) => (
        <ReviewCard key={item.slug} review={item} />
      ))}
    </div>
  </Card>
) : null}

          <Card>
  <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
    Частые вопросы
  </h2>

  <div className="mt-6 space-y-4">
    {direction.faq.map((q) => (
      <details
        key={q.question}
        className="group rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-4"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
          <span className="text-base font-medium leading-7 text-[var(--color-navy)]">
            {q.question}
          </span>

          <span className="shrink-0 text-[var(--color-gray-400)] transition group-open:rotate-45">
            +
          </span>
        </summary>

        <div className="pt-4">
          <p className="leading-7 text-[var(--color-gray-700)]">
            {q.answer}
          </p>
        </div>
      </details>
    ))}
  </div>
</Card>

          <div className="rounded-[28px] bg-[var(--color-navy)] px-6 py-10 text-white md:px-10 md:py-12">
            <div className="max-w-3xl">
              <h2 className="text-3xl font-semibold leading-tight md:text-4xl">
                {slug === "endodontics"
                  ? "Запись на консультацию по эндодонтическому лечению"
                  : "Запись на консультацию"}
              </h2>

              <p className="mt-5 leading-7 text-white/80">
                {slug === "endodontics"
                  ? "Консультация позволяет оценить клиническую ситуацию, уточнить диагноз и определить, возможно ли сохранить зуб даже в тех случаях, где ранее рекомендовано удаление."
                  : "Консультация позволяет оценить клиническую ситуацию и определить возможные варианты лечения."}
              </p>

              <div className="mt-8">
                <Button href="/contacts">Записаться на консультацию</Button>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
// app/situations/[slug]/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrimaryCtaButton } from "@/components/contact/contact-modal";
import { CtaCaption } from "@/components/consultation/cta-caption";
import { ConsultationInfo } from "@/components/consultation/consultation-info";
import { CaseCard } from "@/components/cases/case-card";
import { ContraindicationsNote } from "@/components/legal/contraindications-note";
import { FaqSection } from "@/components/ui/faq-section";
import { getCasesForCards } from "@/lib/cases";
import { getDirectionLabelMap } from "@/lib/directions-db";
import { getConsultationContent } from "@/lib/homepage";
import { SITUATIONS, getSituationBySlug } from "@/lib/situations";
import { typography } from "@/lib/typography";
import { pageOpenGraph } from "@/lib/seo";
import type { CaseItem } from "@/lib/cases-data";

// Кейсы подтягиваются из базы — обновляем раз в минуту, как на направлениях.
export const revalidate = 60;

// Все ситуации описаны в коде, других адресов быть не может.
export const dynamicParams = false;

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SITUATIONS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getSituationBySlug(slug);
  if (!item) return {};

  const url = `/situations/${slug}`;

  return {
    title: item.seoTitle,
    description: item.description,
    alternates: { canonical: url },
    openGraph: pageOpenGraph({
      title: item.title,
      description: item.description,
      url,
      type: "article",
    }),
    twitter: {
      card: "summary_large_image",
      title: item.title,
      description: item.description,
    },
  };
}

// Все три ситуации относятся к эндодонтии: оттуда берём примеры кейсов.
const CASES_DIRECTION = "endodontics";

async function safeCases(): Promise<{
  cases: CaseItem[];
  dirLabel: Record<string, string>;
}> {
  try {
    const [cases, dirLabel] = await Promise.all([
      getCasesForCards({ directionSlug: CASES_DIRECTION, limit: 3 }),
      getDirectionLabelMap(),
    ]);
    return { cases, dirLabel };
  } catch {
    // База недоступна — страница остаётся полезной и без кейсов.
    return { cases: [], dirLabel: {} };
  }
}

export default async function SituationPage({ params }: Props) {
  const { slug } = await params;
  const item = getSituationBySlug(slug);
  if (!item) notFound();

  const [{ cases, dirLabel }, consultation] = await Promise.all([
    safeCases(),
    getConsultationContent(),
  ]);

  const context = `Ситуация: ${item.name}`;
  const others = SITUATIONS.filter((s) => s.slug !== item.slug);

  return (
    <SiteShell>
      <PageHero eyebrow="Ситуация" title={item.title} description={item.lead} />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-16 sm:gap-20 lg:gap-24 [&>*]:min-w-0">
          {/* Первое действие — сразу под заголовком, до длинного текста. */}
          <div className="-mt-6 md:-mt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
              <PrimaryCtaButton context={context} />
              <Button href="/directions/endodontics" variant="secondary">
                Как мы лечим каналы
              </Button>
            </div>
            <CtaCaption className="mt-3" />
          </div>

          <div className="grid gap-6 sm:gap-8 lg:grid-cols-2 [&>*]:min-w-0">
            {item.sections.map((section, index) => (
              <Card
                key={section.title}
                // Нечётное число блоков: последний занимает всю ширину,
                // чтобы не оставлять пустую половину ряда.
                className={
                  item.sections.length % 2 === 1 &&
                  index === item.sections.length - 1
                    ? "lg:col-span-2"
                    : ""
                }
              >
                <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                  {section.title}
                </h2>

                {section.text?.length ? (
                  <div
                    className={`mt-3 space-y-3 sm:mt-4 ${typography.body} text-[var(--color-gray-700)]`}
                  >
                    {section.text.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}

                {section.items?.length ? (
                  <ul
                    className={`mt-3 space-y-2 sm:mt-4 sm:space-y-3 ${typography.body} text-[var(--color-gray-700)]`}
                  >
                    {section.items.map((point) => (
                      <li key={point} className="flex gap-3">
                        <span
                          aria-hidden
                          className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-teal)] sm:mt-3"
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {section.note ? (
                  <p
                    className={`mt-4 border-l-2 border-[var(--color-teal)] pl-4 ${typography.bodySm} text-[var(--color-gray-700)]`}
                  >
                    {section.note}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>

          {item.urgent ? (
            <div
              role="note"
              className="rounded-2xl border border-[var(--color-gold)] bg-[var(--color-gold)]/10 px-5 py-5 sm:px-6"
            >
              <p className={`${typography.h4} text-[var(--color-navy)]`}>
                Когда ждать нельзя
              </p>
              <p className={`mt-2 ${typography.body} text-[var(--color-gray-700)]`}>
                {item.urgent}
              </p>
            </div>
          ) : null}

          <div>
            <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
              {consultation.title}
            </h2>
            {consultation.description ? (
              <p
                className={`mt-2 max-w-3xl sm:mt-3 ${typography.body} text-[var(--color-gray-700)]`}
              >
                {consultation.description}
              </p>
            ) : null}

            <div className="mt-6 sm:mt-8">
              <ConsultationInfo context={context} />
            </div>
          </div>

          {cases.length ? (
            <div>
              <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                    Зубы, которые удалось сохранить
                  </h2>
                  <p
                    className={`mt-2 sm:mt-3 ${typography.body} text-[var(--color-gray-700)]`}
                  >
                    Клинические случаи со снимками до и после лечения.
                  </p>
                </div>

                <div className="shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
                  <Button
                    href={`/cases?direction=${CASES_DIRECTION}`}
                    variant="secondary"
                  >
                    Все случаи
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {cases.map((caseItem) => (
                  <CaseCard
                    key={caseItem.slug}
                    item={caseItem}
                    dirLabel={dirLabel}
                  />
                ))}
              </div>
            </div>
          ) : null}

          <FaqSection items={item.faq} />

          <div>
            <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
              Другие ситуации
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-6">
              {others.map((other) => (
                <Link
                  key={other.slug}
                  href={`/situations/${other.slug}`}
                  className="group block h-full"
                >
                  <Card className="h-full p-4 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg sm:p-6">
                    <h3 className={`${typography.h4} text-[var(--color-navy)]`}>
                      {other.name}
                    </h3>
                    <p
                      className={`mt-2 ${typography.bodySm} text-[var(--color-gray-700)]`}
                    >
                      {other.description}
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-[var(--color-navy)] px-5 py-8 text-white sm:px-6 sm:py-10 md:px-10 md:py-12">
            <div className="max-w-3xl">
              <h2 className={typography.h2}>
                Пришлите снимок — скажем, есть ли шанс сохранить зуб
              </h2>

              <p className="mt-4 text-sm leading-6 text-white/80 sm:mt-6 sm:text-base sm:leading-7">
                Это предварительная оценка по снимку. Окончательное решение
                принимается на очном приёме.
              </p>

              <div className="mt-8">
                <PrimaryCtaButton context={context} />
              </div>

              <CtaCaption inverted className="mt-3" />
            </div>
          </div>

          <ContraindicationsNote className="text-center" />
        </div>
      </Section>
    </SiteShell>
  );
}

// app/prices/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { PrimaryCtaButton } from "@/components/contact/contact-modal";
import { CtaCaption } from "@/components/consultation/cta-caption";
import { ContraindicationsNote } from "@/components/legal/contraindications-note";
import {
  getConsultationContent,
  getEndoPricesContent,
  getPriceListContent,
} from "@/lib/homepage";
import { formatRub, type EndoStage } from "@/lib/endo-prices";
import type { PriceCategory, PriceItem } from "@/lib/price-list";
import { pageOpenGraph } from "@/lib/seo";
import { typography } from "@/lib/typography";

// Цены редактируются в админке — обновляем раз в минуту, как остальные страницы.
export const revalidate = 60;

const DESCRIPTION =
  "Цены на лечение зубов в Lucenta, Москва: консультация, лечение и перелечивание каналов, реставрация, протезирование, имплантация, гигиена.";

export const metadata: Metadata = {
  title: "Цены на лечение зубов в Москве",
  description: DESCRIPTION,
  alternates: { canonical: "/prices" },
  openGraph: pageOpenGraph({
    title: "Цены — Lucenta",
    description: DESCRIPTION,
    url: "/prices",
  }),
};

type Row = {
  name: string;
  /** «от 7 500 ₽», «3 000 ₽» или «по запросу». */
  price: string;
  unit: string;
  note: string;
};

function itemRow(item: PriceItem): Row {
  return {
    name: item.name,
    price: item.price
      ? `${item.priceFrom ? "от " : ""}${formatRub(item.price)}`
      : "по запросу",
    unit: item.unit,
    note: item.note,
  };
}

// Цены лечения каналов берутся из этапов инфографики — одна цена в одном месте.
function endoRows(stages: EndoStage[]): Row[] {
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const stage of stages) {
    if (!stage.price || seen.has(stage.title)) continue;
    seen.add(stage.title);
    rows.push({
      name: stage.title,
      price: `${stage.priceFrom ? "от " : ""}${formatRub(stage.price)}`,
      unit: stage.perCanal ? "за канал" : "",
      note:
        stage.optional && stage.condition ? `Нужен, ${stage.condition}` : "",
    });
  }
  return rows;
}

function rowsFor(
  category: PriceCategory,
  endoStages: EndoStage[],
  consultation: { price: string; duration: string },
): Row[] {
  const rows: Row[] = [];
  if (category.source === "endo-stages") rows.push(...endoRows(endoStages));
  if (category.source === "consultation" && consultation.price.trim()) {
    rows.push({
      name: "Консультация",
      price: consultation.price.trim(),
      unit: "",
      note: consultation.duration.trim()
        ? `Длительность — ${consultation.duration.trim()}`
        : "",
    });
  }
  rows.push(...category.items.map(itemRow));
  return rows;
}

export default async function PricesPage() {
  const [content, endo, consultation] = await Promise.all([
    getPriceListContent(),
    getEndoPricesContent(),
    getConsultationContent(),
  ]);

  // Раздел без позиций не показываем: пустой заголовок «Имплантация»
  // без цен выглядел бы как недоделка.
  const sections = content.categories
    .map((category, index) => ({
      category,
      anchor: category.slug || `section-${index + 1}`,
      rows: rowsFor(category, endo.stages, consultation),
    }))
    .filter((s) => s.rows.length > 0);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Цены"
        title={content.title}
        description={content.description}
      />

      <Section className="pb-20 md:pb-28">
        {sections.length > 1 ? (
          <nav
            aria-label="Разделы цен"
            className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0"
          >
            <ul className="flex gap-2 pb-1 md:flex-wrap">
              {sections.map(({ category, anchor }) => (
                <li key={anchor} className="shrink-0">
                  <a
                    href={`#${anchor}`}
                    className={`inline-flex rounded-full border border-[var(--color-gray-200)] bg-white px-4 py-2 ${typography.bodySm} font-medium text-[var(--color-navy)] transition hover:border-[var(--color-teal)] hover:text-[var(--color-teal)]`}
                  >
                    {category.title.split(" — ")[0]}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="mt-8 grid gap-6 sm:mt-10 sm:gap-8">
          {sections.map(({ category, anchor, rows }) => (
            <Card
              key={anchor}
              id={anchor}
              className="scroll-mt-24 md:scroll-mt-28"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                <div className="max-w-3xl">
                  <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
                    {category.title}
                  </h2>
                  {category.description ? (
                    <p
                      className={`mt-2 ${typography.bodySm} text-[var(--color-gray-700)]`}
                    >
                      {category.description}
                    </p>
                  ) : null}
                </div>

                {category.source === "endo-stages" ? (
                  <Link
                    href="/directions/endodontics#prices"
                    className={`shrink-0 ${typography.bodySm} font-medium text-[var(--color-teal)] hover:text-[var(--color-navy)]`}
                  >
                    Как складывается стоимость →
                  </Link>
                ) : category.directionSlug ? (
                  <Link
                    href={`/directions/${category.directionSlug}`}
                    className={`shrink-0 ${typography.bodySm} font-medium text-[var(--color-teal)] hover:text-[var(--color-navy)]`}
                  >
                    О направлении →
                  </Link>
                ) : null}
              </div>

              <ul className="mt-5 divide-y divide-[var(--color-gray-100)] border-t border-[var(--color-gray-100)] sm:mt-6">
                {rows.map((row, i) => (
                  <li
                    key={`${row.name}-${i}`}
                    className="flex items-start justify-between gap-4 py-4"
                  >
                    <div className="min-w-0">
                      <p
                        className={`${typography.body} text-[var(--color-navy)]`}
                      >
                        {row.name}
                      </p>
                      {row.note ? (
                        <p
                          className={`mt-1 ${typography.caption} text-[var(--color-gray-500)]`}
                        >
                          {row.note}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`${typography.body} whitespace-nowrap font-semibold text-[var(--color-navy)]`}
                      >
                        {row.price}
                      </p>
                      {row.unit ? (
                        <p
                          className={`${typography.caption} whitespace-nowrap text-[var(--color-gray-500)]`}
                        >
                          {row.unit}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>

        {content.notes.length ? (
          <div
            className={`mt-8 max-w-4xl space-y-2 ${typography.bodySm} text-[var(--color-gray-600)]`}
          >
            {content.notes.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        ) : null}

        <div className="mt-12 rounded-[28px] bg-[var(--color-navy)] px-5 py-8 text-white sm:px-6 sm:py-10 md:px-10 md:py-12">
          <div className="max-w-3xl">
            <h2 className={typography.h2}>
              Пришлите снимок — врач оценит ситуацию и назовёт стоимость
            </h2>
            <p className="mt-4 text-sm leading-6 text-white/80 sm:mt-6 sm:text-base sm:leading-7">
              Итоговая цена зависит от того, что именно нужно сделать. По снимку
              врач скажет, какие этапы понадобятся.
            </p>
            <div className="mt-8">
              <PrimaryCtaButton context="Страница «Цены»" />
            </div>
            <CtaCaption inverted className="mt-3" />
          </div>
        </div>

        <ContraindicationsNote className="mt-8 text-center" />
      </Section>
    </SiteShell>
  );
}

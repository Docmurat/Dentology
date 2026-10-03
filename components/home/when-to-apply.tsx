import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { getWhenContent } from "@/lib/homepage";
import { typography } from "@/lib/typography";
import Link from "next/link";
import { SITUATIONS } from "@/lib/situations";

export async function WhenToApply() {
  const when = await getWhenContent();

  return (
    <Section id="when-to-apply" className="py-20 md:py-28">
      <SectionHeading
        eyebrow={when.eyebrow}
        title={when.title}
        description={when.description}
      />

      {/* Карточки растягиваются на ширину; максимум 4 в ряд, далее — новый ряд. */}
      <div className="mt-8 flex flex-wrap gap-4 sm:mt-12 sm:gap-6">
        {when.items.map((item, index) => (
          <Card
            key={index}
            className="grow basis-full p-4 sm:basis-[calc(50%-0.75rem)] sm:p-6 lg:basis-[calc(25%-1.125rem)]"
          >
            <h3 className={`${typography.h4} text-[var(--color-navy)]`}>
              {item.title}
            </h3>

            <p
              className={`mt-2 sm:mt-3 ${typography.bodySm} text-[var(--color-gray-700)]`}
            >
              {item.text}
            </p>
          </Card>
        ))}
      </div>

      {/* Карточки выше редактируются в админке и ссылок не несут, поэтому
          переходы на подробные страницы стоят отдельной строкой. */}
      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-3 sm:mt-8">
        <span className={`${typography.bodySm} text-[var(--color-gray-600)]`}>
          Подробнее о ситуациях:
        </span>
        {SITUATIONS.map((item) => (
          <Link
            key={item.slug}
            href={`/situations/${item.slug}`}
            className={`rounded-full border border-[var(--color-teal)] px-4 py-2 ${typography.bodySm} font-medium text-[var(--color-teal)] transition hover:bg-[var(--color-teal)]/10`}
          >
            {item.name}
          </Link>
        ))}
      </div>
    </Section>
  );
}
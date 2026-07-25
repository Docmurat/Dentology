import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { getWhenContent } from "@/lib/homepage";
import { typography } from "@/lib/typography";

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
    </Section>
  );
}
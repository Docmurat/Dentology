import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { getWhenContent } from "@/lib/homepage";

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
      <div className="mt-12 flex flex-wrap gap-6">
        {when.items.map((item, index) => (
          <Card
            key={index}
            className="grow basis-[calc(50%-0.75rem)] p-6 lg:basis-[calc(25%-1.125rem)]"
          >
            <h3 className="text-lg font-semibold text-[var(--color-navy)]">
              {item.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
              {item.text}
            </p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
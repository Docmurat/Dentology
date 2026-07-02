import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getIcon } from "@/components/ui/icon-map";
import { getWhyContent } from "@/lib/homepage";

export async function WhyDentology() {
  const why = await getWhyContent();

  return (
    <Section className="py-20 md:py-28">
      <SectionHeading eyebrow={why.eyebrow} title={why.title} />

      {/* Карточки растягиваются; до 4 в ряд, далее — новый ряд. */}
      <div className="mt-12 flex flex-wrap gap-6">
        {why.items.map((item, index) => {
          const Icon = getIcon(item.icon);

          return (
            <Card
              key={index}
              className="h-full grow basis-[calc(50%-0.75rem)] xl:basis-[calc(25%-1.125rem)]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-gray-200)] text-[var(--color-navy-secondary)]">
                <Icon className="h-6 w-6" />
              </div>

              <h3 className="text-lg font-semibold text-[var(--color-navy)]">
                {item.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-[var(--color-gray-700)]">
                {item.text}
              </p>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
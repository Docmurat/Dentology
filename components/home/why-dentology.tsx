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
      <div className="mt-8 flex flex-wrap gap-4 sm:mt-12 sm:gap-6">
        {why.items.map((item, index) => {
          const Icon = getIcon(item.icon);

          return (
            <Card
              key={index}
              className="h-full grow basis-full p-4 sm:basis-[calc(50%-0.75rem)] sm:p-6 lg:basis-[calc(25%-1.125rem)]"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-gray-200)] text-[var(--color-navy-secondary)] sm:mb-5 sm:h-12 sm:w-12">
                <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>

              <h3 className="text-base font-semibold text-[var(--color-navy)] sm:text-lg">
                {item.title}
              </h3>

              <p className="mt-2 text-xs leading-5 text-[var(--color-gray-700)] sm:mt-4 sm:text-sm sm:leading-7">
                {item.text}
              </p>
            </Card>
          );
        })}
      </div>
    </Section>
  );
}
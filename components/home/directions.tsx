import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { getDirections, type DirectionItem } from "@/lib/directions-db";
import { getSectionHeadingContent } from "@/lib/homepage";

const linkCls =
  "inline-flex text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]";

// Главное направление — крупная карточка.
function FeaturedCard({ item }: { item: DirectionItem }) {
  return (
    <Card className="p-5 sm:p-8 md:p-10">
      <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--color-teal)] sm:text-sm sm:tracking-[0.16em]">
        Основное направление
      </p>

      <h3 className="mt-3 text-xl font-semibold text-[var(--color-navy)] sm:mt-4 sm:text-3xl">
        {item.title}
      </h3>

      <p className="mt-2 text-xs font-medium text-[var(--color-navy-secondary)] sm:mt-3 sm:text-sm">
        {item.short}
      </p>

      <p className="mt-4 text-sm leading-6 text-[var(--color-gray-700)] sm:mt-6 sm:text-base sm:leading-7">
        {item.description}
      </p>

      <Link href={`/directions/${item.slug}`} className={`mt-5 sm:mt-8 ${linkCls}`}>
        Подробнее о направлении
      </Link>
    </Card>
  );
}

// Обычное направление — компактная карточка.
function CompactCard({ item }: { item: DirectionItem }) {
  return (
    <Card className="p-4 sm:p-6">
      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
        {item.short}
      </p>

      <h3 className="mt-1.5 text-base font-semibold text-[var(--color-navy)] sm:mt-2 sm:text-lg">
        {item.title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-[var(--color-gray-700)] sm:mt-3 sm:text-sm sm:leading-6">
        {item.description}
      </p>

      <Link href={`/directions/${item.slug}`} className={`mt-4 ${linkCls}`}>
        Подробнее о направлении
      </Link>
    </Card>
  );
}

export async function Directions() {
  const directions = await getDirections();
  const heading = await getSectionHeadingContent("directions");

  // Позиция в коллаже задаётся в админке (collageRole).
  const featured = directions.find((item) => item.collageRole === "featured");
  const large = directions.filter((item) => item.collageRole === "large");
  const small = directions.filter((item) => item.collageRole === "small");
  const rest = [...large, ...small];

  return (
    <Section id="directions" className="py-20 md:py-28">
      <SectionHeading
        eyebrow={heading.eyebrow}
        title={heading.title}
        description={heading.description}
      />

      {/* До lg: главное направление во всю ширину, остальные —
          в один столбец на телефоне и в два от 768px (планшет). */}
      <div className="mt-8 grid gap-4 sm:mt-12 sm:gap-6 md:grid-cols-2 lg:hidden">
        {featured ? (
          <div className="md:col-span-2">
            <FeaturedCard item={featured} />
          </div>
        ) : null}

        {rest.map((item) => (
          <CompactCard key={item.slug} item={item} />
        ))}
      </div>

      {/* От lg: прежний коллаж в две колонки разной ширины. */}
      <div className="mt-12 hidden gap-6 lg:grid lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          {featured ? <FeaturedCard item={featured} /> : null}
          {large.map((item) => (
            <CompactCard key={item.slug} item={item} />
          ))}
        </div>

        <div className="grid gap-6">
          {small.map((item) => (
            <CompactCard key={item.slug} item={item} />
          ))}
        </div>
      </div>
    </Section>
  );
}
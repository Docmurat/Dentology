import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { getDirections } from "@/lib/directions-db";

export async function Directions() {
  const directions = await getDirections();

  // Позиция в коллаже задаётся в админке (collageRole).
  const featured = directions.find((item) => item.collageRole === "featured");
  const large = directions.filter((item) => item.collageRole === "large");
  const small = directions.filter((item) => item.collageRole === "small");

  return (
    <Section id="directions" className="py-20 md:py-28">
      <SectionHeading
        eyebrow="Клинические направления"
        title="Система лечения, а не отдельные услуги"
        description="Эндодонтия является ключевым направлением, но лечение всегда рассматривается в контексте общей клинической картины."
      />

      <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="grid gap-6">
          {featured ? (
            <Card className="p-8 md:p-10">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-teal)]">
                Основное направление
              </p>

              <h3 className="mt-4 text-3xl font-semibold text-[var(--color-navy)]">
                {featured.title}
              </h3>

              <p className="mt-3 text-sm font-medium text-[var(--color-navy-secondary)]">
                {featured.short}
              </p>

              <p className="mt-6 text-base leading-7 text-[var(--color-gray-700)]">
                {featured.description}
              </p>

              <Link
                href={`/directions/${featured.slug}`}
                className="mt-8 inline-flex text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
              >
                Подробнее о направлении
              </Link>
            </Card>
          ) : null}

          {large.map((item) => (
            <Card key={item.slug} className="p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                {item.short}
              </p>

              <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
                {item.description}
              </p>

              <Link
                href={`/directions/${item.slug}`}
                className="mt-4 inline-flex text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
              >
                Подробнее о направлении
              </Link>
            </Card>
          ))}
        </div>

        <div className="grid gap-6">
          {small.map((item) => (
            <Card key={item.slug} className="p-6">
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                {item.short}
              </p>

              <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
                {item.description}
              </p>

              <Link
                href={`/directions/${item.slug}`}
                className="mt-4 inline-flex text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
              >
                Подробнее о направлении
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </Section>
  );
}
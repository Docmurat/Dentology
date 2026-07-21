import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { getDirections } from "@/lib/directions-db";

export const metadata: Metadata = {
  title: "Направления лечения",
  description:
    "Клинические направления Lucenta: эндодонтия, имплантация, гнатология, ортопедия и реставрации в рамках единого диагностического подхода.",
};

export const revalidate = 60;

export default async function DirectionsPage() {
  const directions = await getDirections();
  const featured = directions.find((item) => item.featured);
  const others = directions.filter((item) => !item.featured);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Направления"
        title="Клинические направления Lucenta"
        description="Эндодонтия является ключевым направлением, но лечение всегда рассматривается в контексте общей клинической картины."
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {featured ? (
            <Card className="p-8 md:p-10">
              <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-teal)]">
                Основное направление
              </p>

              <h2 className="mt-4 text-3xl font-semibold text-[var(--color-navy)]">
                {featured.title}
              </h2>

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

          <div className="grid gap-6">
            {others.map((item) => (
              <Card key={item.slug} className="p-6">
                <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                  {item.short}
                </p>

                <h2 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                  {item.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
                  {item.description}
                </p>

                <Link
                  href={`/directions/${item.slug}`}
                  className="mt-4 inline-flex text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                >
                  Подробнее
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
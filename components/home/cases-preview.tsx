import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { getAllCases } from "@/lib/cases";
import { directionLabel } from "@/lib/directions";

export async function CasesPreview() {
  const previewCases = (await getAllCases()).slice(0, 3);

  return (
    <Section id="cases" className="py-20 md:py-28">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Клинические случаи"
          title="Реальные ситуации, в которых решение требует больше, чем стандартного подхода"
          description="Кейсы, где ранее рекомендовали удаление, отказывали в лечении или не удавалось добиться стабильного результата."
        />

        <Button href="/cases" variant="secondary">
          Смотреть все случаи
        </Button>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {previewCases.map((item) => (
          <Link
            key={item.slug}
            href={`/cases/${item.slug}`}
            className="group block h-full"
          >
            <Card className="flex h-full flex-col overflow-hidden transition group-hover:-translate-y-1 group-hover:shadow-lg">
              <div className="relative mb-5">
                <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl">
                  {item.coverImage ? (
                    <Image
                      src={item.coverImage}
                      alt={item.title}
                      width={1500}
                      height={1000}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
              </div>

              <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                {directionLabel(item.directionSlug)}
              </p>

              <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                {item.title}
              </h3>

              <p className="mt-3 flex-1 text-sm leading-6 text-[var(--color-gray-700)]">
                {item.excerpt}
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </Section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { SITUATIONS } from "@/lib/situations";
import { typography } from "@/lib/typography";

export const metadata: Metadata = {
  title: "Ситуации, с которыми к нам приходят",
  description:
    "Рекомендовали удалить зуб, поставили диагноз «киста», болит зуб после лечения каналов — что это значит и что можно сделать.",
  alternates: { canonical: "/situations" },
};

export default function SituationsPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Ситуации"
        title="С чем к нам приходят"
        description="Выберите свою ситуацию: расскажем, что она означает, когда зуб удаётся сохранить и с чего начать."
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {SITUATIONS.map((item) => (
            <Link
              key={item.slug}
              href={`/situations/${item.slug}`}
              className="group block h-full"
            >
              <Card className="flex h-full flex-col p-4 transition duration-200 group-hover:-translate-y-1 group-hover:shadow-lg sm:p-6">
                <h2 className={`${typography.h4} text-[var(--color-navy)]`}>
                  {item.name}
                </h2>

                <p
                  className={`mt-2 sm:mt-3 ${typography.bodySm} text-[var(--color-gray-700)]`}
                >
                  {item.description}
                </p>

                <span
                  className={`mt-auto pt-4 ${typography.eyebrowSm} text-[var(--color-teal)]`}
                >
                  Подробнее
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}

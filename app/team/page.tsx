import type { Metadata } from "next";
import Image from "next/image";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { teamData } from "@/lib/team-data";

export const metadata: Metadata = {
  title: "Команда Dentology",
  description:
    "Клиническая команда Dentology: специалисты различных направлений, работающие в рамках единого диагностического подхода.",
};

export default function TeamPage() {
  const featured = teamData.filter((d) => d.featured);
  const others = teamData.filter((d) => !d.featured);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Команда"
        title="Клиническая команда Dentology"
        description="Сложные клинические случаи требуют не одного специалиста, а согласованной работы команды врачей разных направлений."
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-12">

          {/* Ведущие специалисты */}
          {featured.length ? (
            <div>
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Ведущие специалисты
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {featured.map((member) => (
                  <Card key={member.slug} className="overflow-hidden p-0">
                    <div className="bg-[var(--color-gray-100)]">
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={600}
                        height={600}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-6">
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                        {member.shortRole}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                        {member.name}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
                        {member.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

          {/* Остальная команда */}
          {others.length ? (
            <div>
              <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
                Команда
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {others.map((member) => (
                  <Card key={member.slug} className="overflow-hidden p-0">
                    <div className="bg-[var(--color-gray-100)]">
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={600}
                        height={600}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="p-6">
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                        {member.shortRole}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                        {member.name}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
                        {member.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}

        </div>
      </Section>
    </SiteShell>
  );
}
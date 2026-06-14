import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { TeamCard } from "@/components/team/team-card";
import { getTeamMembers } from "@/lib/team";

export const metadata: Metadata = {
  title: "Команда",
  description:
    "Клиническая команда Dentology: главный врач, ведущие специалисты направлений и персонал, работающие в единой системе клинического мышления.",
};

// Новые сотрудники из кабинета появляются без пересборки (ISR).
export const revalidate = 60;

export default async function TeamPage() {
  const members = await getTeamMembers();
  const doctors = members.filter((member) => member.category === "doctor");
  const staff = members.filter((member) => member.category === "staff");

  return (
    <SiteShell>
      <PageHero
        eyebrow="Команда"
        title="Клиническая команда Dentology"
        description="Сложные случаи требуют междисциплинарного подхода. Над планом лечения работают специалисты разных направлений в рамках единой системы принятия решений."
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {doctors.map((member) => (
            <TeamCard key={member.slug} member={member} />
          ))}
        </div>

        {staff.length ? (
          <div className="mt-20">
            <SectionHeading eyebrow="Персонал" title="Команда поддержки" />

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {staff.map((member) => (
                <TeamCard key={member.slug} member={member} />
              ))}
            </div>
          </div>
        ) : null}
      </Section>
    </SiteShell>
  );
}

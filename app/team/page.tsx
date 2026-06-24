import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { TeamCard } from "@/components/team/team-card";
import { TeamChiefHero } from "@/components/team/team-chief-hero";
import { getTeamMembers } from "@/lib/team";

export const metadata: Metadata = {
  title: "Команда",
  description:
    "Клиническая команда Dentology: главный врач, ведущие специалисты направлений и персонал, работающие в единой системе клинического мышления.",
};

export const revalidate = 60;

export default async function TeamPage() {
  const members = await getTeamMembers();
  const chief = members.find((member) => member.isChief) ?? null;
  const rest = members.filter((member) => !member.isChief);

  return (
    <SiteShell>
      <PageHero
        eyebrow="Команда"
        title="Клиническая команда Dentology"
        description="Сложные случаи требуют междисциплинарного подхода. Над планом лечения работают специалисты разных направлений в рамках единой системы принятия решений."
      />

      <Section className="pb-20 md:pb-28">
        {chief ? <TeamChiefHero chief={chief} /> : null}

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:mt-20">
          {rest.map((member) => (
            <TeamCard key={member.slug} member={member} compact />
          ))}
        </div>
      </Section>
    </SiteShell>
  );
}
import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { TeamCard } from "@/components/team/team-card";
import { TeamChiefHero } from "@/components/team/team-chief-hero";
import { getTeamMembers } from "@/lib/team";
import { getPageHeading } from "@/lib/page-content";

export const metadata: Metadata = {
  title: "Команда",
  description:
    "Клиническая команда Lucenta: главный врач, ведущие специалисты направлений и персонал, работающие в единой системе клинического мышления.",
};

export const revalidate = 60;

export default async function TeamPage() {
  const members = await getTeamMembers();
  const heading = await getPageHeading("team");
  const chief = members.find((member) => member.isChief) ?? null;
  const rest = members.filter((member) => !member.isChief);

  return (
    <SiteShell>
      <PageHero
        eyebrow={heading.eyebrow}
        title={heading.title}
        description={heading.description}
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
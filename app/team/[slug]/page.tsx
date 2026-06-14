import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getTeamMemberBySlug, getTeamSlugs } from "@/lib/team";

export const revalidate = 60;

type TeamMemberPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getTeamSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: TeamMemberPageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getTeamMemberBySlug(slug);
  if (!member) return {};
  return {
    title: member.name,
    description: member.excerpt || member.role,
  };
}

export default async function TeamMemberPage({ params }: TeamMemberPageProps) {
  const { slug } = await params;
  const member = await getTeamMemberBySlug(slug);

  if (!member) {
    notFound();
  }

  return (
    <SiteShell>
      <PageHero
        eyebrow={member.isChief ? "Главный врач" : member.position}
        title={member.name}
        description={member.role}
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <div className="rounded-[28px] bg-[var(--color-gray-100)] p-4 shadow-[0_8px_28px_rgba(0,0,0,0.06)] md:p-6">
            <div className="overflow-hidden rounded-[22px] border border-[var(--color-gray-200)] bg-white">
              <Image
                src={member.image}
                alt={member.name}
                width={900}
                height={1125}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <p className="text-sm uppercase tracking-[0.14em] text-[var(--color-teal)]">
                {member.shortRole || member.position}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-navy)]">
                О специалисте
              </h2>
              <p className="mt-4 text-base leading-7 text-[var(--color-gray-700)]">
                {member.description}
              </p>
            </Card>

            <Button href="/contacts">Записаться на консультацию</Button>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}

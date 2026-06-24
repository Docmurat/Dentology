import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MemberPhoto } from "@/components/team/member-photo";
import type { TeamMember } from "@/lib/team-data";

type TeamCardProps = {
  member: TeamMember;
  /** Компактный вид — для единого списка под шапкой. */
  compact?: boolean;
};

export function TeamCard({ member, compact = false }: TeamCardProps) {
  const eyebrow = member.isChief
    ? "Главный врач"
    : member.shortRole || member.position;

  return (
    <Card
      id={member.slug}
      className="group relative flex h-full flex-col overflow-hidden p-0 transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-[var(--color-teal)]"
    >
      <MemberPhoto src={member.image} name={member.name} />

      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-6"}`}>
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-teal)]">
          {eyebrow}
        </p>

        <h3
          className={`mt-2 font-semibold text-[var(--color-navy)] ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {member.name}
        </h3>

        <p className="mt-1 text-sm font-medium text-[var(--color-navy-secondary)]">
          {member.position}
        </p>

        <p
          className={`mt-2 text-sm leading-6 text-[var(--color-gray-700)] ${
            compact ? "line-clamp-2" : "line-clamp-4"
          }`}
        >
          {member.excerpt || member.description}
        </p>

        <div className={`mt-auto ${compact ? "pt-4" : "pt-5"}`}>
          <Link
            href={`/team/${member.slug}`}
            className="inline-flex text-sm font-medium text-[var(--color-navy-secondary)] after:absolute after:inset-0 group-hover:text-[var(--color-navy)] group-hover:underline focus:outline-none"
          >
            Подробнее о враче
          </Link>
        </div>
      </div>
    </Card>
  );
}
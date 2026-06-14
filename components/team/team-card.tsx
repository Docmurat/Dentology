import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { TeamMember } from "@/lib/team-data";

// Карточка одинакового размера: фото 4:5, должность, имя, краткое описание
// и ссылка «Продолжить чтение». Стиль повторяет блок команды на главной.
export function TeamCard({ member }: { member: TeamMember }) {
  const eyebrow = member.isChief
    ? "Главный врач"
    : member.shortRole || member.position;

  return (
    <Card className="flex h-full flex-col overflow-hidden p-0" id={member.slug}>
      <div className="bg-[var(--color-gray-100)]">
        <div className="aspect-[4/5]">
          <Image
            src={member.image}
            alt={member.name}
            width={700}
            height={875}
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-teal)]">
          {eyebrow}
        </p>

        <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
          {member.name}
        </h3>

        <p className="mt-1 text-sm font-medium text-[var(--color-navy-secondary)]">
          {member.position}
        </p>

        <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--color-gray-700)]">
          {member.excerpt || member.description}
        </p>

        <div className="mt-auto pt-5">
          <Link
            href={`/team/${member.slug}`}
            className="inline-flex text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
          >
            Продолжить чтение
          </Link>
        </div>
      </div>
    </Card>
  );
}

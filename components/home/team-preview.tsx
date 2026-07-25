import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { getFeaturedTeam } from "@/lib/team";
import { Button } from "@/components/ui/button";
import { getSectionHeadingContent } from "@/lib/homepage";
import { typography } from "@/lib/typography";
import type { TeamMember } from "@/lib/team-data";

// Карточка врача. На телефоне круглый аватар и имя в ряд, описание под ними.
// От 640px — фото 3:4 слева, весь текст справа.
// На десктопе (lg+) фото растягивается на всю высоту карточки.
function SmallMemberCard({ member }: { member: TeamMember }) {
  return (
    <Link href={`/team/${member.slug}`} className="group block min-w-0">
      <Card className="overflow-hidden p-0 transition group-hover:-translate-y-1 group-hover:shadow-lg">
        <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[120px_1fr] lg:grid-cols-[100px_1fr] xl:grid-cols-[120px_1fr]">
          {/* Фото */}
          <div className="col-start-1 row-start-1 self-start p-4 pr-0 sm:row-span-3 sm:p-0 lg:self-stretch">
            <div className="aspect-square w-16 overflow-hidden rounded-full bg-[var(--color-gray-100)] sm:aspect-[3/4] sm:w-full sm:rounded-none lg:aspect-auto lg:h-full">
              <Image
                src={member.image}
                alt={member.name}
                width={300}
                height={400}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* Должность и имя */}
          <div className="col-start-2 row-start-1 min-w-0 px-4 pt-4 sm:px-5 sm:pt-5 lg:px-4 lg:pt-4 xl:px-5 xl:pt-5">
            <p className={`${typography.eyebrow} text-[var(--color-gray-500)]`}>
              {member.shortRole}
            </p>

            <h3
              className={`mt-1.5 lg:mt-2 ${typography.h4} text-[var(--color-navy)]`}
            >
              {member.name}
            </h3>
          </div>

          {/* Описание — целиком, без обрезки */}
          <div className="col-span-2 row-start-2 min-w-0 px-4 pt-3 sm:col-span-1 sm:col-start-2 sm:px-5 lg:px-4 lg:pt-2 xl:px-5 xl:pt-3">
            <p className={`${typography.bodySm} text-[var(--color-gray-700)]`}>
              {member.description}
            </p>
          </div>

          {/* Ссылка */}
          <div className="col-span-2 row-start-3 px-4 pb-4 pt-3 sm:col-span-1 sm:col-start-2 sm:px-5 sm:pb-5 sm:pt-4 lg:px-4 lg:pb-4 lg:pt-3 xl:px-5 xl:pb-5 xl:pt-4">
            <span
              className={`inline-flex ${typography.bodySm} font-medium text-[var(--color-navy-secondary)] group-hover:text-[var(--color-navy)]`}
            >
              Подробнее ...
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export async function TeamPreview() {
  const featuredMembers = await getFeaturedTeam();
  const heading = await getSectionHeadingContent("team");
  const leadMember = featuredMembers[0];
  const otherFeaturedMembers = featuredMembers.slice(1);

  const topRightMembers = otherFeaturedMembers.slice(0, 2);
  const bottomLeftMember = otherFeaturedMembers[2];
  const bottomRightMember = otherFeaturedMembers[3];

  return (
    <Section id="team" className="py-20 md:py-28">
      <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1">
          <SectionHeading
            eyebrow={heading.eyebrow}
            title={heading.title}
            description={heading.description}
          />
        </div>

        <div className="shrink-0">
          <Button href="/team" variant="secondary">
            Вся команда
          </Button>
        </div>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Верхняя левая — ведущий специалист */}
        {leadMember ? (
          <Link
            href={`/team/${leadMember.slug}`}
            className="group block min-w-0"
          >
            <Card className="overflow-hidden p-0 transition group-hover:-translate-y-1 group-hover:shadow-lg">
              <div className="grid md:grid-cols-[0.9fr_1.1fr] lg:grid-cols-[0.75fr_1.25fr] xl:grid-cols-[0.9fr_1.1fr]">
                <div className="bg-[var(--color-gray-100)]">
                  <Image
                    src={leadMember.image}
                    alt={leadMember.name}
                    width={900}
                    height={1100}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="min-w-0 p-5 md:p-8 lg:p-6 xl:p-8">
                  <p className={`${typography.eyebrow} text-[var(--color-teal)]`}>
                    Главный врач
                  </p>

                  <h3
                    className={`mt-2 md:mt-3 ${typography.h3} text-[var(--color-navy)]`}
                  >
                    {leadMember.name}
                  </h3>

                  <p
                    className={`mt-2 md:mt-3 ${typography.caption} font-medium text-[var(--color-navy-secondary)]`}
                  >
                    {leadMember.role}
                  </p>

                  <p
                    className={`mt-3 md:mt-5 ${typography.bodySm} text-[var(--color-gray-700)]`}
                  >
                    {leadMember.description}
                  </p>

                  <span
                    className={`mt-5 inline-flex md:mt-8 ${typography.caption} font-medium text-[var(--color-navy-secondary)] group-hover:text-[var(--color-navy)]`}
                  >
                    Подробнее ...
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        ) : null}

        {/* Верхняя правая — 2 карточки */}
        <div className="grid gap-6">
          {topRightMembers.map((member) => (
            <SmallMemberCard key={member.slug} member={member} />
          ))}
        </div>

        {/* Нижняя левая — 1 карточка */}
        {bottomLeftMember ? (
          <SmallMemberCard member={bottomLeftMember} />
        ) : (
          <div />
        )}

        {/* Нижняя правая — 1 карточка */}
        {bottomRightMember ? (
          <SmallMemberCard member={bottomRightMember} />
        ) : (
          <div />
        )}
      </div>
    </Section>
  );
}
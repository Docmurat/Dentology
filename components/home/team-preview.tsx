import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Card } from "@/components/ui/card";
import { getFeaturedTeam } from "@/lib/team";
import { Button } from "@/components/ui/button";

export async function TeamPreview() {
  const featuredMembers = await getFeaturedTeam();
  const leadMember = featuredMembers[0];
  const otherFeaturedMembers = featuredMembers.slice(1);

  const topRightMembers = otherFeaturedMembers.slice(0, 2);
  const bottomLeftMember = otherFeaturedMembers[2];
  const bottomRightMember = otherFeaturedMembers[3];

  return (
    <Section id="team" className="py-20 md:py-28">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <SectionHeading
            eyebrow="Клиническая команда"
            title="Сложные случаи требуют междисциплинарного подхода"
            description="Dentology объединяет ведущих специалистов разных направлений, работающих в рамках единой системы клинического мышления и принятия решений."
          />
        </div>

        <Button href="/team" variant="secondary">
          Вся команда
        </Button>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        {/* Верхняя левая — ведущий специалист */}
        {leadMember ? (
          <Link href={`/team/${leadMember.slug}`} className="group block">
            <Card className="overflow-hidden p-0 transition group-hover:-translate-y-1 group-hover:shadow-lg">
              <div className="grid md:grid-cols-[0.9fr_1.1fr]">
                <div className="bg-[var(--color-gray-100)]">
                  <Image
                    src={leadMember.image}
                    alt={leadMember.name}
                    width={900}
                    height={1100}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-6 md:p-8">
                  <p className="text-sm uppercase tracking-[0.14em] text-[var(--color-teal)]">
                    Главный врач
                  </p>

                  <h3 className="mt-3 text-2xl font-semibold text-[var(--color-navy)]">
                    {leadMember.name}
                  </h3>

                  <p className="mt-3 text-sm font-medium text-[var(--color-navy-secondary)]">
                    {leadMember.role}
                  </p>

                  <p className="mt-5 text-base leading-7 text-[var(--color-gray-700)]">
                    {leadMember.description}
                  </p>

                  <span className="mt-8 inline-flex text-sm font-medium text-[var(--color-navy-secondary)] group-hover:text-[var(--color-navy)]">
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
            <Link
              key={member.slug}
              href={`/team/${member.slug}`}
              className="group block"
            >
              <Card className="overflow-hidden p-0 transition group-hover:-translate-y-1 group-hover:shadow-lg">
                <div className="grid grid-cols-[120px_1fr]">
                  <div className="bg-[var(--color-gray-100)]">
                    <Image
                      src={member.image}
                      alt={member.name}
                      width={300}
                      height={300}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex h-full flex-col p-5">
                    <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                      {member.shortRole}
                    </p>

                    <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                      {member.name}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
                      {member.description}
                    </p>

                    <div className="mt-auto pt-4">
                      <span className="inline-flex text-sm font-medium text-[var(--color-navy-secondary)] group-hover:text-[var(--color-navy)]">
                        Подробнее ...
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Нижняя левая — 1 карточка */}
        {bottomLeftMember ? (
          <Link
            href={`/team/${bottomLeftMember.slug}`}
            className="group block"
          >
            <Card className="overflow-hidden p-0 transition group-hover:-translate-y-1 group-hover:shadow-lg">
              <div className="grid grid-cols-[120px_1fr]">
                <div className="bg-[var(--color-gray-100)]">
                  <Image
                    src={bottomLeftMember.image}
                    alt={bottomLeftMember.name}
                    width={300}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex h-full flex-col p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                    {bottomLeftMember.shortRole}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                    {bottomLeftMember.name}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
                    {bottomLeftMember.description}
                  </p>

                  <div className="mt-auto pt-4">
                    <span className="inline-flex text-sm font-medium text-[var(--color-navy-secondary)] group-hover:text-[var(--color-navy)]">
                      Подробнее ...
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ) : (
          <div />
        )}

        {/* Нижняя правая — 1 карточка */}
        {bottomRightMember ? (
          <Link
            href={`/team/${bottomRightMember.slug}`}
            className="group block"
          >
            <Card className="overflow-hidden p-0 transition group-hover:-translate-y-1 group-hover:shadow-lg">
              <div className="grid grid-cols-[120px_1fr]">
                <div className="bg-[var(--color-gray-100)]">
                  <Image
                    src={bottomRightMember.image}
                    alt={bottomRightMember.name}
                    width={300}
                    height={300}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="flex h-full flex-col p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-gray-500)]">
                    {bottomRightMember.shortRole}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-[var(--color-navy)]">
                    {bottomRightMember.name}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[var(--color-gray-700)]">
                    {bottomRightMember.description}
                  </p>

                  <div className="mt-auto pt-4">
                    <span className="inline-flex text-sm font-medium text-[var(--color-navy-secondary)] group-hover:text-[var(--color-navy)]">
                      Подробнее ...
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </Section>
  );
}
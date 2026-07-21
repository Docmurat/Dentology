import type { Metadata } from "next";
import Image from "next/image";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPageHeading } from "@/lib/page-content";
import { getPublishedCourses } from "@/lib/courses";
import { getTeamMembers } from "@/lib/team";

export const metadata: Metadata = {
  title: "Обучение",
  description:
    "Lucenta Обучение — практико-ориентированные курсы для врачей стоматологов по эндодонтии, диагностике и сложным клиническим случаям.",
};

export const revalidate = 60;

export default async function EducationPage() {
  const [heading, courses, team] = await Promise.all([
    getPageHeading("education"),
    getPublishedCourses(),
    getTeamMembers(),
  ]);

  const doctorBySlug = new Map(team.map((d) => [d.slug, d]));

  return (
    <SiteShell>
      <PageHero
        eyebrow={heading.eyebrow}
        title={heading.title}
        description={heading.description}
      />

      <Section className="pb-20 md:pb-28">
        {courses.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {courses.map((course) => {
              const doctor = course.doctorSlug
                ? doctorBySlug.get(course.doctorSlug)
                : null;
              const photo = doctor?.image || null;

              return (
                <Card key={course.slug} className="flex flex-col gap-5 sm:flex-row">
                  <div className="w-full shrink-0 self-start overflow-hidden rounded-xl bg-[var(--color-gray-100)] sm:w-44">
                    <div className="relative aspect-[3/4]">
                      {photo ? (
                        <Image
                          src={photo}
                          alt={doctor?.name || course.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 176px"
                          className="object-cover"
                        />
                      ) : null}
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-col">
                    <p className="text-sm uppercase tracking-[0.16em] text-[var(--color-gold)]">
                      Lucenta Обучение
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold text-[var(--color-navy)]">
                      {course.title}
                    </h2>

                    {doctor ? (
                      <p className="mt-1 text-sm font-medium text-[var(--color-navy-secondary)]">
                        {doctor.name}
                      </p>
                    ) : null}

                    {course.learningTypes?.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {course.learningTypes.map((t) => (
                          <span
                            key={t}
                            className="rounded-full border border-[var(--color-gray-200)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-navy)]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    {course.description ? (
                      <p className="mt-3 text-base leading-7 text-[var(--color-gray-700)]">
                        {course.description}
                      </p>
                    ) : null}

                    <div className="mt-auto pt-6">
                      <Button
                        href={`/education/${course.slug}`}
                        variant="gold-outline"
                      >
                        Подробнее
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-[var(--color-gray-500)]">
            Курсы скоро появятся.
          </p>
        )}
      </Section>
    </SiteShell>
  );
}
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/components/layout/site-shell";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCourseBySlug } from "@/lib/courses";
import { getTeamMemberBySlug } from "@/lib/team";
import { getCourseDetail, DEMO_COURSE_DETAIL } from "@/lib/course-content";
import { CourseStats } from "@/components/education/course-stats";
import { CourseReviews } from "@/components/reviews/course-reviews";
import { getAllCases } from "@/lib/cases";
import { getDirectionLabelMap } from "@/lib/directions-db";
import { CasesCarousel } from "@/components/cases/cases-carousel";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Курс" };
  return {
    title: `${course.title} — Обучение`,
    description: course.description || undefined,
  };
}

export default async function CoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || !course.published) notFound();

  const doctor = course.doctorSlug
    ? await getTeamMemberBySlug(course.doctorSlug)
    : null;
  const photo = doctor?.image || null;

  // Этап 1: если нет структурированного контента, показываем демо-пример.
  const detail = getCourseDetail(slug) ?? DEMO_COURSE_DETAIL;

  // Кейсы: только ведущего врача и по выбранным в настройках курса направлениям.
  const showCases = Boolean(doctor && course.directionSlugs.length);
  let courseCases: Awaited<ReturnType<typeof getAllCases>> = [];
  let dirLabel: Record<string, string> = {};
  if (showCases) {
    const [allCases, labels] = await Promise.all([
      getAllCases(),
      getDirectionLabelMap(),
    ]);
    const dirSet = new Set(course.directionSlugs);
    courseCases = allCases
      .filter(
        (c) =>
          c.doctorSlug === course.doctorSlug &&
          c.directionSlug &&
          dirSet.has(c.directionSlug)
      )
      .slice(0, 9);
    dirLabel = labels;
  }

  return (
    <SiteShell>
      {/* Hero */}
      <Section className="pt-10 pb-12 md:pt-14 md:pb-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-gold)]">
              Dentology Обучение
            </p>

            <h1 className="mt-4 text-3xl font-semibold leading-[1.1] text-[var(--color-navy)] md:text-5xl">
              {course.title}
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--color-gray-700)]">
              {detail.valueProp}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {detail.formats.map((f) => (
                <span
                  key={f.name}
                  className="rounded-full border border-[var(--color-gray-200)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-navy)]"
                >
                  {f.name}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button href="/contacts" variant="gold">Оставить заявку</Button>
              <p className="text-sm text-[var(--color-gray-500)]">
                Консультация от{" "}
                <span className="font-semibold text-[var(--color-navy)]">
                  5 000 ₽
                </span>
              </p>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[360px] lg:ml-auto">
            <div className="overflow-hidden rounded-[24px] bg-[var(--color-gray-100)]">
              <div className="relative aspect-[3/4]">
                {photo ? (
                  <Image
                    src={photo}
                    alt={doctor?.name || course.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 360px"
                    className="object-cover"
                    priority
                  />
                ) : null}
              </div>
            </div>
            {doctor ? (
              <p className="mt-3 text-center text-sm font-medium text-[var(--color-navy)]">
                {doctor.name}
              </p>
            ) : null}
          </div>
        </div>
      </Section>

      {/* Метрика по зубам (под фото, над «Для кого») */}
      {course.metricTreated ? (
        <Section className="pt-0 pb-4 md:pb-6">
          <CourseStats
            treated={course.metricTreated}
            radicalPercent={course.metricRadical}
          />
        </Section>
      ) : null}

      {/* Для кого + Результат */}
      <Section className="py-12 md:py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Для кого этот курс
            </h2>
            <ul className="mt-6 space-y-3">
              {detail.audience.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-base leading-7 text-[var(--color-gray-700)]"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-navy)]">
              Что вы получите
            </h2>
            <ul className="mt-6 space-y-3">
              {detail.outcomes.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-base leading-7 text-[var(--color-gray-700)]"
                >
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-gold)]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* Форматы обучения */}
      <Section className="py-12 md:py-16">
        <h2 className="text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
          Форматы обучения
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {detail.formats.map((f) => (
            <Card key={f.name} className="flex flex-col">
              <h3 className="text-lg font-semibold text-[var(--color-navy)]">
                {f.name}
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-gray-700)]">
                {f.summary}
              </p>

              <ul className="mt-4 space-y-2">
                {f.points.map((p) => (
                  <li
                    key={p}
                    className="flex gap-2 text-sm leading-6 text-[var(--color-gray-700)]"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--color-gold)]" />
                    {p}
                  </li>
                ))}
              </ul>

              <div className="mt-6 border-t border-[var(--color-gray-200)] pt-4">
                <p className="text-xs text-[var(--color-gray-500)]">
                  {f.duration}
                </p>
                <p className="mt-1 text-xl font-semibold text-[var(--color-navy)]">
                  {f.price}
                </p>
              </div>

              <div className="mt-5">
                <Button href="/contacts" variant="gold-outline">
                  {f.ctaLabel}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Section>

      {/* Практика */}
      <Section className="py-12 md:py-16">
        <div className="rounded-[24px] bg-[var(--color-navy)] px-6 py-10 text-white md:px-10 md:py-12">
          <h2 className="text-2xl font-semibold md:text-3xl">
            Практика под микроскопом
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {detail.practiceStages.map((stage, i) => (
              <div
                key={stage}
                className="rounded-2xl border border-white/15 bg-white/5 p-5"
              >
                <p className="text-sm font-semibold text-[var(--color-gold)]">
                  Этап {i + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/85">{stage}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Программа */}
      <Section className="py-12 md:py-16">
        <h2 className="text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
          Программа курса
        </h2>
        <p className="mt-2 text-sm text-[var(--color-gray-500)]">
          Полная программа разбирается на всех форматах. Нажмите на раздел, чтобы
          раскрыть.
        </p>
        <div className="mt-8 divide-y divide-[var(--color-gray-200)] overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
          {detail.program.map((mod, i) => (
            <details key={mod.title} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 hover:bg-[var(--color-gray-50)]">
                <span className="flex items-center gap-3">
                  <span className="w-6 text-sm text-[var(--color-gray-400)]">
                    {i + 1}
                  </span>
                  <span className="font-medium text-[var(--color-navy)]">
                    {mod.title}
                  </span>
                </span>
                <span className="text-[var(--color-gray-400)] transition group-open:rotate-180">
                  ⌄
                </span>
              </summary>
              <ul className="space-y-2 px-5 pb-5 pl-14">
                {mod.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm leading-6 text-[var(--color-gray-700)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </Section>

      {/* Об эксперте */}
      {doctor ? (
        <Section className="py-12 md:py-16">
          <div className="grid gap-8 rounded-[24px] border border-[var(--color-gray-200)] bg-white p-6 md:grid-cols-[0.4fr_1fr] md:p-8">
            <div className="mx-auto w-full max-w-[220px]">
              <div className="overflow-hidden rounded-2xl bg-[var(--color-gray-100)]">
                <div className="relative aspect-[3/4]">
                  {photo ? (
                    <Image
                      src={photo}
                      alt={doctor.name}
                      fill
                      sizes="220px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
              </div>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-gray-500)]">
                Ведущий
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-navy)]">
                {doctor.name}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--color-gray-700)]">
                {detail.instructorBio}
              </p>
            </div>
          </div>
        </Section>
      ) : null}

      {/* FAQ */}
      <Section className="py-12 md:py-16">
        <h2 className="text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
          Частые вопросы
        </h2>
        <div className="mt-8 max-w-3xl divide-y divide-[var(--color-gray-200)] overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
          {detail.faq.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4 font-medium text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]">
                {item.q}
                <span className="text-[var(--color-gray-400)] transition group-open:rotate-180">
                  ⌄
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-7 text-[var(--color-gray-700)]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Section>

      {/* Клинические случаи ведущего по направлениям курса */}
      {showCases && courseCases.length ? (
        <Section className="py-12 md:py-16">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-gold)]">
                Клинические случаи
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
                Клинические случаи ведущего
              </h2>
            </div>
            <Button
              href={`/cases?doctor=${course.doctorSlug}&direction=${course.directionSlugs.join(",")}`}
              variant="gold-outline"
            >
              Смотреть все случаи
            </Button>
          </div>

          <div className="mt-10">
            <CasesCarousel cases={courseCases} dirLabel={dirLabel} />
          </div>
        </Section>
      ) : null}

      {/* Отзывы участников курса */}
      <CourseReviews courseSlug={course.slug} />

      {/* Финальный CTA */}
      <Section className="pb-28 pt-4 md:pb-28">
        <div className="rounded-[32px] bg-[var(--color-gold)]/10 px-6 py-12 text-center md:px-12">
          <h2 className="text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
            Готовы начать?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[var(--color-gray-700)]">
            {detail.ctaNote}
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/contacts" variant="gold">Оставить заявку</Button>
          </div>
        </div>
      </Section>

      {/* Липкая кнопка на мобильном */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--color-gray-200)] bg-white/95 p-3 backdrop-blur md:hidden">
        <Link
          href="/contacts"
          style={{ color: "#ffffff" }}
          className="block w-full rounded-xl bg-[var(--color-gold)] py-3 text-center text-sm font-medium"
        >
          Оставить заявку
        </Link>
      </div>
    </SiteShell>
  );
}
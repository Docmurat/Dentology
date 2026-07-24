import type { Metadata } from "next";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import {
  getApprovedReviews,
  getReviewsByDoctor,
  getReviewsByCourse,
  getCourseReviewsByDoctor,
} from "@/lib/reviews";
import { getDirections, getDirectionLabelMap } from "@/lib/directions-db";
import { getTeamMembers, getTeamMemberBySlug } from "@/lib/team";
import { getCourseBySlug } from "@/lib/courses";
import { ReviewsPageContent } from "@/components/reviews/reviews-page-content";
import { ReviewForm } from "@/components/reviews/review-form";
import { getPageHeading } from "@/lib/page-content";

export const revalidate = 60;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; course?: string; direction?: string }>;
}): Promise<Metadata> {
  const { doctor, course, direction } = await searchParams;
  const filtered = Boolean(doctor || course || direction);
  const heading = await getPageHeading("reviews");

  return {
    title: heading.title || "Отзывы",
    description:
      heading.description ||
      "Отзывы пациентов о лечении в клинике Lucenta — реальный опыт по сложным клиническим случаям.",
    // Отфильтрованные варианты не индексируем, чтобы не плодить дубли.
    alternates: { canonical: "/reviews" },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; course?: string; direction?: string }>;
}) {
  const {
    doctor: doctorSlug,
    course: courseSlug,
    direction: directionSlug,
  } = await searchParams;

  // Режим курса: спикер курса — для группировки всех его курс-отзывов.
  const courseObj = courseSlug ? await getCourseBySlug(courseSlug) : null;
  const courseDoctorSlug = courseObj?.doctorSlug ?? null;

  const [
    courseOwn,
    courseByDoctor,
    patientReviews,
    team,
    doctor,
    allDirections,
    labelMap,
    courseDoctor,
  ] = await Promise.all([
    courseSlug ? getReviewsByCourse(courseSlug) : Promise.resolve([]),
    courseSlug && courseDoctorSlug
      ? getCourseReviewsByDoctor(courseDoctorSlug)
      : Promise.resolve([]),
    courseSlug
      ? Promise.resolve([])
      : doctorSlug
        ? getReviewsByDoctor(doctorSlug)
        : getApprovedReviews(),
    getTeamMembers(),
    doctorSlug ? getTeamMemberBySlug(doctorSlug) : Promise.resolve(null),
    getDirections(),
    getDirectionLabelMap(),
    courseDoctorSlug
      ? getTeamMemberBySlug(courseDoctorSlug)
      : Promise.resolve(null),
  ]);

  // Режим курса: объединяем отзывы этого курса (course_slug — надёжно, все 3)
  // и все курс-отзывы спикера (doctor_slug — для кнопки «Все отзывы»), без дублей.
  const reviews = courseSlug
    ? (() => {
        const seen = new Set<string>();
        return [...courseOwn, ...courseByDoctor].filter((r) => {
          if (seen.has(r.slug)) return false;
          seen.add(r.slug);
          return true;
        });
      })()
    : patientReviews;

  const heading = await getPageHeading("reviews");

  // ── Режим курсов ─────────────────────────────────────────────
  // Кнопки-фильтры: курсы, встречающиеся в отзывах (активные + архивные по слепку).
  const courseMap = new Map<string, string>();
  if (courseSlug) {
    for (const r of reviews) {
      if (r.courseSlug) {
        courseMap.set(r.courseSlug, r.courseTitle || r.courseSlug);
      }
    }
  }
  const courseOptions = Array.from(courseMap, ([slug, label]) => ({
    slug,
    label,
  }));

  // ── Режим направлений (пациентские) ──────────────────────────
  const usedSlugs = new Set<string>();
  for (const r of reviews) {
    for (const slug of r.directionSlugs ?? []) usedSlugs.add(slug);
  }
  const activeDirections = allDirections
    .filter((d) => usedSlugs.has(d.slug))
    .map((d) => ({ slug: d.slug, label: d.title }));
  const activeSlugs = new Set(allDirections.map((d) => d.slug));
  const archivedDirections = Array.from(usedSlugs)
    .filter((slug) => !activeSlugs.has(slug))
    .map((slug) => ({ slug, label: labelMap[slug] ?? slug }));
  const directions = [...activeDirections, ...archivedDirections];

  const doctors = team
    .filter((m) => m.category === "doctor")
    .map((m) => ({ slug: m.slug, name: m.name }));

  // Переход со страницы направления: фильтр предвыбран, но кнопки остаются —
  // можно посмотреть отзывы и по другим направлениям.
  const preselected =
    !courseSlug && !doctorSlug && directionSlug ? directionSlug : undefined;

  // Заголовок: курсы > врач > общий.
  const title = courseSlug
    ? courseDoctor
      ? `Отзывы курсов ${courseDoctor.nameGenitive || courseDoctor.name}`
      : "Отзывы курсов"
    : doctor
      ? `Все отзывы ${doctor.nameGenitive || doctor.name}`
      : heading.title;

  const description = courseSlug
    ? "Отзывы участников курсов этого спикера. Можно отфильтровать по курсу."
    : doctor
      ? "Отзывы пациентов, относящиеся к этому врачу."
      : heading.description;

  return (
    <SiteShell>
      <PageHero eyebrow={heading.eyebrow} title={title} description={description} />

      <Section className="pt-4 pb-20 sm:pt-8 md:pt-10 md:pb-28">
        {/* На телефоне кнопка на всю ширину, от 640px — справа, как было */}
        <div className="mb-6 flex sm:mb-8 sm:justify-end [&>*]:w-full sm:[&>*]:w-auto">
          <ReviewForm
            doctors={doctors}
            courseSlug={courseSlug}
            variant={courseSlug ? "gold" : "teal"}
          />
        </div>

        <ReviewsPageContent
          reviews={reviews}
          directions={courseSlug ? [] : directions}
          courses={courseSlug ? courseOptions : []}
          initialFilter={courseSlug ?? preselected}
          doctorFilter={
            !courseSlug && doctor
              ? { slug: doctor.slug, name: doctor.name }
              : null
          }
          variant={courseSlug ? "gold" : "default"}
        />
      </Section>
    </SiteShell>
  );
}
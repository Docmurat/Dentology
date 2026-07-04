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

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string; course?: string }>;
}) {
  const { doctor: doctorSlug, course: courseSlug } = await searchParams;

  // Режим курсов: определяем ведущего врача по курсу (для группировки всех его курсов).
  const courseObj = courseSlug ? await getCourseBySlug(courseSlug) : null;
  const courseDoctorSlug = courseObj?.doctorSlug ?? null;

  const [reviews, team, doctor, allDirections, labelMap, courseDoctor] =
    await Promise.all([
    courseSlug
      ? courseDoctorSlug
        ? getCourseReviewsByDoctor(courseDoctorSlug)
        : getReviewsByCourse(courseSlug)
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

  // Заголовок: курсы > врач > общий.
  const title = courseSlug
    ? courseDoctor
      ? `Отзывы курсов ${courseDoctor.nameGenitive || courseDoctor.name}`
      : "Отзывы курсов"
    : doctor
      ? `Все отзывы ${doctor.nameGenitive || doctor.name}`
      : heading.title;

  const description = courseSlug
    ? "Отзывы участников курсов этого преподавателя. Можно отфильтровать по курсу."
    : doctor
      ? "Отзывы пациентов, относящиеся к этому врачу."
      : heading.description;

  return (
    <SiteShell>
      <PageHero eyebrow={heading.eyebrow} title={title} description={description} />

      <Section className="pt-8 pb-20 md:pt-10 md:pb-28">
        <div className="mb-8 flex justify-end">
          <ReviewForm doctors={doctors} courseSlug={courseSlug} />
        </div>

        <ReviewsPageContent
          reviews={reviews}
          directions={courseSlug ? [] : directions}
          courses={courseSlug ? courseOptions : []}
          doctorFilter={
            !courseSlug && doctor
              ? { slug: doctor.slug, name: doctor.name }
              : null
          }
        />
      </Section>
    </SiteShell>
  );
}
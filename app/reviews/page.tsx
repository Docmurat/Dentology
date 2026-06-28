import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { getApprovedReviews, getReviewsByDoctor } from "@/lib/reviews";
import { getDirections } from "@/lib/directions-db";
import { getTeamMembers, getTeamMemberBySlug } from "@/lib/team";
import { ReviewsPageContent } from "@/components/reviews/reviews-page-content";
import { ReviewForm } from "@/components/reviews/review-form";

export const revalidate = 60;

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ doctor?: string }>;
}) {
  const { doctor: doctorSlug } = await searchParams;

  const [reviews, team, doctor, allDirections] = await Promise.all([
    doctorSlug ? getReviewsByDoctor(doctorSlug) : getApprovedReviews(),
    getTeamMembers(),
    doctorSlug ? getTeamMemberBySlug(doctorSlug) : Promise.resolve(null),
    getDirections(),
  ]);

  const directions = allDirections.map((d) => ({
    slug: d.slug,
    label: d.title,
  }));

  const doctors = team
    .filter((m) => m.category === "doctor")
    .map((m) => ({ slug: m.slug, name: m.name }));

  return (
    <SiteShell>
      <PageHero
        eyebrow="Отзывы"
        title={
          doctor
            ? `Все отзывы ${doctor.nameGenitive || doctor.name}`
            : "Отзывы пациентов"
        }
        description={
          doctor
            ? "Отзывы пациентов, относящиеся к этому врачу."
            : "Реальные впечатления пациентов после консультации и лечения. Можно отфильтровать отзывы по направлениям."
        }
      />

      <Section className="pt-8 pb-20 md:pt-10 md:pb-28">
        <div className="mb-8 flex justify-end">
          <ReviewForm doctors={doctors} />
        </div>

        <ReviewsPageContent
          reviews={reviews}
          directions={directions}
          doctorFilter={
            doctor ? { slug: doctor.slug, name: doctor.name } : null
          }
        />
      </Section>
    </SiteShell>
  );
}
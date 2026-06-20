import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { reviewsData } from "@/lib/reviews-data";
import { getApprovedReviews } from "@/lib/reviews";
import { getTeamMembers } from "@/lib/team";
import { ReviewsPageContent } from "@/components/reviews/reviews-page-content";
import { ReviewForm } from "@/components/reviews/review-form";

export const revalidate = 60;

export default async function ReviewsPage() {
  const [approved, team] = await Promise.all([
    getApprovedReviews(),
    getTeamMembers(),
  ]);
  const reviews = [...approved, ...reviewsData];
  const doctors = team
    .filter((m) => m.category === "doctor")
    .map((m) => ({ slug: m.slug, name: m.name }));

  return (
    <SiteShell>
      <PageHero
        eyebrow="Отзывы"
        title="Отзывы пациентов"
        description="Реальные впечатления пациентов после консультации и лечения. Можно отфильтровать отзывы по направлениям."
      />

      <Section className="pt-8 pb-20 md:pt-10 md:pb-28">
        <div className="mb-8 flex justify-end">
          <ReviewForm doctors={doctors} />
        </div>

        <ReviewsPageContent reviews={reviews} />
      </Section>
    </SiteShell>
  );
}
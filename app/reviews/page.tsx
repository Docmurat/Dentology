import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { reviewsData } from "@/lib/reviews-data";
import { ReviewsPageContent } from "@/components/reviews/reviews-page-content";

export default function ReviewsPage() {
  return (
    <SiteShell>
      <PageHero
        eyebrow="Отзывы"
        title="Отзывы пациентов"
        description="Реальные впечатления пациентов после консультации и лечения. Можно отфильтровать отзывы по направлениям."
      />

      <Section className="pt-8 pb-20 md:pt-10 md:pb-28">
        <ReviewsPageContent reviews={reviewsData} />
      </Section>
    </SiteShell>
  );
}
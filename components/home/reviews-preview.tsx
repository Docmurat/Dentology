import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { reviewsData } from "@/lib/reviews-data";
import { ReviewCard } from "@/components/reviews/review-card";

export function ReviewsPreview() {
  const featuredReviews = reviewsData.filter((item) => item.featured).slice(0, 3);

  if (!featuredReviews.length) return null;

  return (
    <Section id="reviews" className="py-20 md:py-28">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Отзывы"
          title="Что говорят пациенты после лечения"
          description="Отзывы дополняют клинические случаи и помогают понять, как пациенты воспринимают процесс лечения, диагностику и коммуникацию."
        />

        <Button href="/reviews" variant="secondary">
          Смотреть все отзывы
        </Button>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {featuredReviews.map((item) => (
          <ReviewCard key={item.slug} review={item} compact />
        ))}
      </div>
    </Section>
  );
}
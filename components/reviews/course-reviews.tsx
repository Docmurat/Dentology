import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { getReviewsByCourse } from "@/lib/reviews";
import { ReviewsCarousel } from "@/components/reviews/reviews-carousel";
import { ReviewForm } from "@/components/reviews/review-form";

/** Блок отзывов о курсе — как на главной, но только для этого курса. */
export async function CourseReviews({ courseSlug }: { courseSlug: string }) {
  const reviews = (await getReviewsByCourse(courseSlug)).slice(0, 9);

  return (
    <Section className="py-12 md:py-16">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-gold)]">
            Отзывы
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--color-navy)] md:text-3xl">
            Отзывы участников курса
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ReviewForm courseSlug={courseSlug} variant="gold" />
          <Button
            href={`/reviews?course=${courseSlug}`}
            variant="gold-outline"
          >
            Читать все отзывы
          </Button>
        </div>
      </div>

      {reviews.length ? (
        <div className="mt-10">
          <ReviewsCarousel reviews={reviews} />
        </div>
      ) : (
        <p className="mt-8 text-sm text-[var(--color-gray-500)]">
          Пока нет отзывов об этом курсе. Станьте первым!
        </p>
      )}
    </Section>
  );
}
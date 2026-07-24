import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { getApprovedReviews } from "@/lib/reviews";
import { getTeamMembers } from "@/lib/team";
import { getSectionHeadingContent } from "@/lib/homepage";
import { ReviewsCarousel } from "@/components/reviews/reviews-carousel";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";

export async function ReviewsPreview() {
  const [approved, team] = await Promise.all([
    getApprovedReviews(),
    getTeamMembers(),
  ]);
  const heading = await getSectionHeadingContent("reviews");

  const latest = approved.slice(0, 9);
  // Карусель неудобна на сенсорных экранах: до lg показываем список —
  // три отзыва на телефоне и четыре в две колонки на планшете.
  const mobileLatest = approved.slice(0, 3);
  const tabletLatest = approved.slice(0, 4);
  const doctors = team
    .filter((m) => m.category === "doctor")
    .map((m) => ({ slug: m.slug, name: m.name }));

  return (
    <Section id="reviews" className="pt-20 pb-12 md:pt-28 md:pb-16">
      <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          description={heading.description}
        />

        {/* На мобильном кнопки одинаковой ширины друг под другом */}
        <div className="flex w-full shrink-0 flex-col gap-3 [&>*]:w-full sm:w-auto sm:flex-row sm:items-center sm:[&>*]:w-auto">
          <ReviewForm doctors={doctors} />
          <Button href="/reviews" variant="secondary">
            Смотреть все отзывы
          </Button>
        </div>
      </div>

      {latest.length ? (
        <>
          {/* Телефон: три отзыва в один столбец */}
          <div className="mt-8 grid gap-4 sm:hidden">
            {mobileLatest.map((review) => (
              <ReviewCard
                key={review.slug}
                review={review}
                date={review.date}
              />
            ))}
          </div>

          {/* Планшет: четыре отзыва в две колонки */}
          <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 sm:gap-6 lg:hidden">
            {tabletLatest.map((review) => (
              <ReviewCard
                key={review.slug}
                review={review}
                date={review.date}
              />
            ))}
          </div>

          {/* Десктоп: карусель, как было */}
          <div className="mt-12 hidden lg:block">
            <ReviewsCarousel reviews={latest} />
          </div>
        </>
      ) : (
        <p className="mt-8 text-sm text-[var(--color-gray-500)] sm:mt-10">
          Пока нет опубликованных отзывов.
        </p>
      )}
    </Section>
  );
}
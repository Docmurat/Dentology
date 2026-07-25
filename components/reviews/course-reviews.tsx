// components/reviews/course-reviews.tsx
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { getReviewsByCourse } from "@/lib/reviews";
import { ReviewsCarousel } from "@/components/reviews/reviews-carousel";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";

/** Блок отзывов о курсе — как на главной, но только для этого курса. */
export async function CourseReviews({ courseSlug }: { courseSlug: string }) {
  const reviews = (await getReviewsByCourse(courseSlug)).slice(0, 9);
  // Карусель неудобна на сенсорных экранах: до 1024px показываем список —
  // три отзыва на телефоне и четыре в две колонки на планшете.
  const mobileReviews = reviews.slice(0, 3);
  const tabletReviews = reviews.slice(0, 4);

  return (
    <Section className="py-12 md:py-16">
      {/* Заголовок и кнопки в один ряд только с 1024px: на планшете мини
          заголовок 30px и две кнопки в строку не помещаются. */}
      <div className="flex flex-col gap-6 sm:gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--color-gold)]">
            Отзывы
          </p>
          <h2 className="mt-3 text-xl font-semibold leading-snug text-[var(--color-navy)] sm:text-2xl sm:leading-tight md:text-3xl">
            Отзывы участников курса
          </h2>
        </div>

        {/* На мобильном кнопки одинаковой ширины друг под другом */}
        <div className="flex w-full shrink-0 flex-col gap-3 [&>*]:w-full sm:w-auto sm:flex-row sm:items-center sm:[&>*]:w-auto">
          <ReviewForm courseSlug={courseSlug} variant="gold" />
          <Button href={`/reviews?course=${courseSlug}`} variant="gold-outline">
            Читать все отзывы
          </Button>
        </div>
      </div>

      {reviews.length ? (
        <>
          {/* Телефон: три отзыва в один столбец */}
          <div className="mt-8 grid gap-4 sm:hidden">
            {mobileReviews.map((review) => (
              <ReviewCard
                key={review.slug}
                review={review}
                date={review.date}
              />
            ))}
          </div>

          {/* Планшет: четыре отзыва в две колонки */}
          <div className="mt-8 hidden gap-4 sm:grid sm:grid-cols-2 sm:gap-6 lg:hidden">
            {tabletReviews.map((review) => (
              <ReviewCard
                key={review.slug}
                review={review}
                date={review.date}
              />
            ))}
          </div>

          {/* Десктоп: карусель, как было */}
          <div className="mt-12 hidden lg:block">
            <ReviewsCarousel reviews={reviews} />
          </div>
        </>
      ) : (
        <p className="mt-8 text-sm text-[var(--color-gray-500)] sm:mt-10">
          Пока нет отзывов об этом курсе. Станьте первым!
        </p>
      )}
    </Section>
  );
}
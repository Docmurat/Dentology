import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { getApprovedReviews } from "@/lib/reviews";
import { getTeamMembers } from "@/lib/team";
import { ReviewsCarousel } from "@/components/reviews/reviews-carousel";
import { ReviewForm } from "@/components/reviews/review-form";

export async function ReviewsPreview() {
  const [approved, team] = await Promise.all([
    getApprovedReviews(),
    getTeamMembers(),
  ]);

  const latest = approved.slice(0, 9);
  const doctors = team
    .filter((m) => m.category === "doctor")
    .map((m) => ({ slug: m.slug, name: m.name }));

  return (
    <Section id="reviews" className="py-20 md:py-28">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <SectionHeading
          eyebrow="Отзывы"
          title="Что говорят пациенты после лечения"
          description="Отзывы дополняют клинические случаи и помогают понять, как пациенты воспринимают процесс лечения, диагностику и коммуникацию."
        />

        <div className="flex flex-wrap items-center gap-3">
          <ReviewForm doctors={doctors} />
          <Button href="/reviews" variant="secondary">
            Смотреть все отзывы
          </Button>
        </div>
      </div>

      {latest.length ? (
        <div className="mt-12">
          <ReviewsCarousel reviews={latest} />
        </div>
      ) : (
        <p className="mt-10 text-sm text-[var(--color-gray-500)]">
          Пока нет опубликованных отзывов.
        </p>
      )}
    </Section>
  );
}
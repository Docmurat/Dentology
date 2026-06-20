import { Section } from "@/components/layout/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { Button } from "@/components/ui/button";
import { reviewsData } from "@/lib/reviews-data";
import { getApprovedReviews } from "@/lib/reviews";
import { getTeamMembers } from "@/lib/team";
import { ReviewCard } from "@/components/reviews/review-card";
import { ReviewForm } from "@/components/reviews/review-form";

export async function ReviewsPreview() {
  const [latest, team] = await Promise.all([
    getApprovedReviews(),
    getTeamMembers(),
  ]);

  // Последние отзывы из БД (с датами); если их ещё нет — статические.
  const dbCards = latest
    .slice(0, 3)
    .map((r) => ({ review: r, date: r.date as string | undefined }));
  const fallback = reviewsData
    .filter((item) => item.featured)
    .slice(0, 3)
    .map((r) => ({ review: r, date: undefined as string | undefined }));
  const cards = dbCards.length ? dbCards : fallback;

  if (!cards.length) return null;

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

        <Button href="/reviews" variant="secondary">
          Смотреть все отзывы
        </Button>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {cards.map((c) => (
          <ReviewCard
            key={c.review.slug}
            review={c.review}
            date={c.date}
            compact
          />
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <ReviewForm doctors={doctors} />
      </div>
    </Section>
  );
}
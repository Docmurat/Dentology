import type { ComponentProps } from "react";
import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { ReviewEditForm } from "@/components/admin/review-edit-form";

export const dynamic = "force-dynamic";

// Тип строки берём прямо из пропсов формы — так они не разъедутся.
type ReviewRow = ComponentProps<typeof ReviewEditForm>["review"];

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const review = await queryOne<ReviewRow>(
    `select id, author, text, doctor_slug, direction_slugs, instagram,
            review_date, sort_order, image, course_slug, course_title,
            pros, cons, wishes
       from reviews where id = $1`,
    [id]
  );

  if (!review) notFound();

  const team = await getTeamMembers();
  const doctors = team
    .filter((m) => m.category === "doctor")
    .map((m) => ({ slug: m.slug, name: m.name }));
  const directions = (await getDirections()).map((d) => ({
    slug: d.slug,
    label: d.title,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Изменить отзыв
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--color-gray-600)]">
        Доступно и для опубликованных отзывов. Для отзывов о курсе —
        плюсы/минусы/пожелания (без направлений).
      </p>

      <ReviewEditForm
        review={review}
        doctors={doctors}
        directions={directions}
      />
    </div>
  );
}
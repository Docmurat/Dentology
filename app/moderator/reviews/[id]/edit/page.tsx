// app/moderator/reviews/[id]/edit/page.tsx
import type { ComponentProps } from "react";
import { notFound, redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { getCurrentUser, isStaff, canModerate } from "@/lib/auth-guards";
import { ReviewEditForm } from "@/components/admin/review-edit-form";

export const dynamic = "force-dynamic";

// Тип строки берём прямо из пропсов формы — так они не разъедутся.
type ReviewRow = ComponentProps<typeof ReviewEditForm>["review"];

export default async function ModeratorEditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!canModerate(user)) redirect("/");

  const review = await queryOne<ReviewRow & { status: string }>(
    `select id, author, text, doctor_slug, direction_slugs, instagram,
            review_date, sort_order, image, course_slug, course_title,
            pros, cons, wishes, status
       from reviews where id = $1`,
    [id]
  );

  if (!review) notFound();

  // Опубликованный отзыв правит сотрудник: то, что уже висит на сайте,
  // не должно меняться в обход того, кто отвечает за содержание.
  if (review.status === "approved" && !isStaff(user)) {
    redirect("/moderator/reviews");
  }

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
        Поправьте текст, добавьте фото — и вернитесь к очереди, чтобы
        опубликовать или отклонить.
      </p>

      <ReviewEditForm
        review={review}
        doctors={doctors}
        directions={directions}
        backTo="/moderator/reviews"
      />
    </div>
  );
}
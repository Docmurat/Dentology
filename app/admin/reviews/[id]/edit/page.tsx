import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { ReviewEditForm } from "@/components/admin/review-edit-form";

export const dynamic = "force-dynamic";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: review } = await supabase
    .from("reviews")
    .select(
      "id, author, text, doctor_slug, direction_slugs, instagram, review_date, sort_order, image"
    )
    .eq("id", id)
    .maybeSingle();

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
        Доступно и для опубликованных отзывов. Здесь же — врач, направления
        (до 3), ссылка Instagram, фото и порядковый номер.
      </p>

      <ReviewEditForm
        review={review}
        doctors={doctors}
        directions={directions}
      />
    </div>
  );
}
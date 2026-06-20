import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
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
    .select("id, author, text, direction_slug, review_date")
    .eq("id", id)
    .maybeSingle();

  if (!review) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Изменить отзыв
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--color-gray-600)]">
        Доступно и для опубликованных отзывов. Фото меняется в списке отзывов.
      </p>

      <ReviewEditForm review={review} />
    </div>
  );
}
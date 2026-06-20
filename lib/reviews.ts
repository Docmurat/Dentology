import { createPublicClient } from "@/lib/supabase-public";
import type { ReviewItem } from "@/lib/reviews-data";

export type ApprovedReview = ReviewItem & { date: string };

function instagramHandle(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/instagram\.com\/([^/?#]+)/i);
  return m ? m[1] : null;
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU");
}

// Одобренные отзывы из БД -> ReviewItem (+ дата). Телефон НЕ читается.
// Картинка: загруженное админом фото в приоритете; иначе аватарка
// из инстаграма через unavatar.io (с фолбэком).
export async function getApprovedReviews(): Promise<ApprovedReview[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(
      "id, author, text, image, instagram, direction_slug, review_date, created_at"
    )
    .eq("status", "approved")
    .order("review_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((r) => {
    const instagram = (r.instagram as string) ?? null;
    const stored = (r.image as string) ?? null;
    const handle = instagramHandle(instagram);
    const image =
      stored ?? (handle ? `https://unavatar.io/instagram/${handle}` : null);
    return {
      slug: r.id as string,
      author: r.author as string,
      text: r.text as string,
      image,
      instagramUrl: instagram,
      directionSlugs: r.direction_slug ? [r.direction_slug as string] : [],
      featured: false,
      date: formatDate(
        (r.review_date as string) ?? (r.created_at as string) ?? null
      ),
    };
  });
}
import { createPublicClient } from "@/lib/supabase-public";
import type { ReviewItem } from "@/lib/reviews-data";

export type ApprovedReview = ReviewItem & { date: string };

const SELECT =
  "id, author, text, image, instagram, direction_slug, direction_slugs, course_slug, course_title, pros, cons, wishes, sort_order, review_date, created_at";

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

function mapRow(r: Record<string, unknown>): ApprovedReview {
  const instagram = (r.instagram as string) ?? null;
  const stored = (r.image as string) ?? null;
  const handle = instagramHandle(instagram);
  const image =
    stored ?? (handle ? `https://unavatar.io/instagram/${handle}` : null);

  const arr = (r.direction_slugs as string[] | null) ?? [];
  const directionSlugs =
    arr.length > 0
      ? arr
      : r.direction_slug
        ? [r.direction_slug as string]
        : [];

  return {
    slug: r.id as string,
    author: r.author as string,
    text: r.text as string,
    image,
    instagramUrl: instagram,
    directionSlugs,
    courseSlug: (r.course_slug as string) ?? null,
    courseTitle: (r.course_title as string) ?? null,
    pros: (r.pros as string) ?? "",
    cons: (r.cons as string) ?? "",
    wishes: (r.wishes as string) ?? "",
    featured: false,
    date: formatDate(
      (r.review_date as string) ?? (r.created_at as string) ?? null
    ),
  };
}

// Одобренные отзывы пациентов — для общей страницы и главной (без курс-отзывов).
export async function getApprovedReviews(): Promise<ApprovedReview[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(SELECT)
    .eq("status", "approved")
    .is("course_slug", null)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("review_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

// Пациентские отзывы врача (курс-отзывы исключены).
export async function getReviewsByDoctor(
  doctorSlug: string
): Promise<ApprovedReview[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(SELECT)
    .eq("status", "approved")
    .eq("doctor_slug", doctorSlug)
    .is("course_slug", null)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("review_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

// Одобренные отзывы о конкретном курсе.
export async function getReviewsByCourse(
  courseSlug: string
): Promise<ApprovedReview[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(SELECT)
    .eq("status", "approved")
    .eq("course_slug", courseSlug)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("review_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}

// Все курс-отзывы врача (по всем его курсам, включая удалённые — по слепку).
export async function getCourseReviewsByDoctor(
  doctorSlug: string
): Promise<ApprovedReview[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(SELECT)
    .eq("status", "approved")
    .eq("doctor_slug", doctorSlug)
    .not("course_slug", "is", null)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("review_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as Record<string, unknown>));
}
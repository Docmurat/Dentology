import { query } from "@/lib/db";
import type { ReviewItem } from "@/lib/reviews-data";

export type ApprovedReview = ReviewItem & { date: string };

const SELECT =
  "id, author, text, image, instagram, direction_slug, direction_slugs, course_slug, course_title, pros, cons, wishes, sort_order, review_date, created_at";

// Порядок: ручной sort_order (пустые в конце), затем дата отзыва, затем создание.
const ORDER =
  "order by sort_order asc nulls last, review_date desc nulls last, created_at desc";

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU");
}

function mapRow(r: Record<string, unknown>): ApprovedReview {
  const instagram = (r.instagram as string) ?? null;
  const image = (r.image as string) ?? null;

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

// Одобренные отзывы пациентов (без курс-отзывов).
export async function getApprovedReviews(): Promise<ApprovedReview[]> {
  const rows = await query<Record<string, unknown>>(
    `select ${SELECT} from reviews where status = 'approved' and course_slug is null ${ORDER}`
  );
  return rows.map(mapRow);
}

// Пациентские отзывы врача (курс-отзывы исключены).
export async function getReviewsByDoctor(
  doctorSlug: string
): Promise<ApprovedReview[]> {
  const rows = await query<Record<string, unknown>>(
    `select ${SELECT} from reviews where status = 'approved' and doctor_slug = $1 and course_slug is null ${ORDER}`,
    [doctorSlug]
  );
  return rows.map(mapRow);
}

// Одобренные отзывы о конкретном курсе.
export async function getReviewsByCourse(
  courseSlug: string
): Promise<ApprovedReview[]> {
  const rows = await query<Record<string, unknown>>(
    `select ${SELECT} from reviews where status = 'approved' and course_slug = $1 ${ORDER}`,
    [courseSlug]
  );
  return rows.map(mapRow);
}

// Все курс-отзывы врача (по всем его курсам).
export async function getCourseReviewsByDoctor(
  doctorSlug: string
): Promise<ApprovedReview[]> {
  const rows = await query<Record<string, unknown>>(
    `select ${SELECT} from reviews where status = 'approved' and doctor_slug = $1 and course_slug is not null ${ORDER}`,
    [doctorSlug]
  );
  return rows.map(mapRow);
}
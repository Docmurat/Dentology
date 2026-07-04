import { createPublicClient } from "@/lib/supabase-public";

export type Course = {
  slug: string;
  title: string;
  description: string;
  doctorSlug: string | null;
  formats: string;
  metricTreated: string;
  metricRadical: number;
  directionSlugs: string[];
  published: boolean;
  sortOrder: number;
};

// Базовый набор колонок гарантированно существует.
// Полный добавляет метрику; если миграция ещё не выполнена — откатываемся на базовый.
const BASE_COLUMNS =
  "slug, title, description, doctor_slug, formats, published, sort_order";
const FULL_COLUMNS = `${BASE_COLUMNS}, metric_treated, metric_radical, direction_slugs`;

type Row = {
  slug: string;
  title: string;
  description: string | null;
  doctor_slug: string | null;
  formats: string | null;
  metric_treated?: string | null;
  metric_radical?: number | null;
  direction_slugs?: string[] | null;
  published: boolean;
  sort_order: number | null;
};

function mapRow(row: Row): Course {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    doctorSlug: row.doctor_slug,
    formats: row.formats ?? "",
    metricTreated: row.metric_treated ?? "",
    metricRadical: row.metric_radical ?? 0,
    directionSlugs: row.direction_slugs ?? [],
    published: row.published,
    sortOrder: row.sort_order ?? 0,
  };
}

/** Опубликованные курсы. Отказоустойчиво к отсутствию колонок метрики. */
export async function getPublishedCourses(): Promise<Course[]> {
  try {
    const supabase = createPublicClient();

    for (const cols of [FULL_COLUMNS, BASE_COLUMNS]) {
      const { data, error } = await supabase
        .from("courses")
        .select(cols)
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!error && data) return (data as unknown as Row[]).map(mapRow);
      // ошибка (например, нет колонок метрики) — пробуем базовый набор
    }
    return [];
  } catch {
    return [];
  }
}

/** Один курс по slug. Отказоустойчиво к отсутствию колонок метрики. */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const supabase = createPublicClient();

    for (const cols of [FULL_COLUMNS, BASE_COLUMNS]) {
      const { data, error } = await supabase
        .from("courses")
        .select(cols)
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) return mapRow(data as unknown as Row);
      if (!error && !data) return null; // курса нет — не пробуем дальше
    }
    return null;
  } catch {
    return null;
  }
}
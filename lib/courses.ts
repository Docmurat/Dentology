import { createPublicClient } from "@/lib/supabase-public";

export type CourseMetric = { value: string; label: string };

export type Course = {
  slug: string;
  title: string;
  description: string;
  doctorSlug: string | null;
  formats: string;
  metrics: CourseMetric[];
  effectivenessPercent: number;
  effectivenessText: string;
  directionSlugs: string[];
  published: boolean;
  sortOrder: number;
};

// Базовый набор колонок существует всегда; полный добавляет опциональные.
// Если миграция не выполнена — откатываемся на базовый, курс не падает.
const BASE_COLUMNS =
  "slug, title, description, doctor_slug, formats, published, sort_order";
const FULL_COLUMNS = `${BASE_COLUMNS}, metrics, effectiveness_percent, effectiveness_text, direction_slugs`;

type Row = {
  slug: string;
  title: string;
  description: string | null;
  doctor_slug: string | null;
  formats: string | null;
  metrics?: unknown;
  effectiveness_percent?: number | null;
  effectiveness_text?: string | null;
  direction_slugs?: string[] | null;
  published: boolean;
  sort_order: number | null;
};

function parseMetrics(raw: unknown): CourseMetric[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => ({
      value: String((m as { value?: unknown })?.value ?? "").trim(),
      label: String((m as { label?: unknown })?.label ?? "").trim(),
    }))
    .filter((m) => m.value || m.label);
}

function mapRow(row: Row): Course {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    doctorSlug: row.doctor_slug,
    formats: row.formats ?? "",
    metrics: parseMetrics(row.metrics),
    effectivenessPercent: row.effectiveness_percent ?? 0,
    effectivenessText: row.effectiveness_text ?? "",
    directionSlugs: row.direction_slugs ?? [],
    published: row.published,
    sortOrder: row.sort_order ?? 0,
  };
}

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
    }
    return [];
  } catch {
    return [];
  }
}

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
      if (!error && !data) return null;
    }
    return null;
  } catch {
    return null;
  }
}
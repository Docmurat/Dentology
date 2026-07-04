import { createPublicClient } from "@/lib/supabase-public";

export type Course = {
  slug: string;
  title: string;
  description: string;
  doctorSlug: string | null;
  formats: string;
  metricTreated: string;
  metricRadical: number;
  published: boolean;
  sortOrder: number;
};

const COLUMNS =
  "slug, title, description, doctor_slug, formats, metric_treated, metric_radical, published, sort_order";

type Row = {
  slug: string;
  title: string;
  description: string | null;
  doctor_slug: string | null;
  formats: string | null;
  metric_treated: string | null;
  metric_radical: number | null;
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
    published: row.published,
    sortOrder: row.sort_order ?? 0,
  };
}

/** Опубликованные курсы для публичных страниц. */
export async function getPublishedCourses(): Promise<Course[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select(COLUMNS)
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return (data as Row[]).map(mapRow);
  } catch {
    return [];
  }
}

/** Один курс по slug (для детальной страницы). */
export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select(COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return mapRow(data as Row);
  } catch {
    return null;
  }
}
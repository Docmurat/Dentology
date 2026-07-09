import { createPublicClient } from "@/lib/supabase-public";
import { createAdminClient } from "@/lib/supabase-admin";
import { createClient } from "@/utils/supabase/server";

export type CourseMetric = { value: string; label: string };
export type CourseFaq = { q: string; a: string };
export type CourseModule = { title: string; items: string[] };
export type CourseFormat = {
  type: string;
  summary: string;
  points: string[];
  duration: string;
  price: string;
  priceNote: string;
  ctaLabel: string;
  recommended: boolean;
  enabled: boolean;
};

export type Course = {
  slug: string;
  title: string;
  description: string;
  doctorSlug: string | null;
  formats: CourseFormat[];
  metrics: CourseMetric[];
  quote: string;
  quoteImage: string | null;
  effectivenessPercent: number;
  effectivenessText: string;
  directionSlugs: string[];
  learningTypes: string[];
  audienceTitle: string;
  audienceText: string;
  outcomesTitle: string;
  outcomesText: string;
  instructorBio: string;
  ctaNote: string;
  faq: CourseFaq[];
  program: CourseModule[];
  published: boolean;
  archived: boolean;
  createdBy: string | null;
  showMetrics: boolean;
  showAudience: boolean;
  showOutcomes: boolean;
  showQuote: boolean;
  showProgram: boolean;
  showFaq: boolean;
  showEffectiveness: boolean;
  showBio: boolean;
  showCta: boolean;
  sortOrder: number;
};

// Читаем через select("*"): берём все существующие колонки, а отсутствующие
// (если миграция ещё не выполнена) просто подставляются дефолтами в mapRow.
// Это исключает «обнуление» всех полей из-за одной недостающей колонки.
type Row = {
  slug: string;
  title: string;
  description: string | null;
  doctor_slug: string | null;
  formats: string | null;
  learning_formats?: unknown;
  metrics?: unknown;
  quote?: string | null;
  quote_image?: string | null;
  effectiveness_percent?: number | null;
  effectiveness_text?: string | null;
  direction_slugs?: string[] | null;
  learning_types?: string[] | null;
  audience_title?: string | null;
  audience_text?: string | null;
  outcomes_title?: string | null;
  outcomes_text?: string | null;
  instructor_bio?: string | null;
  cta_note?: string | null;
  faq?: unknown;
  program?: unknown;
  published: boolean;
  archived?: boolean | null;
  created_by?: string | null;
  show_metrics?: boolean | null;
  show_audience?: boolean | null;
  show_outcomes?: boolean | null;
  show_quote?: boolean | null;
  show_program?: boolean | null;
  show_faq?: boolean | null;
  show_effectiveness?: boolean | null;
  show_bio?: boolean | null;
  show_cta?: boolean | null;
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

function parseFaq(raw: unknown): CourseFaq[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f) => ({
      q: String((f as { q?: unknown })?.q ?? "").trim(),
      a: String((f as { a?: unknown })?.a ?? "").trim(),
    }))
    .filter((f) => f.q || f.a);
}

function parseFormats(raw: unknown): CourseFormat[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((f) => {
      const o = (f ?? {}) as Record<string, unknown>;
      const pts = Array.isArray(o.points) ? (o.points as unknown[]) : [];
      return {
        type: String(o.type ?? "").trim(),
        summary: String(o.summary ?? "").trim(),
        points: pts.map((x) => String(x ?? "").trim()).filter(Boolean),
        duration: String(o.duration ?? "").trim(),
        price: String(o.price ?? "").trim(),
        priceNote: String(o.priceNote ?? "").trim(),
        ctaLabel: String(o.ctaLabel ?? "").trim(),
        recommended: Boolean(o.recommended),
        enabled: o.enabled === undefined ? true : Boolean(o.enabled),
      };
    })
    .filter((f) => f.type);
}

function parseProgram(raw: unknown): CourseModule[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => ({
      title: String((m as { title?: unknown })?.title ?? "").trim(),
      items: Array.isArray((m as { items?: unknown })?.items)
        ? ((m as { items: unknown[] }).items || [])
            .map((x) => String(x ?? "").trim())
            .filter(Boolean)
        : [],
    }))
    .filter((m) => m.title || m.items.length);
}

function mapRow(row: Row): Course {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description ?? "",
    doctorSlug: row.doctor_slug,
    formats: parseFormats(row.learning_formats),
    metrics: parseMetrics(row.metrics),
    quote: row.quote ?? "",
    quoteImage: row.quote_image ?? null,
    effectivenessPercent: row.effectiveness_percent ?? 0,
    effectivenessText: row.effectiveness_text ?? "",
    directionSlugs: row.direction_slugs ?? [],
    learningTypes: row.learning_types ?? [],
    audienceTitle: row.audience_title ?? "",
    audienceText: row.audience_text ?? "",
    outcomesTitle: row.outcomes_title ?? "",
    outcomesText: row.outcomes_text ?? "",
    instructorBio: row.instructor_bio ?? "",
    ctaNote: row.cta_note ?? "",
    faq: parseFaq(row.faq),
    program: parseProgram(row.program),
    published: row.published,
    archived: Boolean(row.archived),
    createdBy: row.created_by ?? null,
    showMetrics: row.show_metrics ?? true,
    showAudience: row.show_audience ?? true,
    showOutcomes: row.show_outcomes ?? true,
    showQuote: row.show_quote ?? true,
    showProgram: row.show_program ?? true,
    showFaq: row.show_faq ?? true,
    showEffectiveness: row.show_effectiveness ?? true,
    showBio: row.show_bio ?? true,
    showCta: row.show_cta ?? true,
    sortOrder: row.sort_order ?? 0,
  };
}

export async function getPublishedCourses(): Promise<Course[]> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as Row[]).map(mapRow).filter((c) => !c.archived);
  } catch {
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Row);
  } catch {
    return null;
  }
}

// Чтение курса для staff-превью (в т.ч. черновик). Сервис-роль минует RLS —
// вызывать только после проверки прав.
export async function getCourseBySlugAdmin(
  slug: string
): Promise<Course | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as Row);
  } catch {
    return null;
  }
}

// Курсы конкретного владельца (для кабинета спикера). Читает авторизованно —
// RLS отдаёт свои курсы (в т.ч. черновики).
export async function getCoursesByOwner(userId: string): Promise<Course[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return (data as Row[]).map(mapRow);
  } catch {
    return [];
  }
}
import { createPublicClient } from "@/lib/supabase-public";

export type DirectionFaq = {
  question: string;
  answer: string;
};

export type DirectionItem = {
  slug: string;
  title: string;
  short: string;
  description: string;
  heroDescription: string;

  featured: boolean;
  /** Позиция в коллаже на главной: главное / большое / маленькое. */
  collageRole: "featured" | "large" | "small";
  sortOrder: number;

  problems: string[];
  fears: string[];
  approach: string[];

  insightTitle?: string;
  insightText: string[];

  faq: DirectionFaq[];
};

type DirectionRow = {
  slug: string;
  title: string;
  short: string;
  description: string;
  hero_description: string;
  featured: boolean;
  collage_role: "featured" | "large" | "small";
  sort_order: number;
  problems: string[] | null;
  fears: string[] | null;
  approach: string[] | null;
  insight_title: string | null;
  insight_text: string[] | null;
  faq: DirectionFaq[] | null;
};

const COLUMNS =
  "slug,title,short,description,hero_description,featured,collage_role,sort_order,problems,fears,approach,insight_title,insight_text,faq";

function mapRow(row: DirectionRow): DirectionItem {
  return {
    slug: row.slug,
    title: row.title,
    short: row.short ?? "",
    description: row.description ?? "",
    heroDescription: row.hero_description ?? "",
    featured: row.featured,
    collageRole: row.collage_role,
    sortOrder: row.sort_order,
    problems: row.problems ?? [],
    fears: row.fears ?? [],
    approach: row.approach ?? [],
    insightTitle: row.insight_title ?? undefined,
    insightText: row.insight_text ?? [],
    faq: row.faq ?? [],
  };
}

function sortDirections(items: DirectionItem[]): DirectionItem[] {
  // featured всегда первым, дальше — по ручному порядку, затем по названию.
  return [...items].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title, "ru");
  });
}

/** Все направления в правильном порядке — для главной, /directions и пикеров. */
export async function getDirections(): Promise<DirectionItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("directions").select(COLUMNS);
  if (error) throw error;
  return sortDirections((data as DirectionRow[]).map(mapRow));
}

/** Одно направление по slug — для /directions/[slug]. */
export async function getDirectionBySlug(
  slug: string
): Promise<DirectionItem | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("directions")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapRow(data as DirectionRow) : null;
}

/** Только slug'и — для generateStaticParams и валидации. */
export async function getDirectionSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("directions").select("slug");
  if (error) throw error;
  return (data as { slug: string }[]).map((r) => r.slug);
}

/**
 * Карта slug → название. Нужна для подписей на кейсах/отзывах и в фильтрах.
 * Если направление удалили, его slug всё ещё может встречаться в старых
 * кейсах/отзывах — для них вернётся аккуратный фолбэк (см. directionLabel).
 */
export async function getDirectionLabelMap(): Promise<Record<string, string>> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("directions")
    .select("slug,title");
  if (error) throw error;
  return Object.fromEntries(
    (data as { slug: string; title: string }[]).map((r) => [r.slug, r.title])
  );
}
import { query, queryOne } from "@/lib/db";

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
  "slug, title, short, description, hero_description, featured, collage_role, sort_order, problems, fears, approach, insight_title, insight_text, faq";

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
  return [...items].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.title.localeCompare(b.title, "ru");
  });
}

export async function getDirections(): Promise<DirectionItem[]> {
  const rows = await query<DirectionRow>(
    `select ${COLUMNS} from directions where archived = false`
  );
  return sortDirections(rows.map(mapRow));
}

export async function getDirectionBySlug(
  slug: string
): Promise<DirectionItem | null> {
  const row = await queryOne<DirectionRow>(
    `select ${COLUMNS} from directions where slug = $1`,
    [slug]
  );
  return row ? mapRow(row) : null;
}

export async function getDirectionSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(`select slug from directions`);
  return rows.map((r) => r.slug);
}

export async function getDirectionLabelMap(): Promise<Record<string, string>> {
  const rows = await query<{ slug: string; title: string }>(
    `select slug, title from directions`
  );
  return Object.fromEntries(rows.map((r) => [r.slug, r.title]));
}
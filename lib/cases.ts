import type { CaseItem, ContentBlock } from "@/lib/cases-data";
import { createPublicClient } from "@/lib/supabase-public";
import { createClient } from "@/utils/supabase/server";

// Строка в БД (snake_case) -> доменная модель CaseItem (camelCase).
type CaseRow = {
  slug: string;
  title: string;
  excerpt: string;
  direction_slug: string | null;
  doctor_slug: string | null;
  cover_image: string | null;
  image_before: string | null;
  image_after: string | null;
  protocol_images: string[] | null;
  situation: string;
  diagnostics: string | null;
  decision: string | null;
  result: string | null;
  doctor_words: string | null;
  content_blocks: ContentBlock[] | null;
};

function mapRow(row: CaseRow): CaseItem {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    directionSlug: row.direction_slug ?? "",
    doctorSlug: row.doctor_slug ?? undefined,
    coverImage: row.cover_image ?? undefined,
    imageBefore: row.image_before ?? undefined,
    imageAfter: row.image_after ?? undefined,
    protocolImages: row.protocol_images ?? undefined,
    situation: row.situation,
    diagnostics: row.diagnostics ?? "",
    decision: row.decision ?? "",
    result: row.result ?? "",
    doctorWords: row.doctor_words ?? undefined,
    contentBlocks: row.content_blocks ?? [],
  };
}

const COLUMNS =
  "slug,title,excerpt,direction_slug,doctor_slug,cover_image,image_before,image_after,protocol_images,situation,diagnostics,decision,result,doctor_words,content_blocks";

// --- Публичное чтение (только опубликованные кейсы, RLS) ---
export async function getAllCases(): Promise<CaseItem[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cases")
    .select(COLUMNS)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as CaseRow[]).map(mapRow);
}

export async function getCaseBySlug(slug: string): Promise<CaseItem | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cases")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as CaseRow) : null;
}

export async function getCaseSlugs(): Promise<string[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("cases").select("slug");
  if (error) throw error;
  return (data as { slug: string }[]).map((row) => row.slug);
}

// --- Чтение под сессией пользователя (RLS пускает сотрудника/автора
//     к неопубликованным) — для предпросмотра и редактирования. ---
export async function getCaseBySlugAuthed(
  slug: string
): Promise<CaseItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select(COLUMNS)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as CaseRow) : null;
}

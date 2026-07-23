import type { CaseItem, ContentBlock } from "@/lib/cases-data";
import { query, queryOne } from "@/lib/db";

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
    // content_blocks — jsonb: драйвер pg уже возвращает готовый массив.
    contentBlocks: row.content_blocks ?? [],
  };
}

const COLUMNS =
  "slug, title, excerpt, direction_slug, doctor_slug, cover_image, image_before, image_after, protocol_images, situation, diagnostics, decision, result, doctor_words, content_blocks";

// --- Публичное чтение: только опубликованные кейсы ---
export async function getAllCases(): Promise<CaseItem[]> {
  const rows = await query<CaseRow>(
    `select ${COLUMNS} from cases where published = true order by created_at desc`
  );
  return rows.map(mapRow);
}

export async function getCaseBySlug(slug: string): Promise<CaseItem | null> {
  const row = await queryOne<CaseRow>(
    `select ${COLUMNS} from cases where slug = $1 and published = true`,
    [slug]
  );
  return row ? mapRow(row) : null;
}

export async function getCaseSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(
    `select slug from cases where published = true`
  );
  return rows.map((row) => row.slug);
}

// --- Чтение без фильтра публикации (для предпросмотра и редактирования).
//     Проверку прав (сотрудник/автор) теперь выполняет вызывающая страница. ---
export async function getCaseBySlugAuthed(
  slug: string
): Promise<CaseItem | null> {
  const row = await queryOne<CaseRow>(
    `select ${COLUMNS} from cases where slug = $1`,
    [slug]
  );
  return row ? mapRow(row) : null;
}
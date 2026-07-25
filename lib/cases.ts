// lib/cases.ts
import type { CaseItem, ContentBlock } from "@/lib/cases-data";
import { query, queryOne } from "@/lib/db";

// Строка в БД (snake_case) -> доменная модель CaseItem (camelCase).
type CaseRow = {
  slug: string;
  title: string;
  excerpt: string;
  direction_slug: string | null;
  doctor_slug: string | null;
  doctor_name: string | null;
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
    doctorName: row.doctor_name ?? undefined,
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
  "slug, title, excerpt, direction_slug, doctor_slug, doctor_name, cover_image, image_before, image_after, protocol_images, situation, diagnostics, decision, result, doctor_words, content_blocks";

// Условие видимости в списках: опубликован и не в архиве.
// Архивный кейс остаётся доступен по прямой ссылке — так внешние ссылки
// и позиции в поиске не ломаются, а вернуть его можно одним кликом.
const VISIBLE = "published = true and archived = false";

// --- Публичное чтение: только опубликованные и неархивные кейсы ---
export async function getAllCases(): Promise<CaseItem[]> {
  const rows = await query<CaseRow>(
    `select ${COLUMNS} from cases where ${VISIBLE} order by created_at desc`
  );
  return rows.map(mapRow);
}

// Детальная страница: архив здесь не фильтруем сознательно.
export async function getCaseBySlug(slug: string): Promise<CaseItem | null> {
  const row = await queryOne<CaseRow>(
    `select ${COLUMNS} from cases where slug = $1 and published = true`,
    [slug]
  );
  return row ? mapRow(row) : null;
}

// Слаги для карты сайта и generateStaticParams — без архивных.
export async function getCaseSlugs(): Promise<string[]> {
  const rows = await query<{ slug: string }>(
    `select slug from cases where ${VISIBLE}`
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

// --- Выборка для карточек ---------------------------------------------
// Блокам «клинические случаи» на главной, направлении, курсе и странице
// врача нужны только поля карточки. Раньше все они звали getAllCases(),
// то есть тянули content_blocks (jsonb с полным разбором), situation,
// diagnostics, decision и result по всем кейсам — и фильтровали в JS.
// Здесь фильтр и лимит уходят в SQL, а тяжёлые колонки не читаются вовсе.

type CaseCardRow = {
  slug: string;
  title: string;
  excerpt: string;
  direction_slug: string | null;
  doctor_slug: string | null;
  doctor_name: string | null;
  cover_image: string | null;
};

const CARD_COLUMNS =
  "slug, title, excerpt, direction_slug, doctor_slug, doctor_name, cover_image";

// Возвращаем полноценный CaseItem, чтобы не менять типы у CaseCard и
// вызывающих страниц. Поля разбора заполнены пустыми значениями —
// карточке они не нужны, а для детальной страницы есть getCaseBySlug.
function mapCardRow(row: CaseCardRow): CaseItem {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    directionSlug: row.direction_slug ?? "",
    doctorSlug: row.doctor_slug ?? undefined,
    doctorName: row.doctor_name ?? undefined,
    coverImage: row.cover_image ?? undefined,
    imageBefore: undefined,
    imageAfter: undefined,
    protocolImages: undefined,
    situation: "",
    diagnostics: "",
    decision: "",
    result: "",
    doctorWords: undefined,
    contentBlocks: [],
  };
}

export type CaseCardFilter = {
  /** Кейсы одного врача. */
  doctorSlug?: string;
  /** Кейсы одного направления. */
  directionSlug?: string;
  /** Кейсы любого из перечисленных направлений (переход с курса). */
  directionSlugs?: string[];
  /** Сколько вернуть. Без лимита вернутся все видимые. */
  limit?: number;
};

export async function getCasesForCards(
  filter: CaseCardFilter = {}
): Promise<CaseItem[]> {
  const where: string[] = [VISIBLE];
  const values: unknown[] = [];

  if (filter.doctorSlug) {
    values.push(filter.doctorSlug);
    where.push(`doctor_slug = $${values.length}`);
  }

  if (filter.directionSlug) {
    values.push(filter.directionSlug);
    where.push(`direction_slug = $${values.length}`);
  }

  if (filter.directionSlugs?.length) {
    values.push(filter.directionSlugs);
    where.push(`direction_slug = any($${values.length})`);
  }

  let text = `select ${CARD_COLUMNS} from cases
     where ${where.join(" and ")}
     order by created_at desc`;

  if (filter.limit) {
    values.push(filter.limit);
    text += ` limit $${values.length}`;
  }

  const rows = await query<CaseCardRow>(text, values);
  return rows.map(mapCardRow);
}
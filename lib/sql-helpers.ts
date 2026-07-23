import "server-only";

// Колонки типа jsonb: их значения нужно сериализовать в строку JSON,
// иначе драйвер pg превратит массив в postgres-массив (а не в jsonb).
const JSONB_COLUMNS = new Set([
  "content_blocks",
  "stats",
  "faq",
  "metrics",
  "program",
  "learning_formats",
  "content",
]);

function quote(col: string): string {
  return `"${col}"`;
}

function prepare(col: string, value: unknown): unknown {
  if (JSONB_COLUMNS.has(col)) return JSON.stringify(value ?? null);
  return value;
}

/** INSERT из объекта: { col: value } -> текст запроса и параметры. */
export function buildInsert(
  table: string,
  data: Record<string, unknown>
): { text: string; values: unknown[] } {
  const cols = Object.keys(data);
  const values = cols.map((c) => prepare(c, data[c]));
  const placeholders = cols.map((_, i) => `$${i + 1}`);
  return {
    text: `insert into ${table} (${cols.map(quote).join(", ")}) values (${placeholders.join(", ")})`,
    values,
  };
}

/** UPDATE из объекта с условием по одной колонке. */
export function buildUpdate(
  table: string,
  data: Record<string, unknown>,
  whereCol: string,
  whereValue: unknown
): { text: string; values: unknown[] } {
  const cols = Object.keys(data);
  const values = cols.map((c) => prepare(c, data[c]));
  const sets = cols.map((c, i) => `${quote(c)} = $${i + 1}`);
  return {
    text: `update ${table} set ${sets.join(", ")} where ${quote(whereCol)} = $${cols.length + 1}`,
    values: [...values, whereValue],
  };
}

/** Код ошибки PostgreSQL (например 23505 — нарушение уникальности). */
export function pgErrorCode(err: unknown): string | undefined {
  return (err as { code?: string })?.code;
}
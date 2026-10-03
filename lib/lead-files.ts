// lib/lead-files.ts
import "server-only";
import crypto from "node:crypto";
import { query, queryOne } from "@/lib/db";

/**
 * Файлы, приложенные к заявке (снимки пациента).
 *
 * Хранятся закрытыми объектами в хранилище, в базе — только ключ и
 * описание. Читает их сервер и отдаёт сотруднику после проверки прав
 * (app/api/leads/files/[id]/route.ts).
 *
 * Таблица lead_files создаётся миграцией
 * db/migrations/2026-10-lead-files.sql. Пока миграция не применена,
 * все функции здесь тихо возвращают «нет файлов» или ошибку загрузки —
 * сами заявки при этом принимаются как раньше.
 */

export const MAX_FILES_PER_LEAD = 3;
export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 МБ

export type LeadFile = {
  id: string;
  leadId: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

type Row = {
  id: string;
  lead_id: string;
  storage_key: string;
  file_name: string;
  content_type: string;
  size_bytes: number;
};

// ── Определение типа по содержимому ──
// Расширению и заголовку Content-Type из браузера верить нельзя: их
// задаёт отправитель. Смотрим на первые байты файла и принимаем только
// то, что безопасно открыть в браузере сотрудника: растровые картинки
// и PDF. HTML и SVG сюда попасть не могут.

export type SniffedType = { ext: string; contentType: string };

export function sniffFileType(bytes: Uint8Array): SniffedType | null {
  const b = bytes;
  if (b.length < 12) return null;

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) {
    return { ext: "jpg", contentType: "image/jpeg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    b[0] === 0x89 &&
    b[1] === 0x50 &&
    b[2] === 0x4e &&
    b[3] === 0x47 &&
    b[4] === 0x0d &&
    b[5] === 0x0a &&
    b[6] === 0x1a &&
    b[7] === 0x0a
  ) {
    return { ext: "png", contentType: "image/png" };
  }

  // WebP: "RIFF" .... "WEBP"
  if (
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return { ext: "webp", contentType: "image/webp" };
  }

  // PDF: "%PDF-"
  if (
    b[0] === 0x25 &&
    b[1] === 0x50 &&
    b[2] === 0x44 &&
    b[3] === 0x46 &&
    b[4] === 0x2d
  ) {
    return { ext: "pdf", contentType: "application/pdf" };
  }

  return null;
}

/**
 * Имя файла для показа сотруднику: без путей и управляющих символов.
 *
 * Расширение берётся из РЕАЛЬНОГО типа содержимого, а не из присланного
 * имени: иначе картинку можно назвать «снимок.html», и при «Сохранить как»
 * у сотрудника на диске окажется файл, который откроется как страница.
 */
export function cleanFileName(raw: string, ext: string): string {
  const base = raw.split(/[\\/]/).pop() ?? "";
  const stem = base
    .replace(/\.[^.]*$/, "")
    .replace(/[\u0000-\u001f\u007f"<>|:*?.]/g, "")
    .trim()
    .slice(0, 100);
  return `${stem || "file"}.${ext}`;
}

// ── Одноразовый пропуск на загрузку ──
// Файлы уходят отдельными запросами уже ПОСЛЕ того, как заявка
// сохранена. Чтобы к чужой заявке нельзя было приложить файл, сервер
// выдаёт подписанный пропуск: «к заявке такой-то, до такого-то времени».

const TOKEN_TTL_MS = 30 * 60 * 1000;

function tokenSecret(): string | null {
  return process.env.AUTH_SECRET || null;
}

function sign(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
}

/** null — если подписать нечем (не задан AUTH_SECRET): загрузка выключена. */
export function createUploadToken(leadId: string): string | null {
  const secret = tokenSecret();
  if (!secret) return null;
  const exp = Date.now() + TOKEN_TTL_MS;
  const payload = `${leadId}.${exp}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Возвращает id заявки или null, если пропуск подделан или истёк. */
export function verifyUploadToken(token: unknown): string | null {
  const secret = tokenSecret();
  if (!secret || typeof token !== "string") return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [leadId, expRaw, signature] = parts;

  const expected = sign(`${leadId}.${expRaw}`, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;

  return leadId || null;
}

// ── База ──

export async function leadExists(leadId: string): Promise<boolean> {
  const row = await queryOne<{ ok: number }>(
    `select 1 as ok from leads where id::text = $1`,
    [leadId]
  );
  return Boolean(row);
}

/**
 * Записывает файл в базу, если у заявки ещё есть место.
 * Возвращает false, когда лимит файлов исчерпан.
 * Бросает ошибку, если таблицы нет (миграция не применена).
 */
export async function insertLeadFile(file: {
  id: string;
  leadId: string;
  storageKey: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
}): Promise<boolean> {
  // У каждого файла свой номер места (slot), пара «заявка + место»
  // уникальна. Простая проверка «файлов меньше трёх» не выдерживает
  // одновременных запросов: все они видят одно и то же число. С местами
  // лишний запрос упирается в уникальный индекс и повторяет попытку —
  // уже видя занятые места.
  for (let attempt = 0; attempt <= MAX_FILES_PER_LEAD; attempt++) {
    try {
      const rows = await query<{ id: string }>(
        `insert into lead_files
           (id, lead_id, slot, storage_key, file_name, content_type, size_bytes)
         select $1, $2, free.slot, $3, $4, $5, $6
           from (
             select s as slot
               from generate_series(1, $7::int) as s
              where not exists (
                      select 1 from lead_files
                       where lead_id = $2 and slot = s
                    )
              order by s
              limit 1
           ) as free
         returning id`,
        [
          file.id,
          file.leadId,
          file.storageKey,
          file.fileName,
          file.contentType,
          file.sizeBytes,
          MAX_FILES_PER_LEAD,
        ]
      );
      return rows.length > 0;
    } catch (err) {
      // 23505 — место только что занял параллельный запрос: пробуем ещё.
      if ((err as { code?: string })?.code !== "23505") throw err;
    }
  }
  return false;
}

export async function deleteLeadFileRow(id: string): Promise<void> {
  await query(`delete from lead_files where id = $1`, [id]);
}

/** Файл вместе с ключом хранилища — только для серверной выдачи. */
export async function getLeadFileForDownload(
  id: string
): Promise<(LeadFile & { storageKey: string }) | null> {
  const row = await queryOne<Row>(
    `select id, lead_id, storage_key, file_name, content_type, size_bytes
       from lead_files where id = $1`,
    [id]
  );
  if (!row) return null;
  return {
    id: row.id,
    leadId: row.lead_id,
    fileName: row.file_name,
    contentType: row.content_type,
    sizeBytes: Number(row.size_bytes),
    storageKey: row.storage_key,
  };
}

/**
 * Файлы для списка заявок: «id заявки -> файлы».
 * Ошибку глушим: без таблицы раздел заявок должен работать как раньше.
 */
export async function getFilesForLeads(
  leadIds: string[]
): Promise<Map<string, LeadFile[]>> {
  const out = new Map<string, LeadFile[]>();
  if (!leadIds.length) return out;

  try {
    const rows = await query<Row>(
      `select id, lead_id, storage_key, file_name, content_type, size_bytes
         from lead_files
        where lead_id = any($1::text[])
        order by created_at`,
      [leadIds]
    );
    for (const row of rows) {
      const list = out.get(row.lead_id) ?? [];
      list.push({
        id: row.id,
        leadId: row.lead_id,
        fileName: row.file_name,
        contentType: row.content_type,
        sizeBytes: Number(row.size_bytes),
      });
      out.set(row.lead_id, list);
    }
  } catch (err) {
    console.error("getFilesForLeads:", err);
  }

  return out;
}

/** Ключи хранилища всех файлов заявки — чтобы удалить их вместе с ней. */
export async function takeLeadFileKeys(leadId: string): Promise<string[]> {
  try {
    const rows = await query<{ storage_key: string }>(
      `delete from lead_files where lead_id = $1 returning storage_key`,
      [leadId]
    );
    return rows.map((r) => r.storage_key);
  } catch (err) {
    console.error("takeLeadFileKeys:", err);
    return [];
  }
}

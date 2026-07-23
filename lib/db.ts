import { Pool } from "pg";
import fs from "node:fs";

// Пул соединений к PostgreSQL (Yandex Managed PostgreSQL).
// Требует SSL: сертификат CA лежит на сервере в ~/.postgresql/root.crt.
// Все параметры берём из переменных окружения (.env на сервере).

const caPath =
  process.env.PGSSLROOTCERT || `${process.env.HOME}/.postgresql/root.crt`;

// Читаем CA-сертификат, если файл есть (в проде — есть; локально может не быть).
let ca: string | undefined;
try {
  ca = fs.readFileSync(caPath, "utf8");
} catch {
  ca = undefined;
}

// Единый пул на весь процесс. В dev-режиме Next перезагружает модули,
// поэтому кэшируем пул в globalThis, чтобы не плодить соединения.
const globalForDb = globalThis as unknown as { _pgPool?: Pool };

export const pool =
  globalForDb._pgPool ??
  new Pool({
    host: process.env.PGHOST,
    port: Number(process.env.PGPORT || 6432),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: ca ? { ca, rejectUnauthorized: true } : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb._pgPool = pool;
}

// Хелпер для запросов: query<T>(sql, params) -> массив строк типа T.
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const res = await pool.query(text, params as never[]);
  return res.rows as T[];
}

// Хелпер для одной строки (или null).
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
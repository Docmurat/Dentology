// lib/anti-spam.ts
import "server-only";
import { headers } from "next/headers";
import { query } from "@/lib/db";

/**
 * Три дешёвых рубежа против ботов, без капчи:
 *   1. honeypot — скрытое поле, которое человек не видит и не заполняет;
 *   2. проверка времени — форма, отправленная за пару секунд, заполнена
 *      не руками;
 *   3. ограничение частоты по IP — от повторной отправки одним и тем же.
 *
 * Ни один не идеален по отдельности, вместе отсекают массовый мусор.
 * Живого спамера они не остановят — для этого есть модерация отзывов.
 */

/**
 * IP клиента из заголовков прокси.
 *
 * X-Real-IP идёт первым сознательно. Nginx ставит туда $remote_addr —
 * реальный адрес соединения, подделать его клиент не может.
 *
 * X-Forwarded-For собирается через $proxy_add_x_forwarded_for, то есть
 * Nginx ДОПИСЫВАЕТ реальный адрес к тому, что прислал клиент. Бот может
 * отправить свой X-Forwarded-For, и в начале цепочки окажется выдуманный
 * адрес — меняя его, легко обойти любой лимит. Поэтому из этой цепочки
 * берём ПОСЛЕДНИЙ элемент: его дописал наш собственный Nginx.
 */
export async function getClientIp(): Promise<string | null> {
  const h = await headers();

  const real = h.get("x-real-ip")?.trim();
  if (real) return real;

  const forwarded = h.get("x-forwarded-for");
  if (forwarded) {
    const chain = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = chain[chain.length - 1];
    if (last) return last;
  }

  return null;
}

/** Заполненное скрытое поле = бот. */
export function isHoneypotFilled(value: unknown): boolean {
  return Boolean(String(value ?? "").trim());
}

/**
 * Форма отправлена подозрительно быстро.
 *
 * Метка ставится на клиенте при монтировании формы, поэтому её можно
 * подделать. Это осознанно: цель — отсеять простые скрипты, а не защита
 * от целенаправленной атаки. Если метки нет, считаем проверку пройденной,
 * чтобы не отклонять заявки из-за отключённого JS или старой вкладки.
 */
export function isTooFast(startedAt: unknown, minMs = 3000): boolean {
  const started = Number(startedAt);
  if (!Number.isFinite(started) || started <= 0) return false;

  const elapsed = Date.now() - started;
  if (elapsed < 0) return false;

  return elapsed < minMs;
}

export type RateLimitResult = {
  allowed: boolean;
  /** Через сколько секунд можно повторить. */
  retryAfterSec: number;
};

/**
 * Ограничение частоты по ключу «действие + IP».
 *
 * При любой ошибке пропускаем: сбой ограничителя не должен ронять приём
 * заявок — потерянная заявка дороже пропущенного спама.
 *
 * ВАЖНО: работает, только если Nginx передаёт реальный адрес. Без этого
 * все посетители придут с одного адреса и упрутся в общий лимит.
 * В конфиге должно быть:
 *   proxy_set_header X-Real-IP $remote_addr;
 *   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
 */
export async function rateLimit(
  action: string,
  opts: { limit: number; windowSec: number }
): Promise<RateLimitResult> {
  const ip = await getClientIp();
  const bucket = `${action}:${ip ?? "unknown"}`;

  try {
    // Редкая уборка старых записей — чтобы таблица не росла бесконечно.
    if (Math.random() < 0.05) {
      await query(
        `delete from rate_limit_hits where created_at < now() - interval '1 day'`
      );
    }

    const rows = await query<{ hits: number; oldest: string | null }>(
      `select count(*)::int as hits, min(created_at) as oldest
         from rate_limit_hits
        where bucket = $1
          and created_at > now() - make_interval(secs => $2::int)`,
      [bucket, opts.windowSec]
    );

    const hits = Number(rows[0]?.hits ?? 0);

    if (hits >= opts.limit) {
      const oldestMs = rows[0]?.oldest
        ? new Date(rows[0].oldest).getTime()
        : Date.now();
      const retryAfterSec = Math.max(
        1,
        Math.ceil((oldestMs + opts.windowSec * 1000 - Date.now()) / 1000)
      );
      return { allowed: false, retryAfterSec };
    }

    await query(`insert into rate_limit_hits (bucket) values ($1)`, [bucket]);
    return { allowed: true, retryAfterSec: 0 };
  } catch (err) {
    console.error("rateLimit:", err);
    return { allowed: true, retryAfterSec: 0 };
  }
}

/** «через 12 минут» — для сообщения пользователю. */
export function formatRetryAfter(sec: number): string {
  if (sec < 60) return "меньше минуты";
  const minutes = Math.ceil(sec / 60);
  if (minutes < 60) return `${minutes} мин.`;
  return `${Math.ceil(minutes / 60)} ч.`;
}
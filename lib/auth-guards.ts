// lib/auth-guards.ts
import "server-only";
import { cache } from "react";
import { auth, type UserRole } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  doctorSlug: string | null;
  /** Доступ к заявкам и отзывам на модерации. */
  isModerator: boolean;
};

/**
 * Текущий пользователь из сессии (или null).
 *
 * Признак модератора берётся из базы, а не только из токена. Токен
 * выдаётся при входе и живёт долго: если брать флаг оттуда, галочка,
 * поставленная администратором, начнёт действовать лишь после того,
 * как человек выйдет и зайдёт заново. Здесь она действует сразу.
 *
 * cache() из React убирает лишние запросы: getCurrentUser вызывается
 * по нескольку раз за один рендер, но в базу сходит только однажды.
 */
export const getCurrentUser = cache(async function getCurrentUser(): Promise<
  SessionUser | null
> {
  const session = await auth();
  const u = session?.user as
    | {
        id?: string;
        email?: string | null;
        role?: UserRole;
        doctorSlug?: string | null;
        isModerator?: boolean;
      }
    | undefined;
  if (!u?.id || !u.role) return null;

  const doctorSlug = u.doctorSlug ?? null;

  // Роль moderator даёт доступ сама по себе. Для остальных смотрим
  // галочку в карточке команды, к которой привязан аккаунт.
  let isModerator = u.role === "moderator";
  if (!isModerator && doctorSlug) {
    try {
      const card = await queryOne<{ is_moderator: boolean | null }>(
        `select is_moderator from team_members where slug = $1`,
        [doctorSlug]
      );
      isModerator = Boolean(card?.is_moderator);
    } catch {
      // База недоступна — не роняем страницу, просто не даём доступ.
      isModerator = Boolean(u.isModerator);
    }
  }

  return {
    id: u.id,
    email: u.email ?? "",
    role: u.role,
    doctorSlug,
    isModerator,
  };
});

/** Сотрудник (админ или редактор) — иначе ошибка. */
export async function requireStaff(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Не авторизован");
  if (!["admin", "editor"].includes(user.role)) {
    throw new Error("Недостаточно прав");
  }
  return user;
}

/** Только администратор. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Не авторизован");
  if (user.role !== "admin") throw new Error("Недостаточно прав");
  return user;
}

/** Врач (или админ) — для кабинета врача. */
export async function requireDoctor(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Не авторизован");
  if (!["doctor", "admin"].includes(user.role)) {
    throw new Error("Недостаточно прав");
  }
  return user;
}

/**
 * Доступ к заявкам и отзывам на модерации.
 *
 * Пропускает сотрудников (у них и так полный доступ) и всех, у кого
 * стоит признак модератора: это может быть врач, ассистент или
 * отдельная учётная запись с ролью moderator.
 */
export async function requireModerator(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Не авторизован");
  if (canModerate(user)) return user;
  throw new Error("Недостаточно прав");
}

export function isStaff(user: SessionUser | null): boolean {
  return Boolean(user && ["admin", "editor"].includes(user.role));
}

export function canModerate(user: SessionUser | null): boolean {
  if (!user) return false;
  return isStaff(user) || user.isModerator || user.role === "moderator";
}
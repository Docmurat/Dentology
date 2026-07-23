import "server-only";
import { auth, type UserRole } from "@/lib/auth";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  doctorSlug: string | null;
};

/** Текущий пользователь из сессии (или null). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  const u = session?.user as
    | { id?: string; email?: string | null; role?: UserRole; doctorSlug?: string | null }
    | undefined;
  if (!u?.id || !u.role) return null;
  return {
    id: u.id,
    email: u.email ?? "",
    role: u.role,
    doctorSlug: u.doctorSlug ?? null,
  };
}

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

export function isStaff(user: SessionUser | null): boolean {
  return Boolean(user && ["admin", "editor"].includes(user.role));
}
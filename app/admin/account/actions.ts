"use server";

import bcrypt from "bcryptjs";
import { queryOne, query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";
import { rateLimit } from "@/lib/anti-spam";

export type ChangePasswordState = { error?: string; ok?: boolean };

const MIN_LENGTH = 10;

/**
 * Смена собственного пароля сотрудником админки.
 *
 * Нужен текущий пароль: без него пароль мог бы сменить любой, кто
 * подошёл к оставленному открытым компьютеру.
 */
export async function changeOwnPassword(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const user = await getCurrentUser();
  if (!user || !["admin", "editor"].includes(user.role)) {
    return { error: "Нет доступа." };
  }

  // Подбор текущего пароля: не больше 10 попыток в час.
  const limit = await rateLimit(`change-password:${user.id}`, {
    limit: 10,
    windowSec: 3600,
  });
  if (!limit.allowed) {
    return { error: "Слишком много попыток. Попробуйте через час." };
  }

  const current = String(formData.get("current") || "");
  const next = String(formData.get("next") || "");
  const repeat = String(formData.get("repeat") || "");

  if (!current || !next) return { error: "Заполните все поля." };
  if (next.length < MIN_LENGTH) {
    return { error: `Новый пароль — не короче ${MIN_LENGTH} символов.` };
  }
  if (next !== repeat) return { error: "Новый пароль и повтор не совпадают." };
  if (next === current) return { error: "Новый пароль совпадает с текущим." };

  const row = await queryOne<{ password_hash: string }>(
    `select password_hash from profiles where id = $1`,
    [user.id],
  );
  if (!row || !(await bcrypt.compare(current, row.password_hash))) {
    return { error: "Текущий пароль неверный." };
  }

  const hash = await bcrypt.hash(next, 10);
  await query(`update profiles set password_hash = $1 where id = $2`, [
    hash,
    user.id,
  ]);

  return { ok: true };
}

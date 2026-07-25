// app/admin/team/account-actions.ts
"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { loginToEmail } from "@/lib/auth-login";

type Result = { error?: string; ok?: boolean };

// Привязать (или создать) аккаунт к карточке сотрудника + задать пароль.
// Аккаунты хранятся в profiles: email + bcrypt-хеш пароля.
export async function linkTeamAccount(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }

  const slug = String(formData.get("slug") || "");
  const name = String(formData.get("name") || "").trim();
  const login = String(formData.get("login") || "");
  const password = String(formData.get("password") || "");
  const email = loginToEmail(login).toLowerCase();

  if (!slug) return { error: "Нет карточки сотрудника" };
  if (!login.trim()) return { error: "Укажите логин" };

  // Роль определяется карточкой, а не выбирается руками: иначе легко
  // выдать врачу кабинет модератора или наоборот.
  const card = await queryOne<{
    category: string;
    staff_kind: string | null;
    is_moderator: boolean | null;
  }>(
    `select category, staff_kind, is_moderator from team_members where slug = $1`,
    [slug]
  );
  if (!card) return { error: "Карточка сотрудника не найдена" };

  // Врач с галочкой модератора остаётся врачом: кабинет врача ему нужнее,
  // а доступ к заявкам даёт отдельный признак is_moderator в сессии.
  const role =
    card.category === "doctor"
      ? "doctor"
      : card.staff_kind === "moderator" || card.is_moderator
        ? "moderator"
        : null;

  if (!role) {
    return {
      error:
        "Этому сотруднику некуда входить. Включите «Модератор» в карточке или выберите тип «Модератор».",
    };
  }

  const existing = await queryOne<{ id: string }>(
    `select id from profiles where lower(email) = $1`,
    [email]
  );

  let userId: string;

  if (existing) {
    userId = existing.id;
    // Пароль меняем только если его ввели.
    if (password) {
      if (password.length < 8) return { error: "Пароль — минимум 8 символов" };
      const hash = await bcrypt.hash(password, 10);
      await query(`update profiles set password_hash = $1 where id = $2`, [
        hash,
        userId,
      ]);
    }
    await query(
      `update profiles set role = $1, full_name = $2, doctor_slug = $3
        where id = $4`,
      [role, name || null, slug, userId]
    );
  } else {
    if (password.length < 8) {
      return { error: "Для нового аккаунта укажите пароль (от 8 символов)" };
    }
    const hash = await bcrypt.hash(password, 10);
    try {
      const created = await queryOne<{ id: string }>(
        `insert into profiles (email, password_hash, full_name, role, doctor_slug)
         values ($1, $2, $3, $4, $5)
         returning id`,
        [email, hash, name || null, role, slug]
      );
      if (!created) return { error: "Не удалось создать аккаунт" };
      userId = created.id;
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Ошибка создания" };
    }
  }

  // Одна карточка — один аккаунт: снимаем привязку с других.
  await query(
    `update profiles set doctor_slug = null where doctor_slug = $1 and id <> $2`,
    [slug, userId]
  );

  revalidatePath(`/admin/team/${slug}/edit`);
  return { ok: true };
}

// Отвязать аккаунт от карточки (сам аккаунт остаётся).
export async function unlinkTeamAccount(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  await query(`update profiles set doctor_slug = null where doctor_slug = $1`, [
    slug,
  ]);

  revalidatePath(`/admin/team/${slug}/edit`);
}
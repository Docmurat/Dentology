"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-guards";
import { pgErrorCode } from "@/lib/sql-helpers";
import { loginToEmail } from "@/lib/auth-login";

type Result = { error?: string; ok?: boolean };

// Управление аккаунтами пациентов — только администратор.
// Аккаунты живут в таблице profiles (email + bcrypt-хеш пароля).
export async function createPatientAccount(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }

  const login = String(formData.get("login") || "");
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const email = loginToEmail(login);

  if (!login.trim()) return { error: "Укажите логин" };
  if (password.length < 8) return { error: "Пароль — минимум 8 символов" };

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await query(
      `insert into profiles (email, password_hash, full_name, role)
       values ($1, $2, $3, 'patient')`,
      [email.toLowerCase(), passwordHash, fullName || null]
    );
  } catch (err) {
    if (pgErrorCode(err) === "23505") {
      return { error: "Пользователь с таким логином уже существует" };
    }
    return { error: err instanceof Error ? err.message : "Ошибка создания" };
  }

  revalidatePath("/admin/patients");
  return { ok: true };
}

export async function setPatientPassword(
  _prev: Result,
  formData: FormData
): Promise<Result> {
  try {
    await requireAdmin();
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Ошибка" };
  }

  const userId = String(formData.get("userId") || "");
  const password = String(formData.get("password") || "");
  if (!userId) return { error: "Нет пользователя" };
  if (password.length < 8) return { error: "Пароль — минимум 8 символов" };

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    await query(`update profiles set password_hash = $1 where id = $2`, [
      passwordHash,
      userId,
    ]);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка смены пароля" };
  }

  return { ok: true };
}

export async function deletePatientAccount(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  if (!userId) return;

  // Удаляем только пациентов — на случай ошибочного id.
  await query(`delete from profiles where id = $1 and role = 'patient'`, [
    userId,
  ]);

  revalidatePath("/admin/patients");
}

// Проверка существования логина (используется формой при необходимости).
export async function patientExists(login: string): Promise<boolean> {
  const email = loginToEmail(login).toLowerCase();
  const row = await queryOne<{ id: string }>(
    `select id from profiles where lower(email) = $1`,
    [email]
  );
  return Boolean(row);
}
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { loginToEmail } from "@/lib/auth-login";

type Result = { error?: string; ok?: boolean };

// Управление аккаунтами пациентов — только администратор.
async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизован");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    throw new Error("Доступно только администратору");
  }
}

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

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) return { error: error.message };

  const { error: pErr } = await admin.from("profiles").upsert({
    id: data.user.id,
    role: "patient",
    full_name: fullName || null,
  });
  if (pErr) return { error: pErr.message };

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

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };

  return { ok: true };
}

export async function deletePatientAccount(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") || "");
  if (!userId) return;

  const admin = createAdminClient();
  await admin.auth.admin.deleteUser(userId);

  revalidatePath("/admin/patients");
}
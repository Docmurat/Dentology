"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { loginToEmail } from "@/lib/auth-login";

type Result = { error?: string; ok?: boolean };

// Управление аккаунтом врача — только администратор.
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

async function findUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string
) {
  const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
  return (
    (data?.users ?? []).find(
      (u) => (u.email ?? "").toLowerCase() === email
    ) ?? null
  );
}

// Привязать (или создать) аккаунт к карточке сотрудника + задать пароль.
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
  const email = loginToEmail(login);

  if (!slug) return { error: "Нет карточки сотрудника" };
  if (!login.trim()) return { error: "Укажите логин" };

  const admin = createAdminClient();
  const existing = await findUserByEmail(admin, email);

  let userId: string;

  if (existing) {
    userId = existing.id;
    if (password) {
      if (password.length < 8) return { error: "Пароль — минимум 8 символов" };
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
      });
      if (error) return { error: error.message };
    }
  } else {
    if (password.length < 8) {
      return { error: "Для нового аккаунта укажите пароль (от 8 символов)" };
    }
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (error) return { error: error.message };
    userId = data.user.id;
  }

  // Одна карточка — один аккаунт: снимаем привязку с других.
  await admin
    .from("profiles")
    .update({ doctor_slug: null })
    .eq("doctor_slug", slug)
    .neq("id", userId);

  const { error: pErr } = await admin.from("profiles").upsert({
    id: userId,
    role: "doctor",
    full_name: name || null,
    doctor_slug: slug,
  });
  if (pErr) return { error: pErr.message };

  revalidatePath(`/admin/team/${slug}/edit`);
  return { ok: true };
}

// Отвязать аккаунт от карточки (сам аккаунт остаётся).
export async function unlinkTeamAccount(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ doctor_slug: null })
    .eq("doctor_slug", slug);

  revalidatePath(`/admin/team/${slug}/edit`);
}
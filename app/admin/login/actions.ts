"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn as authSignIn } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { roleHome } from "@/lib/role-home";
import { loginToEmail } from "@/lib/auth-login";

export async function signIn(_prevState: unknown, formData: FormData) {
  const login = String(formData.get("login") || formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const email = loginToEmail(login);

  if (!email || !password) {
    return { error: "Введите логин и пароль" };
  }

  try {
    // redirect: false — перенаправляем сами, с учётом роли.
    await authSignIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный логин или пароль" };
    }
    throw error;
  }

  // Роль нужна, чтобы отправить пользователя в его раздел.
  const profile = await queryOne<{ role: string }>(
    `select role from profiles where lower(email) = $1`,
    [email.toLowerCase()]
  );

  // redirect() бросает специальное исключение — вызываем вне try/catch.
  redirect(roleHome(profile?.role));
}
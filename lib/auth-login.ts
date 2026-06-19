// Вход по логину поверх email-авторизации Supabase.
// К логину дописывается служебный домен (пользователю он не виден).
// Если ввели настоящий email (с «@») — оставляем как есть (для админа).

export const LOGIN_DOMAIN = "dentology.local";

export function loginToEmail(login: string): string {
  const value = login.trim().toLowerCase();
  if (!value) return value;
  if (value.includes("@")) return value;
  return `${value}@${LOGIN_DOMAIN}`;
}

export function emailToLogin(email: string | null | undefined): string {
  const value = (email ?? "").toLowerCase();
  const suffix = `@${LOGIN_DOMAIN}`;
  return value.endsWith(suffix) ? value.slice(0, -suffix.length) : value;
}
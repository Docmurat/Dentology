"use server";

import { signOut as authSignOut } from "@/lib/auth";

export async function signOut() {
  // Auth.js сам очистит cookie сессии и выполнит переход.
  await authSignOut({ redirectTo: "/" });
}
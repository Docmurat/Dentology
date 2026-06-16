"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { roleHome } from "@/lib/role-home";

export async function signIn(_prevState: unknown, formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { error: "Неверный email или пароль" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  redirect(roleHome(profile?.role));
}
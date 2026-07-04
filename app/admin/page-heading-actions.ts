"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  PAGE_HEADING_KEYS,
  pageHeadingStorageKey,
  type PageHeadingKey,
} from "@/lib/page-content";

async function requireStaff() {
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

  if (!profile || !["admin", "editor"].includes(profile.role)) {
    throw new Error("Недостаточно прав");
  }
  return supabase;
}

// Пути публичных страниц по ключу — для ревалидации.
const PUBLIC_PATH: Record<PageHeadingKey, string> = {
  cases: "/cases",
  team: "/team",
  reviews: "/reviews",
  education: "/education",
};

export async function savePageHeading(formData: FormData) {
  const supabase = await requireStaff();

  const key = String(formData.get("pageKey") || "") as PageHeadingKey;
  if (!PAGE_HEADING_KEYS.includes(key)) return;

  const content = {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
  };

  await supabase
    .from("homepage_content")
    .upsert(
      { block_key: pageHeadingStorageKey(key), content },
      { onConflict: "block_key" }
    );

  revalidatePath(PUBLIC_PATH[key]);
}
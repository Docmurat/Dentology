"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guards";
import {
  PAGE_HEADING_KEYS,
  pageHeadingStorageKey,
  type PageHeadingKey,
} from "@/lib/page-content";

// Пути публичных страниц по ключу — для ревалидации.
const PUBLIC_PATH: Record<PageHeadingKey, string> = {
  cases: "/cases",
  team: "/team",
  reviews: "/reviews",
  education: "/education",
};

export async function savePageHeading(formData: FormData) {
  await requireStaff();

  const key = String(formData.get("pageKey") || "") as PageHeadingKey;
  if (!PAGE_HEADING_KEYS.includes(key)) return;

  const content = {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
  };

  await query(
    `insert into homepage_content (block_key, content)
     values ($1, $2::jsonb)
     on conflict (block_key) do update
       set content = excluded.content, updated_at = now()`,
    [pageHeadingStorageKey(key), JSON.stringify(content)]
  );

  revalidatePath(PUBLIC_PATH[key]);
}
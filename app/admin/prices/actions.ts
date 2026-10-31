"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guards";
import {
  normalizePriceCategory,
  type PriceCategory,
} from "@/lib/price-list";

// Сохранить страницу «Цены» (ключ price_list в homepage_content).
export async function savePriceListContent(formData: FormData) {
  await requireStaff();

  let categories: PriceCategory[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("categories") || "[]"));
    if (Array.isArray(parsed)) {
      categories = parsed
        .map((it) => normalizePriceCategory(it))
        .filter((it): it is PriceCategory => it !== null);
    }
  } catch {
    categories = [];
  }

  const notes = String(formData.get("notes") || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const content = {
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    categories,
    notes,
  };

  await query(
    `insert into homepage_content (block_key, content)
     values ('price_list', $1::jsonb)
     on conflict (block_key) do update
       set content = excluded.content, updated_at = now()`,
    [JSON.stringify(content)]
  );

  revalidatePath("/prices");
  revalidatePath("/admin/prices");
}

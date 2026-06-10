/**
 * Разовый перенос существующих кейсов из lib/cases-data.ts в Supabase.
 * Запуск:  npx tsx scripts/seed.ts
 * Требует переменные окружения NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY
 * (service role используется только локально и НЕ попадает в браузер).
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { casesData } from "../lib/cases-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  throw new Error(
    "Заданы не все переменные: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function main() {
  const rows = casesData.map((item) => ({
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt ?? "",
    category: item.category ?? null,
    direction_slug: item.directionSlug ?? null,
    status: item.status ?? null,
    doctor_slug: item.doctorSlug ?? null,
    cover_image: item.coverImage ?? null,
    image_before: item.imageBefore ?? null,
    image_after: item.imageAfter ?? null,
    protocol_images: item.protocolImages ?? [],
    situation: item.situation ?? "",
    diagnostics: item.diagnostics ?? null,
    decision: item.decision ?? null,
    result: item.result ?? null,
  }));

  const { error } = await supabase
    .from("cases")
    .upsert(rows, { onConflict: "slug" });

  if (error) {
    console.error("Ошибка переноса:", error);
    process.exit(1);
  }
  console.log(`Перенесено кейсов: ${rows.length}`);
}

main();

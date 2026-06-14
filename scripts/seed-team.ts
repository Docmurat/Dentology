/**
 * Разовый перенос команды из lib/team-data.ts в Supabase.
 * Запуск:  npx tsx scripts/seed-team.ts
 * Требует NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { teamData } from "../lib/team-data";

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
  const rows = teamData.map((member) => ({
    slug: member.slug,
    name: member.name,
    position: member.position,
    role: member.role,
    short_role: member.shortRole,
    excerpt: member.excerpt,
    description: member.description,
    image: member.image,
    category: member.category,
    is_chief: member.isChief,
    is_lead: member.isLead,
    lead_direction_slug: member.leadDirectionSlug ?? null,
    direction_slugs: member.directionSlugs ?? [],
    sort_order: member.sortOrder,
  }));

  const { error } = await supabase
    .from("team_members")
    .upsert(rows, { onConflict: "slug" });

  if (error) {
    console.error("Ошибка переноса:", error);
    process.exit(1);
  }
  console.log(`Перенесено сотрудников: ${rows.length}`);
}

main();

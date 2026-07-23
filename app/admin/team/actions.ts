"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { buildInsert, buildUpdate, pgErrorCode } from "@/lib/sql-helpers";
import { requireStaff, requireAdmin } from "@/lib/auth-guards";
import { slugify } from "@/lib/slugify";

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function readStats(formData: FormData) {
  const out: { value: string; label: string }[] = [];
  for (let i = 1; i <= 3; i++) {
    const value = String(formData.get(`statValue${i}`) || "").trim();
    const label = String(formData.get(`statLabel${i}`) || "").trim();
    if (value || label) out.push({ value, label });
  }
  return out;
}

function readFields(formData: FormData) {
  const isLead = formData.get("isLead") === "on";
  const leadDirection = String(formData.get("leadDirectionSlug") || "") || null;
  const directionSlugs = (formData.getAll("directionSlugs") as string[]).filter(
    Boolean
  );

  return {
    name: String(formData.get("name") || "").trim(),
    position: String(formData.get("position") || "").trim(),
    role: String(formData.get("role") || "").trim(),
    short_role: String(formData.get("shortRole") || "").trim(),
    excerpt: String(formData.get("excerpt") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    image: String(formData.get("image") || "") || null,
    category: (String(formData.get("category") || "doctor") === "staff"
      ? "staff"
      : "doctor") as "doctor" | "staff",
    is_chief: formData.get("isChief") === "on",
    is_lead: isLead,
    lead_direction_slug: isLead ? leadDirection : null,
    direction_slugs: directionSlugs,
    sort_order: Number(formData.get("sortOrder") || 0) || 0,
    stats: readStats(formData),
    focus_points: parseLines(String(formData.get("focusPoints") || "")),
    visit_points: parseLines(String(formData.get("visitPoints") || "")),
    quote: String(formData.get("quote") || "").trim() || null,
    lead_image: String(formData.get("leadImage") || "") || null,
    lead_quote: String(formData.get("leadQuote") || "").trim() || null,
    doctor_quote: String(formData.get("doctorQuote") || "").trim() || null,
    courses: parseLines(String(formData.get("courses") || "")),
    diploma_image: String(formData.get("diplomaImage") || "") || null,
    name_genitive: String(formData.get("nameGenitive") || "").trim() || null,
    show_on_homepage: formData.get("showOnHomepage") === "on",
    is_speaker: formData.get("isSpeaker") === "on",
  };
}

// Снимаем конфликтующие пометки, чтобы не упереться в уникальные индексы:
// один главный врач и один ведущий на направление.
async function clearConflicts(
  fields: ReturnType<typeof readFields>,
  exceptSlug?: string
) {
  if (fields.is_chief) {
    await query(
      `update team_members set is_chief = false
        where is_chief = true and ($1::text is null or slug <> $1)`,
      [exceptSlug ?? null]
    );
  }

  if (fields.is_lead && fields.lead_direction_slug) {
    await query(
      `update team_members set is_lead = false, lead_direction_slug = null
        where is_lead = true and lead_direction_slug = $1
          and ($2::text is null or slug <> $2)`,
      [fields.lead_direction_slug, exceptSlug ?? null]
    );
  }
}

function revalidateTeam(slug: string) {
  revalidatePath("/team");
  revalidatePath(`/team/${slug}`);
  revalidatePath("/");
  revalidatePath("/directions", "layout");
  revalidatePath("/admin/team");
}

export async function createTeamMember(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const user = await requireStaff();

  const fields = readFields(formData);
  if (!fields.name) return { error: "Имя обязательно" };

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.name) ||
    `member-${Date.now()}`;

  await clearConflicts(fields);

  try {
    const { text, values } = buildInsert("team_members", {
      slug,
      ...fields,
      created_by: user.id,
    });
    await query(text, values);
  } catch (err) {
    if (pgErrorCode(err) === "23505")
      return { error: "Сотрудник с таким slug уже существует" };
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidateTeam(slug);
  return { slug };
}

export async function updateTeamMember(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  await requireStaff();

  const originalSlug = String(formData.get("originalSlug") || "");
  if (!originalSlug) return { error: "Не указан сотрудник для обновления" };

  const fields = readFields(formData);
  if (!fields.name) return { error: "Имя обязательно" };

  await clearConflicts(fields, originalSlug);

  try {
    const { text, values } = buildUpdate(
      "team_members",
      fields,
      "slug",
      originalSlug
    );
    await query(text, values);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidateTeam(originalSlug);
  return { slug: originalSlug };
}

// Удаление сотрудника — только администратор.
export async function deleteTeamMember(formData: FormData) {
  await requireAdmin();
  const slug = String(formData.get("slug") || "");

  await query(`delete from team_members where slug = $1`, [slug]);

  revalidateTeam(slug);
}
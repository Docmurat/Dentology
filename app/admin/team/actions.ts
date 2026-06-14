"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { slugify } from "@/lib/slugify";

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
  return { supabase, user };
}

type Supabase = Awaited<ReturnType<typeof requireStaff>>["supabase"];

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
    // Направление-«ведущий» имеет смысл только если отмечен флаг ведущего.
    lead_direction_slug: isLead ? leadDirection : null,
    direction_slugs: directionSlugs,
    sort_order: Number(formData.get("sortOrder") || 0) || 0,
  };
}

// Снимаем конфликтующие пометки, чтобы не упереться в уникальные индексы:
// один главный врач и один ведущий на направление.
async function clearConflicts(
  supabase: Supabase,
  fields: ReturnType<typeof readFields>,
  exceptSlug?: string
) {
  if (fields.is_chief) {
    let q = supabase
      .from("team_members")
      .update({ is_chief: false })
      .eq("is_chief", true);
    if (exceptSlug) q = q.neq("slug", exceptSlug);
    await q;
  }

  if (fields.is_lead && fields.lead_direction_slug) {
    let q = supabase
      .from("team_members")
      .update({ is_lead: false, lead_direction_slug: null })
      .eq("is_lead", true)
      .eq("lead_direction_slug", fields.lead_direction_slug);
    if (exceptSlug) q = q.neq("slug", exceptSlug);
    await q;
  }
}

function revalidateTeam(slug: string) {
  revalidatePath("/team");
  revalidatePath(`/team/${slug}`);
  revalidatePath("/"); // блок команды на главной
  revalidatePath("/directions", "layout"); // ведущий на страницах направлений
  revalidatePath("/admin/team");
}

export async function createTeamMember(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const { supabase, user } = await requireStaff();

  const fields = readFields(formData);
  if (!fields.name) return { error: "Имя обязательно" };

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.name) ||
    `member-${Date.now()}`;

  await clearConflicts(supabase, fields);

  const { error } = await supabase
    .from("team_members")
    .insert({ slug, ...fields, created_by: user.id });

  if (error) {
    if (error.code === "23505")
      return { error: "Сотрудник с таким slug уже существует" };
    return { error: error.message };
  }

  revalidateTeam(slug);
  return { slug };
}

export async function updateTeamMember(
  formData: FormData
): Promise<{ error?: string; slug?: string }> {
  const { supabase } = await requireStaff();

  const originalSlug = String(formData.get("originalSlug") || "");
  if (!originalSlug) return { error: "Не указан сотрудник для обновления" };

  const fields = readFields(formData);
  if (!fields.name) return { error: "Имя обязательно" };

  await clearConflicts(supabase, fields, originalSlug);

  const { error } = await supabase
    .from("team_members")
    .update(fields)
    .eq("slug", originalSlug);

  if (error) return { error: error.message };

  revalidateTeam(originalSlug);
  return { slug: originalSlug };
}

export async function deleteTeamMember(formData: FormData) {
  const { supabase } = await requireStaff();
  const slug = String(formData.get("slug") || "");

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("slug", slug);
  if (error) throw error;

  revalidateTeam(slug);
}

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
  return supabase;
}

function revalidateDirections(slug?: string) {
  revalidatePath("/admin/directions");
  revalidatePath("/directions");
  if (slug) revalidatePath(`/directions/${slug}`);
  revalidatePath("/"); // коллаж на главной
}

function parseLines(value: FormDataEntryValue | null): string[] {
  return String(value || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseFaq(value: FormDataEntryValue | null) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((q) => ({
        question: String(q?.question || "").trim(),
        answer: String(q?.answer || "").trim(),
      }))
      .filter((q) => q.question && q.answer)
      .slice(0, 20);
  } catch {
    return [];
  }
}

// Поля направления из формы. slug читается отдельно (на create).
function readFields(formData: FormData) {
  const roleRaw = String(formData.get("collageRole") || "small");
  const collageRole = ["featured", "large", "small"].includes(roleRaw)
    ? roleRaw
    : "small";

  return {
    title: String(formData.get("title") || "").trim(),
    short: String(formData.get("short") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    hero_description: String(formData.get("heroDescription") || "").trim(),
    // Позиция в коллаже сама определяет «главное» направление.
    featured: collageRole === "featured",
    collage_role: collageRole,
    sort_order: Number(formData.get("sortOrder") || 0) || 0,
    problems: parseLines(formData.get("problems")),
    fears: parseLines(formData.get("fears")),
    approach: parseLines(formData.get("approach")),
    insight_title: String(formData.get("insightTitle") || "").trim() || null,
    insight_text: parseLines(formData.get("insightText")),
    faq: parseFaq(formData.get("faq")),
  };
}

// «Главным» может быть только одно направление: остальные featured
// понижаем до «большого», чтобы коллаж не сломался.
async function demoteOtherFeatured(
  supabase: Awaited<ReturnType<typeof requireStaff>>,
  keepSlug: string
) {
  await supabase
    .from("directions")
    .update({ featured: false, collage_role: "large" })
    .eq("collage_role", "featured")
    .neq("slug", keepSlug);
}

export async function createDirection(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await requireStaff();

  const fields = readFields(formData);
  if (!fields.title) return { error: "Название обязательно" };

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `direction-${Date.now()}`;

  if (fields.featured) await demoteOtherFeatured(supabase, slug);

  const { error } = await supabase.from("directions").insert({ slug, ...fields });
  if (error) {
    if (error.code === "23505")
      return { error: "Направление с таким slug уже существует" };
    return { error: error.message };
  }

  revalidateDirections(slug);
  return {};
}

export async function updateDirection(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await requireStaff();

  const originalSlug = String(formData.get("originalSlug") || "");
  if (!originalSlug) return { error: "Не указано направление для обновления" };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Название обязательно" };

  // slug не меняем — к нему привязаны кейсы и отзывы.
  const { error } = await supabase
    .from("directions")
    .update(fields)
    .eq("slug", originalSlug);
  if (error) return { error: error.message };

  if (fields.featured) await demoteOtherFeatured(supabase, originalSlug);

  revalidateDirections(originalSlug);
  return {};
}

export async function deleteDirection(formData: FormData) {
  const supabase = await requireStaff();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  // Кейсы/отзывы не трогаем: их direction_slug — просто строка без FK,
  // поэтому удаление направления не рушит их структуру.
  await supabase.from("directions").delete().eq("slug", slug);
  revalidateDirections(slug);
}
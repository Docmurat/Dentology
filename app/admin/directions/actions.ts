"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { buildInsert, buildUpdate, pgErrorCode } from "@/lib/sql-helpers";
import { requireStaff } from "@/lib/auth-guards";
import { slugify } from "@/lib/slugify";

function revalidateDirections(slug?: string) {
  revalidatePath("/admin/directions");
  revalidatePath("/directions");
  if (slug) revalidatePath(`/directions/${slug}`);
  revalidatePath("/");
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
async function demoteOtherFeatured(keepSlug: string) {
  await query(
    `update directions set featured = false, collage_role = 'large'
      where collage_role = 'featured' and slug <> $1`,
    [keepSlug]
  );
}

export async function createDirection(
  formData: FormData
): Promise<{ error?: string }> {
  await requireStaff();

  const fields = readFields(formData);
  if (!fields.title) return { error: "Название обязательно" };

  const slug =
    slugify(String(formData.get("slug") || "")) ||
    slugify(fields.title) ||
    `direction-${Date.now()}`;

  if (fields.featured) await demoteOtherFeatured(slug);

  try {
    const { text, values } = buildInsert("directions", {
      slug,
      ...fields,
      archived: false,
    });
    await query(text, values);
  } catch (err) {
    if (pgErrorCode(err) === "23505")
      return { error: "Направление с таким slug уже существует" };
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  revalidateDirections(slug);
  return {};
}

export async function updateDirection(
  formData: FormData
): Promise<{ error?: string }> {
  await requireStaff();

  const originalSlug = String(formData.get("originalSlug") || "");
  if (!originalSlug) return { error: "Не указано направление для обновления" };

  const fields = readFields(formData);
  if (!fields.title) return { error: "Название обязательно" };

  // slug не меняем — к нему привязаны кейсы и отзывы.
  try {
    const { text, values } = buildUpdate(
      "directions",
      fields,
      "slug",
      originalSlug
    );
    await query(text, values);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Ошибка сохранения" };
  }

  if (fields.featured) await demoteOtherFeatured(originalSlug);

  revalidateDirections(originalSlug);
  return {};
}

// «Мягкое удаление»: направление архивируется, а не стирается.
export async function deleteDirection(formData: FormData) {
  await requireStaff();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  await query(
    `update directions set archived = true, featured = false, collage_role = 'small'
      where slug = $1`,
    [slug]
  );
  revalidateDirections(slug);
}

// Вернуть направление из архива.
export async function restoreDirection(formData: FormData) {
  await requireStaff();
  const slug = String(formData.get("slug") || "");
  if (!slug) return;

  await query(`update directions set archived = false where slug = $1`, [slug]);
  revalidateDirections(slug);
}
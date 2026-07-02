"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { getHomepageBlocks } from "@/lib/homepage";

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

function revalidateHomepage() {
  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

// Включить/выключить блок (добавить/убрать с главной).
export async function toggleHomepageBlock(formData: FormData) {
  const supabase = await requireStaff();
  const key = String(formData.get("key") || "");
  const enabled = formData.get("enabled") === "true";
  if (!key) return;

  // upsert: создаём строку, если её ещё не было (на случай не до конца засеянной таблицы).
  await supabase
    .from("homepage_blocks")
    .upsert({ block_key: key, enabled }, { onConflict: "block_key" });

  revalidateHomepage();
}

// Переместить блок вверх/вниз — меняем sort_order с соседом.
export async function moveHomepageBlock(formData: FormData) {
  const supabase = await requireStaff();
  const key = String(formData.get("key") || "");
  const dir = String(formData.get("dir") || ""); // "up" | "down"
  if (!key || (dir !== "up" && dir !== "down")) return;

  const blocks = await getHomepageBlocks();
  const i = blocks.findIndex((b) => b.key === key);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= blocks.length) return;

  const a = blocks[i];
  const b = blocks[j];

  // Гарантируем, что обе строки существуют, и меняем порядок местами.
  await supabase.from("homepage_blocks").upsert(
    [
      { block_key: a.key, sort_order: b.sortOrder, enabled: a.enabled },
      { block_key: b.key, sort_order: a.sortOrder, enabled: b.enabled },
    ],
    { onConflict: "block_key" }
  );

  revalidateHomepage();
}


// Сохранить контент блока Hero.
export async function saveHeroContent(formData: FormData) {
  const supabase = await requireStaff();

  const content = {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    subtitle: String(formData.get("subtitle") || "").trim(),
    card1Label: String(formData.get("card1Label") || "").trim(),
    card1Value: String(formData.get("card1Value") || "").trim(),
    card2Label: String(formData.get("card2Label") || "").trim(),
    card2Value: String(formData.get("card2Value") || "").trim(),
    photo: String(formData.get("photo") || "").trim(),
    quote: String(formData.get("quote") || "").trim(),
    quoteCaption: String(formData.get("quoteCaption") || "").trim(),
  };

  await supabase
    .from("homepage_content")
    .upsert({ block_key: "hero", content }, { onConflict: "block_key" });

  revalidateHomepage();
}


// Сохранить контент блока «О Dentology».
export async function saveAboutContent(formData: FormData) {
  const supabase = await requireStaff();

  const content = {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    text1: String(formData.get("text1") || "").trim(),
    text2: String(formData.get("text2") || "").trim(),
  };

  await supabase
    .from("homepage_content")
    .upsert({ block_key: "about", content }, { onConflict: "block_key" });

  revalidateHomepage();
}


// Сохранить контент блока «Когда стоит обратиться».
export async function saveWhenContent(formData: FormData) {
  const supabase = await requireStaff();

  // items приходят JSON-строкой из клиентского редактора (динамический список).
  let items: { title: string; text: string }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("items") || "[]"));
    if (Array.isArray(parsed)) {
      items = parsed
        .map((it) => ({
          title: String(it?.title || "").trim(),
          text: String(it?.text || "").trim(),
        }))
        .filter((it) => it.title || it.text);
    }
  } catch {
    items = [];
  }

  const content = {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    items,
  };

  await supabase
    .from("homepage_content")
    .upsert({ block_key: "when_to_apply", content }, { onConflict: "block_key" });

  revalidateHomepage();
}


// Сохранить контент блока «Почему Dentology».
export async function saveWhyContent(formData: FormData) {
  const supabase = await requireStaff();

  let items: { title: string; text: string; icon: string }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("items") || "[]"));
    if (Array.isArray(parsed)) {
      items = parsed
        .map((it) => ({
          title: String(it?.title || "").trim(),
          text: String(it?.text || "").trim(),
          icon: String(it?.icon || "team").trim(),
        }))
        .filter((it) => it.title || it.text);
    }
  } catch {
    items = [];
  }

  const content = {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    items,
  };

  await supabase
    .from("homepage_content")
    .upsert({ block_key: "why", content }, { onConflict: "block_key" });

  revalidateHomepage();
}


// Сохранить заголовок блока с собственной механикой (directions/cases/team/reviews).
export async function saveSectionHeadingContent(formData: FormData) {
  const supabase = await requireStaff();

  const blockKey = String(formData.get("blockKey") || "").trim();
  const allowed = ["directions", "cases", "team", "reviews"];
  if (!allowed.includes(blockKey)) return;

  const content = {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
  };

  await supabase
    .from("homepage_content")
    .upsert({ block_key: blockKey, content }, { onConflict: "block_key" });

  revalidateHomepage();
}


// Сохранить контент блока «Обучение».
export async function saveEducationContent(formData: FormData) {
  const supabase = await requireStaff();

  let bullets: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("bullets") || "[]"));
    if (Array.isArray(parsed)) {
      bullets = parsed.map((b) => String(b || "").trim()).filter(Boolean);
    }
  } catch {
    bullets = [];
  }

  const content = {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    badge: String(formData.get("badge") || "").trim(),
    bullets,
    primaryLabel: String(formData.get("primaryLabel") || "").trim(),
    secondaryLabel: String(formData.get("secondaryLabel") || "").trim(),
  };

  await supabase
    .from("homepage_content")
    .upsert({ block_key: "education", content }, { onConflict: "block_key" });

  revalidateHomepage();
}

// Сохранить контент блока CTA.
export async function saveCtaContent(formData: FormData) {
  const supabase = await requireStaff();

  const content = {
    title: String(formData.get("title") || "").trim(),
    text1: String(formData.get("text1") || "").trim(),
    text2: String(formData.get("text2") || "").trim(),
    primaryLabel: String(formData.get("primaryLabel") || "").trim(),
    secondaryLabel: String(formData.get("secondaryLabel") || "").trim(),
  };

  await supabase
    .from("homepage_content")
    .upsert({ block_key: "cta", content }, { onConflict: "block_key" });

  revalidateHomepage();
}
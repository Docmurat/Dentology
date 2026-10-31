"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { requireStaff } from "@/lib/auth-guards";
import { getHomepageBlocks } from "@/lib/homepage";
import { normalizeEndoStage, type EndoStage } from "@/lib/endo-prices";

function revalidateHomepage() {
  revalidatePath("/");
  revalidatePath("/admin/homepage");
}

// Цена, длительность и шаги консультации показываются не только на
// главной: под кнопками записи, в контактах, на страницах направлений
// и ситуаций. Обновляем всё сразу, иначе старая цена провисит минуту.
function revalidateEverywhere() {
  revalidatePath("/", "layout");
}

// Сохранить контент блока (upsert по block_key).
async function saveBlockContent(blockKey: string, content: unknown) {
  await query(
    `insert into homepage_content (block_key, content)
     values ($1, $2::jsonb)
     on conflict (block_key) do update
       set content = excluded.content, updated_at = now()`,
    [blockKey, JSON.stringify(content)]
  );
}

// Включить/выключить блок (добавить/убрать с главной).
export async function toggleHomepageBlock(formData: FormData) {
  await requireStaff();
  const key = String(formData.get("key") || "");
  const enabled = formData.get("enabled") === "true";
  if (!key) return;

  // Порядок передаём явно. У блока, добавленного в код позже, строки
  // в базе ещё нет: вставка без sort_order дала бы 0, и блок прыгнул бы
  // выше первого экрана. Существующей строке порядок не меняем.
  const current = (await getHomepageBlocks()).find((b) => b.key === key);

  await query(
    `insert into homepage_blocks (block_key, enabled, sort_order)
     values ($1, $2, $3)
     on conflict (block_key) do update
       set enabled = excluded.enabled, updated_at = now()`,
    [key, enabled, current?.sortOrder ?? 0]
  );

  revalidateHomepage();
}

// Переместить блок вверх/вниз — меняем sort_order с соседом.
export async function moveHomepageBlock(formData: FormData) {
  await requireStaff();
  const key = String(formData.get("key") || "");
  const dir = String(formData.get("dir") || ""); // "up" | "down"
  if (!key || (dir !== "up" && dir !== "down")) return;

  const blocks = await getHomepageBlocks();
  const i = blocks.findIndex((b) => b.key === key);
  const j = dir === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= blocks.length) return;

  // Меняем блоки местами и нумеруем весь список заново.
  //
  // Раньше местами менялись только два числа sort_order. Это ломалось,
  // когда числа совпадали: у блока, добавленного в код позже, строки
  // в базе ещё нет, и его порядок считается по умолчанию — он может
  // совпасть с соседом, и «обмен» ничего не менял. Сплошная нумерация
  // убирает совпадения раз и навсегда.
  const ordered = [...blocks];
  [ordered[i], ordered[j]] = [ordered[j], ordered[i]];

  const upsert = `insert into homepage_blocks (block_key, enabled, sort_order)
                  values ($1, $2, $3)
                  on conflict (block_key) do update
                    set enabled = excluded.enabled,
                        sort_order = excluded.sort_order,
                        updated_at = now()`;
  for (const [index, block] of ordered.entries()) {
    await query(upsert, [block.key, block.enabled, index + 1]);
  }

  revalidateHomepage();
}

// Сохранить контент блока Hero.
export async function saveHeroContent(formData: FormData) {
  await requireStaff();

  await saveBlockContent("hero", {
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
  });

  revalidateHomepage();
}

// Сохранить контент блока «О Lucenta».
export async function saveAboutContent(formData: FormData) {
  await requireStaff();

  await saveBlockContent("about", {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    text1: String(formData.get("text1") || "").trim(),
    text2: String(formData.get("text2") || "").trim(),
  });

  revalidateHomepage();
}

// Сохранить контент блока «Когда стоит обратиться».
export async function saveWhenContent(formData: FormData) {
  await requireStaff();

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

  await saveBlockContent("when_to_apply", {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    items,
  });

  revalidateHomepage();
}

// Сохранить контент блока «Почему Lucenta».
export async function saveWhyContent(formData: FormData) {
  await requireStaff();

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

  await saveBlockContent("why", {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    items,
  });

  revalidateHomepage();
}

// Сохранить заголовок блока с собственной механикой.
export async function saveSectionHeadingContent(formData: FormData) {
  await requireStaff();

  const blockKey = String(formData.get("blockKey") || "").trim();
  const allowed = ["directions", "cases", "team", "reviews"];
  if (!allowed.includes(blockKey)) return;

  await saveBlockContent(blockKey, {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
  });

  revalidateHomepage();
}

// Сохранить контент блока «Обучение».
export async function saveEducationContent(formData: FormData) {
  await requireStaff();

  let bullets: string[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("bullets") || "[]"));
    if (Array.isArray(parsed)) {
      bullets = parsed.map((b) => String(b || "").trim()).filter(Boolean);
    }
  } catch {
    bullets = [];
  }

  await saveBlockContent("education", {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    badge: String(formData.get("badge") || "").trim(),
    bullets,
    primaryLabel: String(formData.get("primaryLabel") || "").trim(),
    secondaryLabel: String(formData.get("secondaryLabel") || "").trim(),
  });

  revalidateHomepage();
}

// Сохранить контент блока CTA.
export async function saveCtaContent(formData: FormData) {
  await requireStaff();

  await saveBlockContent("cta", {
    title: String(formData.get("title") || "").trim(),
    text1: String(formData.get("text1") || "").trim(),
    text2: String(formData.get("text2") || "").trim(),
    primaryLabel: String(formData.get("primaryLabel") || "").trim(),
    secondaryLabel: String(formData.get("secondaryLabel") || "").trim(),
  });

  revalidateHomepage();
}

// Сохранить контент блока «Информационная плашка».
export async function savePromoContent(formData: FormData) {
  await requireStaff();

  await saveBlockContent("promo", {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    text: String(formData.get("text") || "").trim(),
    linkLabel: String(formData.get("linkLabel") || "").trim(),
    linkHref: String(formData.get("linkHref") || "").trim(),
  });

  revalidateHomepage();
}

// Сохранить блок «Как проходит консультация».
export async function saveConsultationContent(formData: FormData) {
  await requireStaff();

  let steps: { title: string; text: string }[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("steps") || "[]"));
    if (Array.isArray(parsed)) {
      steps = parsed
        .map((it) => ({
          title: String(it?.title || "").trim(),
          text: String(it?.text || "").trim(),
        }))
        .filter((it) => it.title || it.text);
    }
  } catch {
    steps = [];
  }

  // Список «что взять с собой» — по пункту на строку.
  const bring = String(formData.get("bring") || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  await saveBlockContent("consultation", {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    price: String(formData.get("price") || "").trim(),
    duration: String(formData.get("duration") || "").trim(),
    responseNote: String(formData.get("responseNote") || "").trim(),
    steps,
    bringTitle: String(formData.get("bringTitle") || "").trim(),
    bring,
  });

  revalidateHomepage();
  revalidateEverywhere();
}


// Сохранить блок «Этапы и стоимость лечения каналов».
export async function saveEndoPricesContent(formData: FormData) {
  await requireStaff();

  let stages: EndoStage[] = [];
  try {
    const parsed = JSON.parse(String(formData.get("stages") || "[]"));
    if (Array.isArray(parsed)) {
      stages = parsed
        .map((it) => normalizeEndoStage(it))
        .filter((it): it is EndoStage => it !== null);
    }
  } catch {
    stages = [];
  }

  const notes = String(formData.get("notes") || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  await saveBlockContent("endo_prices", {
    eyebrow: String(formData.get("eyebrow") || "").trim(),
    title: String(formData.get("title") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    stages,
    notes,
  });

  revalidateHomepage();
  revalidateEverywhere();
}

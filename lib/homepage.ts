import { query, queryOne } from "@/lib/db";
import { PRIMARY_CTA_LABEL } from "@/lib/constants";

// Внутренний хелпер: контент блока из homepage_content по ключу (или null).
async function getBlockContent<T>(blockKey: string): Promise<Partial<T> | null> {
  try {
    const row = await queryOne<{ content: Partial<T> | null }>(
      `select content from homepage_content where block_key = $1`,
      [blockKey]
    );
    return row?.content ?? null;
  } catch {
    return null;
  }
}

export type HomepageBlock = {
  key: string;
  title: string;
  enabled: boolean;
  sortOrder: number;
};

export const HOMEPAGE_BLOCK_DEFS: {
  key: string;
  title: string;
  enabledByDefault?: boolean;
}[] = [
  { key: "hero", title: "Hero — первый экран" },
  { key: "about", title: "О Lucenta" },
  { key: "when_to_apply", title: "Когда стоит обратиться" },
  { key: "directions", title: "Клинические направления" },
  { key: "why", title: "Почему Lucenta" },
  { key: "cases", title: "Клинические случаи" },
  { key: "team", title: "Команда" },
  { key: "reviews", title: "Отзывы" },
  { key: "education", title: "Обучение" },
  { key: "consultation", title: "Как проходит консультация" },
  { key: "cta", title: "Призыв к действию" },
  {
    key: "promo",
    title: "Информационная плашка (акция / новость)",
    enabledByDefault: false,
  },
];

function defaults(): HomepageBlock[] {
  return HOMEPAGE_BLOCK_DEFS.map((d, i) => ({
    key: d.key,
    title: d.title,
    enabled: d.enabledByDefault ?? true,
    sortOrder: i + 1,
  }));
}

export async function getHomepageBlocks(): Promise<HomepageBlock[]> {
  try {
    const rows = await query<{
      block_key: string;
      enabled: boolean;
      sort_order: number;
    }>(`select block_key, enabled, sort_order from homepage_blocks`);

    if (!rows.length) return defaults();

    const byKey = new Map(rows.map((r) => [r.block_key, r]));

    return HOMEPAGE_BLOCK_DEFS.map((d, i) => {
      const row = byKey.get(d.key);
      return {
        key: d.key,
        title: d.title,
        enabled: row?.enabled ?? d.enabledByDefault ?? true,
        sortOrder: row?.sort_order ?? i + 1,
      };
    }).sort((a, b) => a.sortOrder - b.sortOrder);
  } catch {
    return defaults();
  }
}

export async function getEnabledHomepageBlocks(): Promise<HomepageBlock[]> {
  return (await getHomepageBlocks()).filter((b) => b.enabled);
}

// ── Hero ──
export type HeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  card1Label: string;
  card1Value: string;
  card2Label: string;
  card2Value: string;
  photo: string;
  quote: string;
  quoteCaption: string;
};

export const HERO_DEFAULTS: HeroContent = {
  eyebrow: "Экспертная стоматологическая практика",
  title: "Вам сказали удалять зуб? Сначала проверим, можно ли его сохранить",
  subtitle:
    "Ведущая экспертиза в сложной эндодонтии, дополненная имплантацией, ортодонтией и гнатологией как частью комплексного подхода к лечению.",
  card1Label: "Основной фокус",
  card1Value: "Сложная эндодонтия",
  card2Label: "Подход",
  card2Value: "Диагностика и системное лечение",
  photo: "/hero-doctor.jpg",
  quote:
    "В ряде случаев зуб можно сохранить, даже если ранее рекомендовано удаление",
  quoteCaption: "Курджиев Мурат",
};

export async function getHeroContent(): Promise<HeroContent> {
  const c = await getBlockContent<HeroContent>("hero");
  if (!c) return HERO_DEFAULTS;
  return {
    eyebrow: c.eyebrow ?? HERO_DEFAULTS.eyebrow,
    title: c.title ?? HERO_DEFAULTS.title,
    subtitle: c.subtitle ?? HERO_DEFAULTS.subtitle,
    card1Label: c.card1Label ?? HERO_DEFAULTS.card1Label,
    card1Value: c.card1Value ?? HERO_DEFAULTS.card1Value,
    card2Label: c.card2Label ?? HERO_DEFAULTS.card2Label,
    card2Value: c.card2Value ?? HERO_DEFAULTS.card2Value,
    photo: c.photo || HERO_DEFAULTS.photo,
    quote: c.quote ?? HERO_DEFAULTS.quote,
    quoteCaption: c.quoteCaption ?? HERO_DEFAULTS.quoteCaption,
  };
}

// ── О Lucenta ──
export type AboutContent = { eyebrow: string; text1: string; text2: string };

export const ABOUT_DEFAULTS: AboutContent = {
  eyebrow: "Lucenta",
  text1:
    "Lucenta — это команда врачей и система клинического мышления, где решение принимается не по шаблону, а на основе диагностики и реальной клинической картины.",
  text2:
    "В основе — стремление сохранить зуб и минимизировать вмешательство.",
};

export async function getAboutContent(): Promise<AboutContent> {
  const c = await getBlockContent<AboutContent>("about");
  if (!c) return ABOUT_DEFAULTS;
  return {
    eyebrow: c.eyebrow ?? ABOUT_DEFAULTS.eyebrow,
    text1: c.text1 ?? ABOUT_DEFAULTS.text1,
    text2: c.text2 ?? ABOUT_DEFAULTS.text2,
  };
}

// ── Когда стоит обратиться ──
export type WhenItem = { title: string; text: string };
export type WhenContent = {
  eyebrow: string;
  title: string;
  description: string;
  items: WhenItem[];
};

export const WHEN_DEFAULTS: WhenContent = {
  eyebrow: "Когда стоит обратиться",
  title: "Ситуации, с которыми чаще всего приходят пациенты",
  description:
    "Большинство обращений связано с уже существующими проблемами после лечения или сложными клиническими случаями.",
  items: [
    {
      title: "Рекомендовано удаление",
      text: "Вам уже предложили удалить зуб, но вы хотите рассмотреть возможность его сохранения.",
    },
    {
      title: "Боль после лечения",
      text: "После лечения корневых каналов боль сохраняется или возвращается.",
    },
    {
      title: "Хроническое воспаление",
      text: "Воспаление не проходит длительное время или периодически обостряется.",
    },
    {
      title: "Сложный случай",
      text: "Ранее вам говорили, что случай сложный или отказывались от лечения.",
    },
  ],
};

export async function getWhenContent(): Promise<WhenContent> {
  const c = await getBlockContent<WhenContent>("when_to_apply");
  if (!c) return WHEN_DEFAULTS;
  const items = Array.isArray(c.items) ? c.items : WHEN_DEFAULTS.items;
  return {
    eyebrow: c.eyebrow ?? WHEN_DEFAULTS.eyebrow,
    title: c.title ?? WHEN_DEFAULTS.title,
    description: c.description ?? WHEN_DEFAULTS.description,
    items,
  };
}

// ── Почему Lucenta ──
export type WhyItem = { title: string; text: string; icon: string };
export type WhyContent = {
  eyebrow: string;
  title: string;
  description: string;
  items: WhyItem[];
};

export const WHY_DEFAULTS: WhyContent = {
  eyebrow: "Почему Lucenta",
  title:
    "Основа подхода — точная диагностика, клиническое мышление и системное лечение",
  description: "",
  items: [
    {
      title: "Экспертная команда",
      text: "К лечению привлекаются специалисты в зависимости от клинической задачи и логики общего плана.",
      icon: "team",
    },
    {
      title: "Современные методики",
      text: "Решения принимаются на основе актуального клинического подхода, диагностики и точности исполнения.",
      icon: "method",
    },
    {
      title: "Академический подход",
      text: "Образовательное направление и работа с врачами усиливают уровень клинического мышления внутри практики.",
      icon: "academic",
    },
    {
      title: "Реальная практика",
      text: "Основа доверия — не рекламные обещания, а клинические случаи и ежедневная работа со сложными ситуациями.",
      icon: "practice",
    },
  ],
};

export async function getWhyContent(): Promise<WhyContent> {
  const c = await getBlockContent<WhyContent>("why");
  if (!c) return WHY_DEFAULTS;
  const items = Array.isArray(c.items) ? c.items : WHY_DEFAULTS.items;
  return {
    eyebrow: c.eyebrow ?? WHY_DEFAULTS.eyebrow,
    title: c.title ?? WHY_DEFAULTS.title,
    description: c.description ?? WHY_DEFAULTS.description,
    items,
  };
}

// ── Заголовки блоков с собственной механикой ──
export type SectionHeadingContent = {
  eyebrow: string;
  title: string;
  description: string;
};

export const SECTION_HEADING_DEFAULTS: Record<string, SectionHeadingContent> = {
  directions: {
    eyebrow: "Клинические направления",
    title: "Что мы лечим",
    description:
      "Эндодонтия является ключевым направлением, но лечение всегда рассматривается в контексте общей клинической картины.",
  },
  cases: {
    eyebrow: "Клинические случаи",
    title: "Зубы, которые удалось сохранить",
    description:
      "Кейсы, где ранее рекомендовали удаление, отказывали в лечении или не удавалось добиться стабильного результата.",
  },
  team: {
    eyebrow: "Клиническая команда",
    title: "Кто будет вас лечить",
    description:
      "Lucenta объединяет ведущих специалистов разных направлений, работающих в рамках единой системы клинического мышления и принятия решений.",
  },
  reviews: {
    eyebrow: "Отзывы",
    title: "Что говорят пациенты после лечения",
    description:
      "Отзывы дополняют клинические случаи и помогают понять, как пациенты воспринимают процесс лечения, диагностику и коммуникацию.",
  },
};

export async function getSectionHeadingContent(
  key: string
): Promise<SectionHeadingContent> {
  const fallback =
    SECTION_HEADING_DEFAULTS[key] ?? { eyebrow: "", title: "", description: "" };
  const c = await getBlockContent<SectionHeadingContent>(key);
  if (!c) return fallback;
  return {
    eyebrow: c.eyebrow ?? fallback.eyebrow,
    title: c.title ?? fallback.title,
    description: c.description ?? fallback.description,
  };
}

// ── Обучение ──
export type EducationContent = {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  bullets: string[];
  primaryLabel: string;
  secondaryLabel: string;
};

export const EDUCATION_DEFAULTS: EducationContent = {
  eyebrow: "Обучение",
  title: "Образовательное направление для врачей",
  description: "Курсы для врачей стоматологов",
  badge: "Lucenta Обучение",
  bullets: [
    "смешанный формат обучения",
    "клинические кейсы и реальная практика",
    "академичная и спокойная подача материала",
  ],
  primaryLabel: "Смотреть обучение",
  secondaryLabel: "Оставить заявку",
};

export async function getEducationContent(): Promise<EducationContent> {
  const c = await getBlockContent<EducationContent>("education");
  if (!c) return EDUCATION_DEFAULTS;
  const bullets = Array.isArray(c.bullets) ? c.bullets : EDUCATION_DEFAULTS.bullets;
  return {
    eyebrow: c.eyebrow ?? EDUCATION_DEFAULTS.eyebrow,
    title: c.title ?? EDUCATION_DEFAULTS.title,
    description: c.description ?? EDUCATION_DEFAULTS.description,
    badge: c.badge ?? EDUCATION_DEFAULTS.badge,
    bullets,
    primaryLabel: c.primaryLabel ?? EDUCATION_DEFAULTS.primaryLabel,
    secondaryLabel: c.secondaryLabel ?? EDUCATION_DEFAULTS.secondaryLabel,
  };
}

// ── CTA ──
export type CtaContent = {
  title: string;
  text1: string;
  text2: string;
  primaryLabel: string;
  secondaryLabel: string;
};

export const CTA_DEFAULTS: CtaContent = {
  title: "Запись на консультацию",
  text1:
    "Консультация позволяет оценить клиническую ситуацию, подтвердить диагноз и определить возможные варианты лечения.",
  text2:
    "В ряде случаев возможно сохранить зуб даже при ранее рекомендованном удалении.",
  primaryLabel: PRIMARY_CTA_LABEL,
  secondaryLabel: "Перейти к контактам",
};

export async function getCtaContent(): Promise<CtaContent> {
  const c = await getBlockContent<CtaContent>("cta");
  if (!c) return CTA_DEFAULTS;
  return {
    title: c.title ?? CTA_DEFAULTS.title,
    text1: c.text1 ?? CTA_DEFAULTS.text1,
    text2: c.text2 ?? CTA_DEFAULTS.text2,
    primaryLabel: c.primaryLabel ?? CTA_DEFAULTS.primaryLabel,
    secondaryLabel: c.secondaryLabel ?? CTA_DEFAULTS.secondaryLabel,
  };
}

// ── Информационная плашка (промо) ──
export type PromoContent = {
  eyebrow: string;
  text: string;
  linkLabel: string;
  linkHref: string;
};

export const PROMO_DEFAULTS: PromoContent = {
  eyebrow: "Важно",
  text: "Здесь может быть информация об акции или срочная новость для пациентов.",
  linkLabel: "Подробнее",
  linkHref: "/contacts",
};

export async function getPromoContent(): Promise<PromoContent> {
  const c = await getBlockContent<PromoContent>("promo");
  if (!c) return PROMO_DEFAULTS;
  return {
    eyebrow: c.eyebrow ?? PROMO_DEFAULTS.eyebrow,
    text: c.text ?? PROMO_DEFAULTS.text,
    linkLabel: c.linkLabel ?? PROMO_DEFAULTS.linkLabel,
    linkHref: c.linkHref ?? PROMO_DEFAULTS.linkHref,
  };
}

// ── Как проходит консультация ──
// Цена и длительность намеренно пустые по умолчанию: пока их не заполнили
// в админке, сайт их просто не показывает. Выдуманная цена хуже её
// отсутствия.
export type ConsultationStep = { title: string; text: string };
export type ConsultationContent = {
  eyebrow: string;
  title: string;
  description: string;
  /** Например «3 000 ₽». Пусто — цена не показывается. */
  price: string;
  /** Например «40 минут». Пусто — длительность не показывается. */
  duration: string;
  /** Срок ответа на заявку: «Ответим в течение дня». */
  responseNote: string;
  steps: ConsultationStep[];
  bringTitle: string;
  bring: string[];
};

export const CONSULTATION_DEFAULTS: ConsultationContent = {
  eyebrow: "Консультация",
  title: "Как проходит консультация",
  description:
    "Начать можно без визита: пришлите снимок, и врач скажет, есть ли смысл рассматривать сохранение зуба.",
  price: "",
  duration: "",
  responseNote: "Ответим в течение дня",
  steps: [
    {
      title: "Вы отправляете снимок",
      text: "Прикрепите к заявке прицельный снимок, панорамный снимок или страницы заключения КТ. Снимка нет — просто опишите ситуацию.",
    },
    {
      title: "Предварительная оценка",
      text: "Врач смотрит снимок и отвечает, есть ли шанс сохранить зуб. Это ориентир, а не диагноз: решение принимается на очном приёме.",
    },
    {
      title: "Очная консультация",
      text: "Осмотр, разбор снимков и, если нужно, дополнительная диагностика.",
    },
    {
      title: "План лечения",
      text: "Вы получаете варианты лечения с этапами, сроками и стоимостью и решаете, как действовать дальше.",
    },
  ],
  bringTitle: "Что взять с собой",
  bring: [
    "Снимки и КТ, если они есть: на диске, флешке или ссылкой",
    "Выписки и заключения по прошлому лечению",
    "Паспорт для оформления договора",
  ],
};

export async function getConsultationContent(): Promise<ConsultationContent> {
  const d = CONSULTATION_DEFAULTS;
  const c = await getBlockContent<ConsultationContent>("consultation");
  if (!c) return d;
  return {
    eyebrow: c.eyebrow ?? d.eyebrow,
    title: c.title ?? d.title,
    description: c.description ?? d.description,
    price: c.price ?? d.price,
    duration: c.duration ?? d.duration,
    responseNote: c.responseNote ?? d.responseNote,
    steps: Array.isArray(c.steps) ? c.steps : d.steps,
    bringTitle: c.bringTitle ?? d.bringTitle,
    bring: Array.isArray(c.bring) ? c.bring : d.bring,
  };
}

/**
 * Строка под кнопкой записи: «Ответим в течение дня. Консультация: 3 000 ₽,
 * 40 минут». Собирается только из заполненных частей; если пусто всё —
 * возвращает пустую строку, и подпись не рисуется.
 */
export function consultationCaption(
  c: Pick<ConsultationContent, "price" | "duration" | "responseNote">
): string {
  const parts: string[] = [];
  const note = c.responseNote.trim().replace(/\.+$/, "");
  if (note) parts.push(`${note}.`);

  const facts = [c.price.trim(), c.duration.trim()].filter(Boolean);
  if (facts.length) parts.push(`Консультация: ${facts.join(", ")}`);

  return parts.join(" ");
}

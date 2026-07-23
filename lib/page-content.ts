import { queryOne } from "@/lib/db";

export type PageHeading = {
  eyebrow: string;
  title: string;
  description: string;
};

export const PAGE_HEADING_KEYS = ["cases", "team", "reviews", "education"] as const;
export type PageHeadingKey = (typeof PAGE_HEADING_KEYS)[number];

export const PAGE_HEADING_DEFAULTS: Record<PageHeadingKey, PageHeading> = {
  cases: {
    eyebrow: "Клинические случаи",
    title: "Реальные кейсы, в которых стандартного подхода было недостаточно",
    description:
      "Клинические разборы, показывающие не рекламный результат, а логику принятия решений, диагностику и возможность сохранения зубов в сложных ситуациях.",
  },
  team: {
    eyebrow: "Команда",
    title: "Клиническая команда Lucenta",
    description:
      "Сложные случаи требуют междисциплинарного подхода. Над планом лечения работают специалисты разных направлений в рамках единой системы принятия решений.",
  },
  reviews: {
    eyebrow: "Отзывы",
    title: "Отзывы пациентов",
    description:
      "Реальные впечатления пациентов после консультации и лечения. Можно отфильтровать отзывы по направлениям.",
  },
  education: {
    eyebrow: "Обучение",
    title: "Образовательное направление Lucenta",
    description: "Курсы для врачей стоматологов",
  },
};

const STORAGE_PREFIX = "page_";

export function pageHeadingStorageKey(key: PageHeadingKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

export async function getPageHeading(key: PageHeadingKey): Promise<PageHeading> {
  const fallback = PAGE_HEADING_DEFAULTS[key];
  try {
    const row = await queryOne<{ content: Partial<PageHeading> | null }>(
      `select content from homepage_content where block_key = $1`,
      [pageHeadingStorageKey(key)]
    );
    if (!row?.content) return fallback;
    const c = row.content;
    return {
      eyebrow: c.eyebrow ?? fallback.eyebrow,
      title: c.title ?? fallback.title,
      description: c.description ?? fallback.description,
    };
  } catch {
    return fallback;
  }
}
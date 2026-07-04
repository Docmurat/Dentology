import { createPublicClient } from "@/lib/supabase-public";

export type PageHeading = {
  eyebrow: string;
  title: string;
  description: string;
};

// Ключи страниц (хранятся в homepage_content как page_<key>).
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
    title: "Клиническая команда Dentology",
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
    title: "Образовательное направление Dentology",
    description: "Курсы для врачей стоматологов",
  },
};

const STORAGE_PREFIX = "page_";

export function pageHeadingStorageKey(key: PageHeadingKey): string {
  return `${STORAGE_PREFIX}${key}`;
}

/** Заголовок страницы: из БД поверх дефолтов по ключу. */
export async function getPageHeading(key: PageHeadingKey): Promise<PageHeading> {
  const fallback = PAGE_HEADING_DEFAULTS[key];
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("homepage_content")
      .select("content")
      .eq("block_key", pageHeadingStorageKey(key))
      .maybeSingle();

    if (error || !data?.content) return fallback;
    const c = data.content as Partial<PageHeading>;
    return {
      eyebrow: c.eyebrow ?? fallback.eyebrow,
      title: c.title ?? fallback.title,
      description: c.description ?? fallback.description,
    };
  } catch {
    return fallback;
  }
}
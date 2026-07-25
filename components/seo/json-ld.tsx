// components/seo/json-ld.tsx
import { COMPANY } from "@/lib/company";

const SITE = "https://lucenta.ru";

// Рендерит блок структурированных данных (schema.org) в разметку страницы.
// data — наши собственные данные, поэтому безопасно; < экранируем на всякий случай.
export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Record<string, unknown>[];
}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

// Клиника (Dentist / LocalBusiness) — общий блок сайта.
export function dentistJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Dentist",
    "@id": `${SITE}/#dentist`,
    name: "Lucenta",
    legalName: COMPANY.fullName,
    url: SITE,
    telephone: COMPANY.phone,
    email: COMPANY.email,
    image: `${SITE}/logo-master.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Ленинская Слобода, д. 4",
      addressLocality: "Москва",
      addressCountry: "RU",
    },
    areaServed: "RU",
    medicalSpecialty: "Dentistry",
  };
}

// Врач (Physician) — на странице врача.
export function physicianJsonLd(opts: {
  name: string;
  slug: string;
  position?: string;
  description?: string;
  image?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: opts.name,
    url: `${SITE}/team/${opts.slug}`,
    medicalSpecialty: "Dentistry",
    worksFor: {
      "@type": "Dentist",
      "@id": `${SITE}/#dentist`,
      name: "Lucenta",
    },
    ...(opts.position ? { jobTitle: opts.position } : {}),
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: opts.image } : {}),
  };
}

// Клинический случай (MedicalWebPage) — на странице кейса.
export function caseJsonLd(opts: {
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    name: opts.title,
    url: `${SITE}/cases/${opts.slug}`,
    inLanguage: "ru-RU",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "Lucenta",
      url: SITE,
    },
    about: {
      "@type": "Dentist",
      "@id": `${SITE}/#dentist`,
      name: "Lucenta",
    },
    ...(opts.excerpt ? { description: opts.excerpt } : {}),
    ...(opts.image ? { image: opts.image } : {}),
  };
}

/**
 * Цена формата обучения в форме, пригодной для schema.org.
 *
 * В базе это свободный текст: «150 000 ₽», «по запросу», «от 90 000».
 * Отдаём число только когда уверены: есть цифры и нет слов, означающих
 * неопределённость. Неверная цена в разметке хуже её отсутствия.
 */
function parsePrice(raw: string): number | null {
  const text = raw.toLowerCase();
  if (/запрос|договор|индивидуальн|от\s/.test(text)) return null;

  const digits = text.replace(/[^\d]/g, "");
  if (!digits) return null;

  const value = Number(digits);
  return Number.isFinite(value) && value > 0 ? value : null;
}

// Курс (Course) — на странице курса.
export function courseJsonLd(opts: {
  title: string;
  slug: string;
  description?: string;
  image?: string;
  instructorName?: string | null;
  instructorSlug?: string | null;
  formats?: { type: string; price: string }[];
}): Record<string, unknown> {
  const offers = (opts.formats ?? [])
    .map((f) => ({ name: f.type, price: parsePrice(f.price) }))
    .filter((o): o is { name: string; price: number } => o.price !== null)
    .map((o) => ({
      "@type": "Offer",
      name: o.name,
      price: o.price,
      priceCurrency: "RUB",
      category: "Professional education",
    }));

  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: opts.title,
    url: `${SITE}/education/${opts.slug}`,
    inLanguage: "ru-RU",
    provider: {
      "@type": "Dentist",
      "@id": `${SITE}/#dentist`,
      name: "Lucenta",
    },
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.image ? { image: opts.image } : {}),
    ...(opts.instructorName
      ? {
          instructor: {
            "@type": "Person",
            name: opts.instructorName,
            ...(opts.instructorSlug
              ? { url: `${SITE}/team/${opts.instructorSlug}` }
              : {}),
          },
        }
      : {}),
    ...(offers.length ? { offers } : {}),
  };
}

/**
 * Блок вопросов и ответов (FAQPage).
 *
 * Google с 2023 года показывает расширенный сниппет FAQ только для
 * государственных и медицинских сайтов из своего списка, так что на
 * богатый результат в нём рассчитывать не стоит. Разметка всё равно
 * полезна: её читают Яндекс и голосовые ассистенты, и она делает
 * содержимое страницы машинно-понятным.
 */
export function faqJsonLd(
  items: { question: string; answer: string }[]
): Record<string, unknown> | null {
  const clean = items
    .map((i) => ({
      question: i.question?.trim() ?? "",
      answer: i.answer?.trim() ?? "",
    }))
    .filter((i) => i.question && i.answer);

  if (!clean.length) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: clean.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: i.answer,
      },
    })),
  };
}
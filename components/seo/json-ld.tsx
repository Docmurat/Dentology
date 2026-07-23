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
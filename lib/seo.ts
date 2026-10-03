// lib/seo.ts
import type { Metadata } from "next";

/**
 * Open Graph для страницы.
 *
 * Метаданные в Next сливаются неглубоко: стоит странице задать свой
 * openGraph — и картинка, имя сайта и локаль из корневого layout пропадают.
 * Поэтому общие поля добавляются здесь, а страница передаёт только своё.
 */
export function pageOpenGraph(page: {
  title: string;
  description?: string;
  url: string;
  type?: "website" | "article";
}): NonNullable<Metadata["openGraph"]> {
  return {
    title: page.title,
    description: page.description,
    url: page.url,
    type: page.type ?? "website",
    siteName: "Lucenta",
    locale: "ru_RU",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Lucenta — стоматология",
      },
    ],
  };
}

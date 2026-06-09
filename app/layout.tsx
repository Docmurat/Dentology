import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dentology.ru"),
  title: {
    default: "Dentology",
    template: "%s | Dentology",
  },
  description:
    "Стоматологическая практика с ведущей экспертизой в сложной эндодонтии, комплексным подходом к лечению и образовательным направлением для врачей.",
  keywords: [
    "стоматология Москва",
    "эндодонтия",
    "сложная эндодонтия",
    "лечение корневых каналов",
    "киста зуба",
    "имплантация",
    "ортодонтия",
    "гнатология",
    "Dentology",
  ],
  openGraph: {
    title: "Dentology",
    description:
      "Стоматологическая практика с ведущей экспертизой в сложной эндодонтии и комплексным подходом к лечению.",
    url: "https://dentology.ru",
    siteName: "Dentology",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Dentology",
    description:
      "Стоматологическая практика с ведущей экспертизой в сложной эндодонтии и комплексным подходом к лечению.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
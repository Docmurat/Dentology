import type { Metadata } from "next";
import "./globals.css";
import { CookieBanner } from "@/components/legal/cookie-banner";
import { JsonLd, dentistJsonLd } from "@/components/seo/json-ld";
import { AuthProvider } from "@/components/layout/auth-provider";

export const metadata: Metadata = {
  metadataBase: new URL("https://lucenta.ru"),
  title: {
    default: "Lucenta",
    template: "%s | Lucenta",
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
    "Lucenta",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Lucenta",
    description:
      "Стоматологическая практика с ведущей экспертизой в сложной эндодонтии и комплексным подходом к лечению.",
    url: "https://lucenta.ru",
    siteName: "Lucenta",
    locale: "ru_RU",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Lucenta — стоматология",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucenta",
    description:
      "Стоматологическая практика с ведущей экспертизой в сложной эндодонтии и комплексным подходом к лечению.",
    images: ["/og-image.jpg"],
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
    <html lang="ru" data-scroll-behavior="smooth">
      <body>
        <JsonLd data={dentistJsonLd()} />
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html[data-a11y-font="large"]{font-size:120%}' +
              'html[data-a11y-font="xlarge"]{font-size:145%}' +
              'html[data-a11y-contrast="high"]{--color-gray-400:#333;--color-gray-500:#1a1a1a;--color-gray-600:#111827;--color-gray-700:#000}' +
              'html[data-a11y-contrast="high"] a{text-decoration:underline}',
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var e=document.documentElement," +
              "f=localStorage.getItem('dentology-a11y-font')," +
              "c=localStorage.getItem('dentology-a11y-contrast');" +
              "if(f)e.setAttribute('data-a11y-font',f);" +
              "if(c)e.setAttribute('data-a11y-contrast',c);}catch(x){}})();",
          }}
        />
        {/* Провайдер сессии живёт в корневом layout и не размонтируется
            при клиентской навигации — шапка перестаёт мигать. children
            остаются серверными компонентами.

            НЕ УДАЛЯТЬ: без него AuthNav переходит на собственный запрос
            сессии — работать будет, но по запросу на каждое открытие меню
            и с миганием при навигации. */}
        <AuthProvider>{children}</AuthProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
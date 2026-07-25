import type { Metadata } from "next";
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { PageHero } from "@/components/layout/page-hero";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { getDirections } from "@/lib/directions-db";
import { typography } from "@/lib/typography";

export const metadata: Metadata = {
  title: "Карта сайта",
  description: "Все разделы сайта Lucenta.",
};

async function safeDirections(): Promise<{ slug: string; title: string }[]> {
  try {
    return (await getDirections()).map((d) => ({ slug: d.slug, title: d.title }));
  } catch {
    return [];
  }
}

// Строчный интервал у ссылок увеличен намеренно: это список для быстрого
// перехода, и разреженные строки удобнее попадать пальцем.
const linkCls =
  "text-base leading-8 text-[var(--color-navy-secondary)] underline-offset-2 hover:text-[var(--color-navy)] hover:underline";

export default async function SitemapPage() {
  const directions = await safeDirections();

  return (
    <SiteShell>
      <PageHero
        eyebrow="Навигация"
        title="Карта сайта"
        description="Все основные разделы сайта — для быстрого перехода."
      />

      <Section className="pb-20 md:pb-28">
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
              Основные разделы
            </h2>
            <ul className="mt-4 flex flex-col gap-1">
              <li><Link href="/" className={linkCls}>Главная</Link></li>
              <li><Link href="/cases" className={linkCls}>Клинические случаи</Link></li>
              <li><Link href="/team" className={linkCls}>Команда</Link></li>
              <li><Link href="/about" className={linkCls}>О враче</Link></li>
              <li><Link href="/education" className={linkCls}>Обучение</Link></li>
              <li><Link href="/reviews" className={linkCls}>Отзывы</Link></li>
              <li><Link href="/contacts" className={linkCls}>Контакты</Link></li>
            </ul>
          </Card>

          <Card>
            <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
              Направления
            </h2>
            {directions.length ? (
              <ul className="mt-4 flex flex-col gap-1">
                {directions.map((d) => (
                  <li key={d.slug}>
                    <Link href={`/directions/${d.slug}`} className={linkCls}>
                      {d.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`mt-4 ${typography.bodySm} text-[var(--color-gray-500)]`}>
                Список направлений временно недоступен.
              </p>
            )}
          </Card>

          <Card>
            <h2 className={`${typography.h3} text-[var(--color-navy)]`}>
              Правовая информация
            </h2>
            <ul className="mt-4 flex flex-col gap-1">
              <li><Link href="/legal/license" className={linkCls}>Лицензия</Link></li>
              <li>
                <Link href="/legal/privacy" className={linkCls}>
                  Политика обработки персональных данных
                </Link>
              </li>
            </ul>
          </Card>
        </div>
      </Section>
    </SiteShell>
  );
}
import Link from "next/link";
import { SiteShell } from "@/components/layout/site-shell";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <SiteShell>
      <Section className="py-24 md:py-32">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm uppercase tracking-[0.22em] text-[var(--color-gray-500)]">
            404
          </p>

          <h1 className="text-4xl font-semibold leading-[1.08] text-[var(--color-navy)] md:text-6xl">
            Страница не найдена
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-gray-700)]">
            Возможно, ссылка устарела или страница была перемещена. Вернитесь на
            главную страницу или перейдите к основным разделам сайта.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/">На главную</Button>

            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-xl border border-[var(--color-navy)] px-6 py-4 text-sm font-medium text-[var(--color-navy)] transition-colors duration-200 hover:bg-[var(--color-gray-50)]"
            >
              Контакты
            </Link>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
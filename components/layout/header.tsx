import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/layout/section";
import { MobileNav } from "@/components/layout/mobile-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-gray-200)] bg-white/80 backdrop-blur">
      <Section className="py-4">
        <div className="flex items-center justify-between gap-6">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/logo-master.png"
              alt="Dentology"
              width={180}
              height={48}
              priority
              style={{ height: "auto" }}
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm text-[var(--color-navy)]">
            <Link href="/directions">Направления</Link>
            <Link href="/cases">Клинические случаи</Link>
            <Link href="/#team">Команда</Link>
            <Link href="/education">Education</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>

          <div className="hidden lg:flex">
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center rounded-xl bg-[var(--color-teal)] px-5 py-3 text-sm font-medium text-white"
            >
              Записаться
            </Link>
          </div>

          <MobileNav />
        </div>
      </Section>
    </header>
  );
}
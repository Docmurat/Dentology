import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/layout/section";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AuthNav } from "@/components/layout/auth-nav";
import { ContactButton } from "@/components/contact/contact-modal";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-gray-200)] bg-white/80 backdrop-blur">
      <Section className="py-0">
        <div className="flex h-20 items-center justify-between gap-6">
          <Link href="/" className="flex h-full shrink-0 items-center">
            <Image
              src="/logo-master.png"
              alt="Lucenta"
              width={220}
              height={72}
              priority
              className="h-16 w-auto md:h-18"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm text-[var(--color-navy)]">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/#directions">Направления</a>
            <Link href="/cases">Клинические случаи</Link>
            <Link href="/team">Команда</Link>
            <Link href="/education">Обучение</Link>
            <Link href="/contacts">Контакты</Link>
          </nav>

          <div className="hidden items-center gap-5 lg:flex">
            <AuthNav variant="desktop" />
            <ContactButton
              label="Записаться"
              variant="teal"
              className="px-5 py-3"
            />
          </div>

          <MobileNav />
        </div>
      </Section>
    </header>
  );
}
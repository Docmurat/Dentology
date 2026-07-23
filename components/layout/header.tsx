import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/layout/section";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AuthNav } from "@/components/layout/auth-nav";
import { LogoLink } from "@/components/layout/logo-link";
import { ContactButton } from "@/components/contact/contact-modal";
import { siteConfig } from "@/lib/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-gray-200)] bg-white/80 backdrop-blur">
      <Section className="py-0">
        <div className="flex h-20 items-center justify-between gap-6">
          <LogoLink className="flex h-full shrink-0 items-center">
            <Image
              src="/logo-master.png"
              alt="Lucenta"
              width={220}
              height={72}
              priority
              className="h-16 w-auto md:h-[72px]"
              style={{ width: "auto" }}
            />
          </LogoLink>

          {/* Пункты берём из общего конфига — тот же список, что в мобильном меню. */}
          <nav className="hidden lg:flex items-center gap-6 text-sm text-[var(--color-navy)]">
            {siteConfig.navigation.map((item) =>
              item.href.includes("#") ? (
                // eslint-disable-next-line @next/next/no-html-link-for-pages
                <a key={item.href} href={item.href}>
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              )
            )}
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
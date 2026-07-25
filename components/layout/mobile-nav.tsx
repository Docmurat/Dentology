"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";
import { AuthNav } from "@/components/layout/auth-nav";
import { ContactButton } from "@/components/contact/contact-modal";

export function MobileNav() {
  const [open, setOpen] = useState(false);

  const linkClass =
    "text-base text-[var(--color-gray-700)] transition-colors hover:text-[var(--color-navy)]";

  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={open ? "Закрыть меню" : "Открыть меню"}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-gray-200)] text-[var(--color-navy)]"
      >
        {/* SVG вместо текстовых глифов ☰ / ×: одинаковая метрика во всех
            шрифтах, без микро-скачка при переключении. */}
        <svg
          aria-hidden="true"
          width="18"
          height="14"
          viewBox="0 0 18 14"
          fill="none"
        >
          {open ? (
            <>
              <path d="M2 1L16 13" stroke="currentColor" strokeWidth="2" />
              <path d="M16 1L2 13" stroke="currentColor" strokeWidth="2" />
            </>
          ) : (
            <>
              <path d="M0 1h18" stroke="currentColor" strokeWidth="2" />
              <path d="M0 7h18" stroke="currentColor" strokeWidth="2" />
              <path d="M0 13h18" stroke="currentColor" strokeWidth="2" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <div
          id="site-menu"
          className="absolute left-0 right-0 top-full border-b border-[var(--color-gray-200)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
        >
          <div className="mx-auto max-w-7xl px-6 py-6 md:px-10">
            <nav className="flex flex-col gap-4">
              {siteConfig.navigation.map((item) => {
                const isAnchor = item.href.includes("#");

                return isAnchor ? (
                  // eslint-disable-next-line @next/next/no-html-link-for-pages
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={linkClass}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={linkClass}
                  >
                    {item.label}
                  </Link>
                );
              })}

              <ContactButton
                label="Записаться"
                variant="teal"
                className="mt-2 w-full"
              />

              <div className="mt-2 flex flex-col gap-4 border-t border-[var(--color-gray-200)] pt-4">
                <AuthNav variant="mobile" onNavigate={() => setOpen(false)} />
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
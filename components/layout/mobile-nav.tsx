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
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-gray-200)] text-[var(--color-navy)]"
        aria-label="Открыть меню"
      >
        <span className="text-lg">{open ? "×" : "☰"}</span>
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full border-b border-[var(--color-gray-200)] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
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
"use client";

import { useState } from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/constants";

export function MobileNav() {
  const [open, setOpen] = useState(false);

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
              {siteConfig.navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="text-base text-[var(--color-gray-700)] transition-colors hover:text-[var(--color-navy)]"
                >
                  {item.label}
                </Link>
              ))}

              <Link
                href="/contacts"
                onClick={() => setOpen(false)}
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-[var(--color-teal)] px-5 py-4 text-sm font-medium text-white"
              >
                Записаться
              </Link>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
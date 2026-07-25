// components/admin/cabinet-nav.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export type CabinetLink = {
  href: string;
  label: string;
  /** Число рядом с пунктом — например, новые заявки. */
  badge?: number;
};

/**
 * Шапка кабинета: админского, врачебного и модераторского.
 *
 * До 1024px пункты уезжают под бургер. В админке их семь, и на телефоне
 * они переносились в три строки, съедая пол-экрана. Общий компонент,
 * чтобы три шапки не разъезжались при следующей правке.
 */
export function CabinetNav({
  brandTitle,
  brandHref,
  links,
  backLink,
  userLabel,
  roleLabel,
  signOutAction,
}: {
  /** Подпись рядом с «Lucenta»: «Кабинет», «Врач», «Модерация». */
  brandTitle: string;
  brandHref: string;
  links: CabinetLink[];
  /** Возврат в свой кабинет из чужого раздела. */
  backLink?: CabinetLink;
  userLabel: string;
  roleLabel?: string;
  signOutAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  const linkCls =
    "font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]";

  // Панель закрываем по клику на пункт: переход в Next не перезагружает
  // страницу, и меню осталось бы висеть поверх нового раздела.
  const renderLink = (item: CabinetLink, extra = "") => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setOpen(false)}
      className={`${linkCls} ${extra}`}
    >
      {item.label}
      {item.badge ? (
        <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );

  return (
    <header className="border-b border-[var(--color-gray-200)] bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <p className="font-semibold text-[var(--color-navy)]">
          {/* «Lucenta» ведёт на публичный сайт, подпись — в корень кабинета */}
          <Link href="/" className="hover:text-[var(--color-navy-secondary)]">
            Lucenta
          </Link>
          <span className="text-[var(--color-gray-400)]"> · </span>
          <Link
            href={brandHref}
            onClick={() => setOpen(false)}
            className="hover:text-[var(--color-navy-secondary)]"
          >
            {brandTitle}
          </Link>
        </p>

        {/* От 1024px — обычная строка */}
        <nav className="hidden flex-1 items-center gap-4 text-sm lg:flex">
          {backLink ? renderLink(backLink) : null}
          {links.map((item) => renderLink(item))}
        </nav>

        <div className="hidden items-center gap-4 text-sm lg:flex">
          <span className="text-[var(--color-gray-500)]">
            {userLabel}
            {roleLabel ? (
              <span className="ml-2 rounded-full bg-[var(--color-gray-100)] px-2 py-0.5 text-xs">
                {roleLabel}
              </span>
            ) : null}
          </span>
          <form action={signOutAction}>
            <button className="font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]">
              Выйти
            </button>
          </form>
        </div>

        {/* До 1024px — бургер */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="cabinet-menu"
          aria-label={open ? "Закрыть меню" : "Открыть меню"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--color-gray-200)] text-[var(--color-navy)] lg:hidden"
        >
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
      </div>

      {open ? (
        <div
          id="cabinet-menu"
          className="border-t border-[var(--color-gray-200)] lg:hidden"
        >
          <nav className="mx-auto flex max-w-5xl flex-col gap-1 px-6 py-3 text-sm">
            {backLink ? renderLink(backLink, "py-2") : null}
            {links.map((item) => renderLink(item, "py-2"))}
          </nav>

          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 border-t border-[var(--color-gray-200)] px-6 py-3 text-sm">
            <span className="min-w-0 truncate text-[var(--color-gray-500)]">
              {userLabel}
              {roleLabel ? (
                <span className="ml-2 rounded-full bg-[var(--color-gray-100)] px-2 py-0.5 text-xs">
                  {roleLabel}
                </span>
              ) : null}
            </span>
            <form action={signOutAction}>
              <button className="shrink-0 font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]">
                Выйти
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </header>
  );
}
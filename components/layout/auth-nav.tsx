"use client";

import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { useAuthSession } from "@/components/layout/auth-provider";

// Клиентский островок авторизации в шапке: гость видит «Войти»,
// залогиненный — «Кабинет» (по роли) и «Выйти». Не делает страницы
// динамическими: статус читается на клиенте через эндпоинт сессии Auth.js.
//
// Состояние приходит из AuthProvider в корневом layout, поэтому открытие
// меню и переходы между страницами не вызывают повторных запросов и не
// сдвигают вёрстку.
export function AuthNav({
  variant,
  onNavigate,
}: {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const { status, home, clearSession } = useAuthSession();
  const isDesktop = variant === "desktop";

  // Пока сессия неизвестна — держим место, чтобы не было layout shift.
  if (status === "loading") {
    return (
      <div
        aria-hidden="true"
        className={isDesktop ? "h-5 w-[112px]" : "h-6 w-full"}
      />
    );
  }

  const linkCls = isDesktop
    ? "text-sm font-medium text-[var(--color-navy)] transition-colors hover:text-[var(--color-navy-secondary)]"
    : "text-base text-[var(--color-gray-700)] transition-colors hover:text-[var(--color-navy)]";

  if (!home) {
    return (
      <Link href="/admin/login" onClick={onNavigate} className={linkCls}>
        Войти
      </Link>
    );
  }

  const signOutCls = isDesktop
    ? "text-sm text-[var(--color-gray-500)] transition-colors hover:text-[var(--color-navy)]"
    : linkCls;

  const content = (
    <>
      <Link href={home} onClick={onNavigate} className={linkCls}>
        Кабинет
      </Link>
      <form action={signOut} onSubmit={clearSession}>
        <button type="submit" className={signOutCls}>
          Выйти
        </button>
      </form>
    </>
  );

  return isDesktop ? (
    <div className="flex items-center justify-end gap-4">{content}</div>
  ) : (
    content
  );
}
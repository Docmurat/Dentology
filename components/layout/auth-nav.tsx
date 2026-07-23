"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { roleHome } from "@/lib/role-home";
import { signOut } from "@/app/admin/actions";

// Клиентский островок авторизации в шапке: гость видит «Войти»,
// залогиненный — «Кабинет» (по роли) и «Выйти». Не делает страницы
// динамическими: статус читается на клиенте через эндпоинт сессии Auth.js.
export function AuthNav({
  variant,
  onNavigate,
}: {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [home, setHome] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch("/api/auth/session");
        const session = (await res.json()) as {
          user?: { role?: string } | null;
        } | null;

        if (!active) return;
        const role = session?.user?.role;
        setHome(role ? roleHome(role) : null);
      } catch {
        if (active) setHome(null);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  if (loading) return null;

  if (variant === "mobile") {
    const cls =
      "text-base text-[var(--color-gray-700)] transition-colors hover:text-[var(--color-navy)]";
    if (!home) {
      return (
        <Link href="/admin/login" onClick={onNavigate} className={cls}>
          Войти
        </Link>
      );
    }
    return (
      <>
        <Link href={home} onClick={onNavigate} className={cls}>
          Кабинет
        </Link>
        <form action={signOut}>
          <button type="submit" className={cls}>
            Выйти
          </button>
        </form>
      </>
    );
  }

  // desktop
  const linkCls =
    "text-sm font-medium text-[var(--color-navy)] transition-colors hover:text-[var(--color-navy-secondary)]";
  if (!home) {
    return (
      <Link href="/admin/login" className={linkCls}>
        Войти
      </Link>
    );
  }
  return (
    <div className="flex items-center gap-4">
      <Link href={home} className={linkCls}>
        Кабинет
      </Link>
      <form action={signOut}>
        <button
          type="submit"
          className="text-sm text-[var(--color-gray-500)] transition-colors hover:text-[var(--color-navy)]"
        >
          Выйти
        </button>
      </form>
    </div>
  );
}
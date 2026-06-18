"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { roleHome } from "@/lib/role-home";
import { signOut } from "@/app/admin/actions";

// Клиентский островок авторизации в шапке: гость видит «Войти»,
// залогиненный — «Кабинет» (по роли) и «Выйти». Не делает страницы
// динамическими: статус читается на клиенте.
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
    const supabase = createClient();
    let active = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;
      if (!user) {
        setHome(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;
      setHome(roleHome(profile?.role));
      setLoading(false);
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
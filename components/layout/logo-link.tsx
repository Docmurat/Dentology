"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Логотип ведёт на главную. Если пользователь уже на главной (в том числе
// с якорем вида /#directions), обычная навигация не прокручивает страницу —
// поэтому поднимаем наверх вручную и убираем якорь из адреса.
export function LogoLink({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <Link
      href="/"
      className={className}
      onClick={(e) => {
        if (pathname === "/") {
          e.preventDefault();
          window.history.replaceState(null, "", "/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
    >
      {children}
    </Link>
  );
}
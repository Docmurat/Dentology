// app/admin/layout.tsx
import Link from "next/link";
import { queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";
import { getNewLeadCount } from "@/lib/leads";
import { CabinetNav } from "@/components/admin/cabinet-nav";
import { signOut } from "./actions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/staff.webmanifest",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  // Неавторизованный — отдаём голое содержимое (страница входа).
  if (!user) {
    return <>{children}</>;
  }

  if (!["admin", "editor"].includes(user.role)) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-navy)]">
            Нет доступа
          </h1>
          <p className="mt-2 text-sm text-[var(--color-gray-600)]">
            Учётной записи не назначена роль. Обратитесь к администратору.
          </p>
          <form action={signOut} className="mt-4">
            <button className="text-sm font-medium text-[var(--color-navy-secondary)] underline">
              Выйти
            </button>
          </form>
        </div>
      </main>
    );
  }

  const [profile, newLeads] = await Promise.all([
    queryOne<{ full_name: string | null }>(
      `select full_name from profiles where id = $1`,
      [user.id]
    ),
    // Возвращает 0 при любой ошибке, поэтому шапка не сломается,
    // если таблица заявок ещё не создана.
    getNewLeadCount(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      <CabinetNav
        brandTitle="Кабинет"
        brandHref="/admin"
        userLabel={profile?.full_name || user.email}
        roleLabel={user.role}
        signOutAction={signOut}
        links={[
          // Заявки первыми: единственный раздел, требующий реакции в тот же день.
          { href: "/admin/leads", label: "Заявки", badge: newLeads },
          { href: "/admin/cases", label: "Кейсы" },
          { href: "/admin/team", label: "Команда" },
          { href: "/admin/directions", label: "Направления" },
          { href: "/admin/homepage", label: "Главная" },
          { href: "/admin/education", label: "Обучение" },
          { href: "/admin/cases/new", label: "Добавить" },
        ]}
      />

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
import Link from "next/link";
import { queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";
import { signOut } from "./actions";

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

  const profile = await queryOne<{ full_name: string | null }>(
    `select full_name from profiles where id = $1`,
    [user.id]
  );

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      <header className="border-b border-[var(--color-gray-200)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <p className="font-semibold text-[var(--color-navy)]">
              {/* «Lucenta» ведёт на публичный сайт, «Кабинет» — в корень админки */}
              <Link href="/" className="hover:text-[var(--color-navy-secondary)]">
                Lucenta
              </Link>
              <span className="text-[var(--color-gray-400)]"> · </span>
              <Link
                href="/admin"
                className="hover:text-[var(--color-navy-secondary)]"
              >
                Кабинет
              </Link>
            </p>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                href="/admin/cases"
                className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
              >
                Кейсы
              </Link>
              <Link
                href="/admin/team"
                className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
              >
                Команда
              </Link>
              <Link
                href="/admin/directions"
                className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
              >
                Направления
              </Link>
              <Link
                href="/admin/homepage"
                className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
              >
                Главная
              </Link>
              <Link
                href="/admin/education"
                className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
              >
                Обучение
              </Link>
              <Link
                href="/admin/cases/new"
                className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
              >
                Добавить
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--color-gray-500)]">
              {profile?.full_name || user.email}
              <span className="ml-2 rounded-full bg-[var(--color-gray-100)] px-2 py-0.5 text-xs">
                {user.role}
              </span>
            </span>
            <form action={signOut}>
              <button className="font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
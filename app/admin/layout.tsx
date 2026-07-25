// app/admin/layout.tsx
import Link from "next/link";
import { queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";
import { getNewLeadCount } from "@/lib/leads";
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

  const [profile, newLeads] = await Promise.all([
    queryOne<{ full_name: string | null }>(
      `select full_name from profiles where id = $1`,
      [user.id]
    ),
    // Возвращает 0 при любой ошибке, поэтому шапка не сломается,
    // если таблица заявок ещё не создана.
    getNewLeadCount(),
  ]);

  const navLink =
    "font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]";

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      <header className="border-b border-[var(--color-gray-200)] bg-white">
        {/* flex-wrap — иначе на телефоне навигация уезжает за край экрана */}
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
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
            <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              {/* Заявки первыми: это единственный раздел, который требует
                  реакции в тот же день. */}
              <Link href="/admin/leads" className={navLink}>
                Заявки
                {newLeads > 0 ? (
                  <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                    {newLeads}
                  </span>
                ) : null}
              </Link>
              <Link href="/admin/cases" className={navLink}>
                Кейсы
              </Link>
              <Link href="/admin/team" className={navLink}>
                Команда
              </Link>
              <Link href="/admin/directions" className={navLink}>
                Направления
              </Link>
              <Link href="/admin/homepage" className={navLink}>
                Главная
              </Link>
              <Link href="/admin/education" className={navLink}>
                Обучение
              </Link>
              <Link href="/admin/cases/new" className={navLink}>
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
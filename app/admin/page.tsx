import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Панель управления
      </h1>
      <p className="mt-2 text-sm text-[var(--color-gray-600)]">
        Управление клиническими случаями, командой и аккаунтами пациентов.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/cases/new"
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        >
          <p className="text-lg font-semibold text-[var(--color-navy)]">
            Добавить кейс
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            Новый клинический случай с фото и описанием.
          </p>
        </Link>

        <Link
          href="/admin/cases"
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        >
          <p className="text-lg font-semibold text-[var(--color-navy)]">
            Все кейсы
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            Модерация, редактирование и удаление.
          </p>
        </Link>

        <Link
          href="/admin/team"
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        >
          <p className="text-lg font-semibold text-[var(--color-navy)]">
            Команда
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            Сотрудники, аккаунты для входа и привязка к карточкам.
          </p>
        </Link>

        <Link
          href="/admin/patients"
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        >
          <p className="text-lg font-semibold text-[var(--color-navy)]">
            Пациенты
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            Логины и пароли для входа в личный кабинет.
          </p>
        </Link>

        <Link
          href="/admin/reviews"
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        >
          <p className="text-lg font-semibold text-[var(--color-navy)]">
            Отзывы
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            Модерация отзывов от пациентов с сайта.
          </p>
        </Link>
      </div>
    </div>
  );
}
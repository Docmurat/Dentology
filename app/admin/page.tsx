// app/admin/page.tsx
import Link from "next/link";
import { getNewLeadCount } from "@/lib/leads";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  // Возвращает 0 при любой ошибке — страница не сломается,
  // если таблица заявок ещё не создана.
  const newLeads = await getNewLeadCount();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Панель управления
      </h1>
      <p className="mt-2 text-sm text-[var(--color-gray-600)]">
        Управление клиническими случаями, командой и аккаунтами пациентов.
      </p>

      {/* Заявки — во всю ширину и первыми: единственный раздел,
          который требует реакции в тот же день. */}
      <div className="mt-8">
        <Link
          href="/admin/leads"
          className={
            "flex items-center justify-between gap-4 rounded-2xl border bg-white p-6 transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)] " +
            (newLeads > 0
              ? "border-amber-300 bg-amber-50/40"
              : "border-[var(--color-gray-200)]")
          }
        >
          <div>
            <p className="text-lg font-semibold text-[var(--color-navy)]">
              Заявки
            </p>
            <p className="mt-1 text-sm text-[var(--color-gray-600)]">
              {newLeads > 0
                ? "Есть необработанные обращения с форм сайта."
                : "Обращения с форм сайта. Новых нет."}
            </p>
          </div>

          {newLeads > 0 ? (
            <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
              {newLeads}
            </span>
          ) : null}
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
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

        <Link
          href="/admin/directions"
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        >
          <p className="text-lg font-semibold text-[var(--color-navy)]">
            Направления
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            Виды лечения, коллаж на главной и привязка кейсов и отзывов.
          </p>
        </Link>

        <Link
          href="/admin/homepage"
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        >
          <p className="text-lg font-semibold text-[var(--color-navy)]">
            Главная страница
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            Конструктор: какие блоки показывать и в каком порядке.
          </p>
        </Link>

        <Link
          href="/admin/education"
          className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 transition hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
        >
          <p className="text-lg font-semibold text-[var(--color-navy)]">
            Обучение
          </p>
          <p className="mt-1 text-sm text-[var(--color-gray-600)]">
            Страница обучения: заголовок и (позже) список курсов.
          </p>
        </Link>
      </div>
    </div>
  );
}
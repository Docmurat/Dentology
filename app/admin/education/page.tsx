// app/admin/education/page.tsx
import Link from "next/link";
import { query } from "@/lib/db";
import { PageHeadingEditor } from "@/components/admin/page-heading-editor";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { getTeamMembers } from "@/lib/team";
import { deleteCourse, toggleArchiveAction } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  title: string;
  doctor_slug: string | null;
  published: boolean;
  archived: boolean | null;
  sort_order: number | null;
};

export default async function AdminEducationPage() {
  // Явные колонки вместо select *: списку не нужны program, faq, metrics
  // и прочие jsonb-поля курса.
  const [rows, team] = await Promise.all([
    query<Row>(
      `select slug, title, doctor_slug, published, archived, sort_order
         from courses order by sort_order asc, created_at desc`
    ),
    getTeamMembers(),
  ]);

  const doctorName = new Map(team.map((d) => [d.slug, d.name]));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Обучение
        </h1>
        <Link
          href="/admin/education/new"
          style={{ color: "#ffffff" }}
          className="rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Добавить курс
        </Link>
      </div>

      <PageHeadingEditor pageKey="education" />

      <div className="overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
        {rows.length ? (
          <ul className="divide-y divide-[var(--color-gray-200)]">
            {rows.map((row) => (
              <li
                key={row.slug}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--color-navy)]">
                    {row.title}
                    {row.published ? null : (
                      <span className="ml-2 rounded-full bg-[var(--color-gray-200)] px-2 py-0.5 text-xs text-[var(--color-gray-600)]">
                        черновик
                      </span>
                    )}
                    {row.archived ? (
                      <span className="ml-2 rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-gold)]">
                        в архиве
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    {row.doctor_slug
                      ? doctorName.get(row.doctor_slug) ?? "Врач не найден"
                      : "Ведущий не выбран"}
                  </p>
                </div>

                {/* flex-wrap — иначе на узком экране действия уезжают за край */}
                <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:justify-end">
                  {/* Опубликованный курс открываем на публичном адресе,
                      черновик — на маршруте предпросмотра: публичная
                      страница теперь кешируется и черновик отдаёт 404. */}
                  {row.published ? (
                    <Link
                      href={`/education/${row.slug}`}
                      target="_blank"
                      className="text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                    >
                      Открыть
                    </Link>
                  ) : (
                    <Link
                      href={`/education/${row.slug}/preview`}
                      target="_blank"
                      className="text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                    >
                      Предпросмотр
                    </Link>
                  )}
                  <Link
                    href={`/admin/education/${row.slug}/edit`}
                    className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
                  >
                    Изменить
                  </Link>
                  <form action={toggleArchiveAction}>
                    <input type="hidden" name="slug" value={row.slug} />
                    <input
                      type="hidden"
                      name="archived"
                      value={row.archived ? "false" : "true"}
                    />
                    <button className="text-[var(--color-gold)] hover:opacity-80">
                      {row.archived ? "Вернуть из архива" : "Архивировать"}
                    </button>
                  </form>

                  {/* Удалить можно только архивный курс: сначала архив, потом
                      удаление. В общем списке промахнуться уже нечем. */}
                  {row.archived ? (
                    <form action={deleteCourse}>
                      <input type="hidden" name="slug" value={row.slug} />
                      <ConfirmDeleteButton title={row.title} />
                    </form>
                  ) : (
                    <span
                      className="cursor-not-allowed text-[var(--color-gray-400)]"
                      title="Чтобы удалить курс, сначала переведите его в архив"
                    >
                      Удалить
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-[var(--color-gray-500)]">
            Курсов пока нет. Нажмите «Добавить курс».
          </p>
        )}
      </div>
    </div>
  );
}
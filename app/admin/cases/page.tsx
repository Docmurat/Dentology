// app/admin/cases/page.tsx
import Link from "next/link";
import { query } from "@/lib/db";
import { getTeamMembersAll } from "@/lib/team";
import { getDirectionLabelMap } from "@/lib/directions-db";
import {
  approveCase,
  deleteCase,
  toggleCaseArchiveAction,
} from "./actions";
import { PageHeadingEditor } from "@/components/admin/page-heading-editor";
import { AdminThumb } from "@/components/admin/admin-thumb";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  title: string;
  direction_slug: string | null;
  doctor_slug: string | null;
  doctor_name: string | null;
  cover_image: string | null;
  published: boolean;
  archived: boolean | null;
};

function Cover({ url }: { url: string | null }) {
  return <AdminThumb url={url} className="h-12 w-16" sizes="80px" />;
}

// Название направления приходит уже готовым: справочник берётся из базы,
// иначе направления, добавленные через админку, показывались слагом.
function Meta({
  doctorName,
  directionLabel,
}: {
  doctorName: string;
  directionLabel: string | null;
}) {
  return (
    <p className="text-xs text-[var(--color-gray-500)]">
      {doctorName}
      {directionLabel ? ` · ${directionLabel}` : ""}
    </p>
  );
}

export default async function AdminCasesPage() {
  const [rows, team, dirLabel] = await Promise.all([
    query<Row>(
      `select slug, title, direction_slug, doctor_slug, doctor_name,
              cover_image, published, archived
         from cases order by created_at desc`
    ),
    // Со всеми, включая архивных: иначе у кейсов архивного врача
    // появилось бы «Врач не указан».
    getTeamMembersAll(),
    getDirectionLabelMap(),
  ]);

  const doctorName = new Map(team.map((d) => [d.slug, d.name]));

  // Живое имя важнее — фамилия могла измениться. Снимок в кейсе
  // подстраховывает, если карточки врача уже нет.
  const nameOf = (row: Row) =>
    (row.doctor_slug ? doctorName.get(row.doctor_slug) : null) ??
    row.doctor_name ??
    "Врач не указан";

  // Архивное направление в справочнике есть, удалённое — нет: показываем слаг.
  const labelOf = (slug: string | null) =>
    slug ? dirLabel[slug] ?? slug : null;

  const pending = rows.filter((r) => !r.published);
  const published = rows.filter((r) => r.published);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Клинические случаи
        </h1>
        <Link
          href="/admin/cases/new"
          style={{ color: "#ffffff" }}
          className="rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Добавить кейс
        </Link>
      </div>

      <PageHeadingEditor pageKey="cases" />

      {/* --- На модерации --- */}
      {pending.length ? (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-amber-700">
              На модерации
            </h2>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              {pending.length}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40">
            <ul className="divide-y divide-amber-100">
              {pending.map((row) => (
                <li
                  key={row.slug}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <Cover url={row.cover_image} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-navy)]">
                        {row.title}
                      </p>
                      <Meta
                        doctorName={nameOf(row)}
                        directionLabel={labelOf(row.direction_slug)}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:justify-end">
                    <Link
                      href={`/cases/${row.slug}/preview`}
                      target="_blank"
                      className="text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                    >
                      Предпросмотр
                    </Link>
                    <Link
                      href={`/admin/cases/${row.slug}/edit`}
                      className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
                    >
                      Изменить
                    </Link>
                    <form action={approveCase}>
                      <input type="hidden" name="slug" value={row.slug} />
                      <button className="rounded-lg bg-green-600 px-3 py-1.5 font-medium text-white hover:bg-green-700">
                        Подтвердить и опубликовать
                      </button>
                    </form>
                    <form action={toggleCaseArchiveAction}>
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

                    {row.archived ? (
                      <form action={deleteCase}>
                        <input type="hidden" name="slug" value={row.slug} />
                        <ConfirmDeleteButton
                          title={row.title}
                          className="text-red-600 hover:text-red-700"
                        />
                      </form>
                    ) : (
                      <span
                        className="cursor-not-allowed text-[var(--color-gray-400)]"
                        title="Чтобы удалить кейс, сначала переведите его в архив"
                      >
                        Удалить
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {/* --- Опубликованные --- */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-gray-500)]">
          Опубликованные
        </h2>

        <div className="overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
          {published.length ? (
            <ul className="divide-y divide-[var(--color-gray-200)]">
              {published.map((row) => (
                <li
                  key={row.slug}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <Cover url={row.cover_image} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-navy)]">
                        {row.title}
                        {row.archived ? (
                          <span className="ml-2 rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-gold)]">
                            в архиве
                          </span>
                        ) : null}
                      </p>
                      <Meta
                        doctorName={nameOf(row)}
                        directionLabel={labelOf(row.direction_slug)}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:justify-end">
                    <Link
                      href={`/admin/cases/${row.slug}/edit`}
                      className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
                    >
                      Изменить
                    </Link>
                    <Link
                      href={`/cases/${row.slug}`}
                      target="_blank"
                      className="text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                    >
                      Открыть
                    </Link>
                    <form action={toggleCaseArchiveAction}>
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

                    {/* Удалить можно только архивный кейс: сначала архив,
                        потом удаление. Промахнуться в общем списке нечем. */}
                    {row.archived ? (
                      <form action={deleteCase}>
                        <input type="hidden" name="slug" value={row.slug} />
                        <ConfirmDeleteButton
                          title={row.title}
                          className="text-red-600 hover:text-red-700"
                        />
                      </form>
                    ) : (
                      <span
                        className="cursor-not-allowed text-[var(--color-gray-400)]"
                        title="Чтобы удалить кейс, сначала переведите его в архив"
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
              Опубликованных кейсов пока нет.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
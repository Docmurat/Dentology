// app/admin/team/page.tsx
import Link from "next/link";
import { query } from "@/lib/db";
import { deleteTeamMember, toggleTeamArchiveAction } from "./actions";
import { AdminThumb } from "@/components/admin/admin-thumb";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";

export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  name: string;
  position: string;
  image: string | null;
  category: string;
  is_chief: boolean;
  is_lead: boolean;
  lead_direction_slug: string | null;
  sort_order: number;
  is_speaker: boolean;
  archived: boolean | null;
  // count(*) приходит из pg строкой — приводим на месте использования.
  cases_count: string | number;
  reviews_count: string | number;
  courses_count: string | number;
};

export default async function AdminTeamPage() {
  // Считаем связи прямо в запросе: на doctor_slug завязаны кейсы, отзывы
  // и курсы, и от их количества зависит, можно ли удалять карточку.
  const members = await query<Row>(
    `select t.slug, t.name, t.position, t.image, t.category, t.is_chief,
            t.is_lead, t.lead_direction_slug, t.sort_order, t.is_speaker,
            t.archived,
            (select count(*) from cases   c where c.doctor_slug = t.slug) as cases_count,
            (select count(*) from reviews r where r.doctor_slug = t.slug) as reviews_count,
            (select count(*) from courses k where k.doctor_slug = t.slug) as courses_count
       from team_members t
      order by t.is_chief desc, t.is_lead desc, t.sort_order asc`
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Команда
        </h1>
        <Link
          href="/admin/team/new"
          style={{ color: "#ffffff" }}
          className="rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Добавить сотрудника
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
        {members && members.length ? (
          <ul className="divide-y divide-[var(--color-gray-200)]">
            {members.map((item) => {
              const links =
                Number(item.cases_count) +
                Number(item.reviews_count) +
                Number(item.courses_count);
              const canDelete = Boolean(item.archived) && links === 0;

              return (
                <li
                  key={item.slug}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <AdminThumb
                      url={item.image}
                      className="h-12 w-12"
                      sizes="48px"
                      rounded="rounded-full"
                    />

                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-navy)]">
                        {item.name}
                        {item.is_chief ? (
                          <span className="ml-2 rounded-full bg-[var(--color-teal)] px-2 py-0.5 text-xs text-white">
                            главный
                          </span>
                        ) : item.is_lead ? (
                          <span className="ml-2 rounded-full bg-[var(--color-gray-100)] px-2 py-0.5 text-xs text-[var(--color-navy)]">
                            ведущий · {item.lead_direction_slug}
                          </span>
                        ) : null}
                        {item.is_speaker ? (
                          <span className="ml-2 rounded-full bg-[var(--color-gold)] px-2 py-0.5 text-xs text-white">
                            спикер
                          </span>
                        ) : null}
                        {item.archived ? (
                          <span className="ml-2 rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-gold)]">
                            в архиве
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-[var(--color-gray-500)]">
                        {item.position} ·{" "}
                        {item.category === "staff" ? "персонал" : "врач"}
                        {links > 0 ? (
                          <>
                            {" · связей: "}
                            {Number(item.cases_count)} кейсов,{" "}
                            {Number(item.reviews_count)} отзывов,{" "}
                            {Number(item.courses_count)} курсов
                          </>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:justify-end">
                    <Link
                      href={`/admin/team/${item.slug}/edit`}
                      className="font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                    >
                      Изменить
                    </Link>

                    <form action={toggleTeamArchiveAction}>
                      <input type="hidden" name="slug" value={item.slug} />
                      <input
                        type="hidden"
                        name="archived"
                        value={item.archived ? "false" : "true"}
                      />
                      <button className="text-[var(--color-gold)] hover:opacity-80">
                        {item.archived ? "Вернуть из архива" : "Архивировать"}
                      </button>
                    </form>

                    {/* Удалять можно только архивную карточку без связей:
                        на doctor_slug держатся кейсы, отзывы и курсы. */}
                    {canDelete ? (
                      <form action={deleteTeamMember}>
                        <input type="hidden" name="slug" value={item.slug} />
                        <ConfirmDeleteButton
                          title={item.name}
                          className="text-sm font-medium text-red-600 hover:text-red-700"
                        />
                      </form>
                    ) : (
                      <span
                        className="cursor-not-allowed text-[var(--color-gray-400)]"
                        title={
                          links > 0
                            ? "Нельзя удалить: на сотрудника ссылаются кейсы, отзывы или курсы. Используйте архив."
                            : "Чтобы удалить сотрудника, сначала переведите его в архив"
                        }
                      >
                        Удалить
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-[var(--color-gray-500)]">
            Пока нет сотрудников. Добавьте первого.
          </p>
        )}
      </div>
    </div>
  );
}
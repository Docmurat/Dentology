import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { deleteTeamMember } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTeamPage() {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("team_members")
    .select(
      "slug, name, position, image, category, is_chief, is_lead, lead_direction_slug, sort_order"
    )
    .order("is_chief", { ascending: false })
    .order("is_lead", { ascending: false })
    .order("sort_order", { ascending: true });

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
            {members.map((item) => (
              <li
                key={item.slug}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--color-gray-100)]">
                    {item.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--color-gray-400)]">
                        нет фото
                      </div>
                    )}
                  </div>

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
                    </p>
                    <p className="text-xs text-[var(--color-gray-500)]">
                      {item.position} ·{" "}
                      {item.category === "staff" ? "персонал" : "врач"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <Link
                    href={`/admin/team/${item.slug}/edit`}
                    className="text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                  >
                    Изменить
                  </Link>
                  <form action={deleteTeamMember}>
                    <input type="hidden" name="slug" value={item.slug} />
                    <button className="text-sm font-medium text-red-600 hover:text-red-700">
                      Удалить
                    </button>
                  </form>
                </div>
              </li>
            ))}
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

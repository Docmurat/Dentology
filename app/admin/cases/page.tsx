import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { directionLabel } from "@/lib/directions";
import { getTeamMembers } from "@/lib/team";
import { approveCase, deleteCase } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  title: string;
  direction_slug: string | null;
  doctor_slug: string | null;
  cover_image: string | null;
  published: boolean;
};

function Cover({ url }: { url: string | null }) {
  return (
    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-[var(--color-gray-100)]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--color-gray-400)]">
          нет фото
        </div>
      )}
    </div>
  );
}

function Meta({ doctorName, direction }: { doctorName: string; direction: string | null }) {
  return (
    <p className="text-xs text-[var(--color-gray-500)]">
      {doctorName}
      {direction ? ` · ${directionLabel(direction)}` : ""}
    </p>
  );
}

export default async function AdminCasesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cases")
    .select("slug, title, direction_slug, doctor_slug, cover_image, published")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  // Карта slug врача -> «Фамилия Имя».
  const team = await getTeamMembers();
  const doctorName = new Map(team.map((d) => [d.slug, d.name]));
  const nameOf = (slug: string | null) =>
    (slug ? doctorName.get(slug) : null) ?? "Врач не указан";

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
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <Cover url={row.cover_image} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-navy)]">
                        {row.title}
                      </p>
                      <Meta
                        doctorName={nameOf(row.doctor_slug)}
                        direction={row.direction_slug}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-sm">
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
                    <form action={deleteCase}>
                      <input type="hidden" name="slug" value={row.slug} />
                      <button className="text-red-600 hover:text-red-700">
                        Удалить
                      </button>
                    </form>
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
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <Cover url={row.cover_image} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[var(--color-navy)]">
                        {row.title}
                      </p>
                      <Meta
                        doctorName={nameOf(row.doctor_slug)}
                        direction={row.direction_slug}
                      />
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-sm">
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
                    <form action={deleteCase}>
                      <input type="hidden" name="slug" value={row.slug} />
                      <button className="text-red-600 hover:text-red-700">
                        Удалить
                      </button>
                    </form>
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
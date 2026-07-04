import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { PageHeadingEditor } from "@/components/admin/page-heading-editor";
import { getTeamMembers } from "@/lib/team";
import { deleteCourse } from "./actions";

export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  title: string;
  doctor_slug: string | null;
  published: boolean;
  sort_order: number | null;
};

export default async function AdminEducationPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("slug, title, doctor_slug, published, sort_order")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  const team = await getTeamMembers();
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
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--color-navy)]">
                    {row.title}
                    {row.published ? null : (
                      <span className="ml-2 rounded-full bg-[var(--color-gray-200)] px-2 py-0.5 text-xs text-[var(--color-gray-600)]">
                        черновик
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    {row.doctor_slug
                      ? doctorName.get(row.doctor_slug) ?? "Врач не найден"
                      : "Ведущий не выбран"}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <Link
                    href={`/education/${row.slug}`}
                    target="_blank"
                    className="text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                  >
                    Открыть
                  </Link>
                  <Link
                    href={`/admin/education/${row.slug}/edit`}
                    className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
                  >
                    Изменить
                  </Link>
                  <form action={deleteCourse}>
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
            Курсов пока нет. Нажмите «Добавить курс».
          </p>
        )}
      </div>
    </div>
  );
}
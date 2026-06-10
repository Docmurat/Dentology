import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { deleteCase } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage() {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select("slug, title, category, created_at")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Клинические случаи
        </h1>
        <Link
          href="/admin/cases/new"
          className="rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Добавить кейс
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
        {cases && cases.length ? (
          <ul className="divide-y divide-[var(--color-gray-200)]">
            {cases.map((item) => (
              <li
                key={item.slug}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--color-navy)]">
                    {item.title}
                  </p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    /{item.slug}
                    {item.category ? ` · ${item.category}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <Link
                    href={`/cases/${item.slug}`}
                    target="_blank"
                    className="text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                  >
                    Открыть
                  </Link>
                  <form action={deleteCase}>
                    <input type="hidden" name="slug" value={item.slug} />
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
            Пока нет ни одного кейса. Нажмите «Добавить кейс».
          </p>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import { query } from "@/lib/db";
import { deleteDirection, restoreDirection } from "./actions";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  featured: "главное",
  large: "большое",
  small: "маленькое",
};

type Row = {
  slug: string;
  title: string;
  short: string | null;
  collage_role: string;
  sort_order: number;
  featured: boolean;
  archived: boolean;
};

export default async function AdminDirectionsPage() {
  const rows = await query<Row>(
    `select slug, title, short, collage_role, sort_order, featured, archived
       from directions
      order by archived asc, featured desc, sort_order asc`
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Направления
        </h1>
        <Link
          href="/admin/directions/new"
          style={{ color: "#ffffff" }}
          className="rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Добавить направление
        </Link>
      </div>

      <p className="mt-2 text-sm text-[var(--color-gray-600)]">
        Направления формируют коллаж на главной и доступны в фильтрах кейсов,
        отзывов и в профиле врача. Архивные скрыты с сайта, но название
        сохраняется — и остаётся кнопкой в фильтре, пока есть связанные кейсы
        или отзывы.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
        {rows.length ? (
          <ul className="divide-y divide-[var(--color-gray-100)]">
            {rows.map((item) => (
              <li
                key={item.slug}
                className={
                  "flex items-center justify-between px-5 py-4 " +
                  (item.archived ? "opacity-60" : "")
                }
              >
                <div>
                  <p className="font-medium text-[var(--color-navy)]">
                    {item.title}
                    {item.archived ? (
                      <span className="ml-2 rounded-full bg-[var(--color-gray-200)] px-2 py-0.5 text-xs text-[var(--color-gray-600)]">
                        в архиве
                      </span>
                    ) : (
                      <span className="ml-2 rounded-full bg-[var(--color-gray-100)] px-2 py-0.5 text-xs text-[var(--color-navy)]">
                        {ROLE_LABEL[item.collage_role] ?? item.collage_role}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-gray-500)]">
                    {item.short ? `${item.short} · ` : ""}/{item.slug}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <Link
                    href={`/admin/directions/${item.slug}/edit`}
                    className="text-sm font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                  >
                    Изменить
                  </Link>

                  {item.archived ? (
                    <form action={restoreDirection}>
                      <input type="hidden" name="slug" value={item.slug} />
                      <button className="text-sm font-medium text-[var(--color-teal)] hover:text-[var(--color-navy)]">
                        Восстановить
                      </button>
                    </form>
                  ) : (
                    <form action={deleteDirection}>
                      <input type="hidden" name="slug" value={item.slug} />
                      <button className="text-sm font-medium text-red-600 hover:text-red-700">
                        Архивировать
                      </button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-[var(--color-gray-500)]">
            Пока нет направлений. Добавьте первое.
          </p>
        )}
      </div>
    </div>
  );
}
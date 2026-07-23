import Link from "next/link";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";
import { AdminThumb } from "@/components/admin/admin-thumb";

export const dynamic = "force-dynamic";

type Row = {
  slug: string;
  title: string;
  cover_image: string | null;
  published: boolean;
  created_at: string;
};

export default async function DoctorHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const cases = await query<Row>(
    `select slug, title, cover_image, published, created_at
       from cases where created_by = $1
      order by created_at desc`,
    [user.id]
  );

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Мои кейсы
        </h1>
        <Link
          href="/doctor/cases/new"
          style={{ color: "#ffffff" }}
          className="rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Добавить кейс
        </Link>
      </div>

      <p className="mt-3 max-w-prose text-sm leading-7 text-[var(--color-gray-700)]">
        Новый кейс после сохранения уходит на модерацию администратору и
        появляется на сайте только после публикации. Пока кейс на модерации, его
        можно редактировать.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
        {cases.length ? (
          <ul className="divide-y divide-[var(--color-gray-200)]">
            {cases.map((item) => (
              <li
                key={item.slug}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <AdminThumb
                    url={item.cover_image}
                    className="h-12 w-16"
                    sizes="80px"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--color-navy)]">
                      {item.title}
                    </p>
                    {item.published ? (
                      <span className="mt-1 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Опубликован
                      </span>
                    ) : (
                      <span className="mt-1 inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        На модерации
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-sm">
                  {item.published ? (
                    <Link
                      href={`/cases/${item.slug}`}
                      target="_blank"
                      className="text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                    >
                      Открыть
                    </Link>
                  ) : (
                    <>
                      <Link
                        href={`/cases/${item.slug}/preview`}
                        target="_blank"
                        className="text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                      >
                        Предпросмотр
                      </Link>
                      <Link
                        href={`/doctor/cases/${item.slug}/edit`}
                        className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
                      >
                        Изменить
                      </Link>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-5 py-8 text-center text-sm text-[var(--color-gray-500)]">
            Пока нет добавленных кейсов. Нажмите «Добавить кейс».
          </p>
        )}
      </div>
    </div>
  );
}
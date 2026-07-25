// app/doctor/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-guards";
import { getCasesByOwner } from "@/lib/cases";
import { getDirectionLabelMap } from "@/lib/directions-db";
import { AdminThumb } from "@/components/admin/admin-thumb";

export const dynamic = "force-dynamic";

export default async function DoctorHomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  // Свои кейсы = созданные этим аккаунтом ИЛИ привязанные к его карточке
  // врача. Раньше фильтр шёл только по created_by, то есть по тому, кто
  // нажал «Сохранить». Кейс, заведённый администратором и назначенный
  // врачу, в кабинет не попадал — человек видел пустой список и решал,
  // что аккаунт привязан неправильно.
  const [cases, dirLabel] = await Promise.all([
    getCasesByOwner(user.id, user.doctorSlug),
    getDirectionLabelMap(),
  ]);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Мои кейсы
        </h1>
        <Link
          href="/doctor/cases/new"
          style={{ color: "#ffffff" }}
          className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium hover:opacity-90"
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
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <AdminThumb
                    url={item.coverImage}
                    className="h-12 w-16"
                    sizes="80px"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--color-navy)]">
                      {item.title}
                    </p>

                    <p className="mt-0.5 truncate text-xs text-[var(--color-gray-500)]">
                      {item.directionSlug
                        ? dirLabel[item.directionSlug] ?? item.directionSlug
                        : "Направление не выбрано"}
                    </p>

                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {item.published ? (
                        <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                          Опубликован
                        </span>
                      ) : (
                        <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          На модерации
                        </span>
                      )}
                      {item.archived ? (
                        <span className="inline-block rounded-full bg-[var(--color-gold)]/15 px-2.5 py-0.5 text-xs font-medium text-[var(--color-gold)]">
                          В архиве
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 text-sm sm:justify-end">
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
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCoursesByOwner } from "@/lib/courses";

export const dynamic = "force-dynamic";

export default async function SpeakerCoursesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const courses = await getCoursesByOwner(user.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Мои курсы
        </h1>
        <Link
          href="/doctor/courses/new"
          style={{ color: "#ffffff" }}
          className="rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          Добавить курс
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--color-gray-200)] bg-white">
        {courses.length ? (
          <ul className="divide-y divide-[var(--color-gray-100)]">
            {courses.map((c) => (
              <li
                key={c.slug}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--color-navy)]">
                    {c.title}
                    {c.published ? null : (
                      <span className="ml-2 rounded-full bg-[var(--color-gray-200)] px-2 py-0.5 text-xs text-[var(--color-gray-600)]">
                        черновик
                      </span>
                    )}
                    {c.archived ? (
                      <span className="ml-2 rounded-full bg-[var(--color-gold)]/15 px-2 py-0.5 text-xs font-medium text-[var(--color-gold)]">
                        в архиве
                      </span>
                    ) : null}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-sm">
                  <Link
                    href={`/education/${c.slug}`}
                    target="_blank"
                    className="text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]"
                  >
                    Открыть
                  </Link>
                  <Link
                    href={`/doctor/courses/${c.slug}/edit`}
                    className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
                  >
                    Изменить
                  </Link>
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
import Link from "next/link";
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";
import { signOut } from "@/app/admin/actions";
import { roleHome } from "@/lib/role-home";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  if (!["doctor", "admin"].includes(user.role)) {
    redirect(roleHome(user.role));
  }

  const profile = await queryOne<{ full_name: string | null }>(
    `select full_name from profiles where id = $1`,
    [user.id]
  );

  // Раздел «Мои курсы» доступен сотрудникам и спикерам (карточка is_speaker).
  let canCourses = ["admin", "editor"].includes(user.role);
  if (!canCourses && user.doctorSlug) {
    const card = await queryOne<{ is_speaker: boolean }>(
      `select is_speaker from team_members where slug = $1`,
      [user.doctorSlug]
    );
    canCourses = Boolean(card?.is_speaker);
  }

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      <header className="border-b border-[var(--color-gray-200)] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/doctor" className="font-semibold text-[var(--color-navy)]">
              Lucenta · Врач
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                href="/doctor"
                className="font-medium text-[var(--color-navy)] hover:text-[var(--color-navy-secondary)]"
              >
                Мои кейсы
              </Link>
              {canCourses ? (
                <Link
                  href="/doctor/courses"
                  className="font-medium text-[var(--color-gold)] hover:opacity-80"
                >
                  Мои курсы
                </Link>
              ) : null}
            </nav>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-[var(--color-gray-500)]">
              {profile?.full_name || user.email}
            </span>
            <form action={signOut}>
              <button className="font-medium text-[var(--color-navy-secondary)] hover:text-[var(--color-navy)]">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
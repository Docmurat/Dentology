import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/admin/actions";
import { roleHome } from "@/lib/role-home";

export default async function DoctorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, doctor_slug")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/admin/login");
  if (!["doctor", "admin"].includes(profile.role)) {
    redirect(roleHome(profile.role));
  }

  // Раздел «Мои курсы» доступен сотрудникам и спикерам (карточка is_speaker).
  let canCourses = ["admin", "editor"].includes(profile.role);
  if (!canCourses && profile.doctor_slug) {
    const { data: card } = await supabase
      .from("team_members")
      .select("is_speaker")
      .eq("slug", profile.doctor_slug)
      .maybeSingle();
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
              {profile.full_name || user.email}
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
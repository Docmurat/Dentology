import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "@/app/admin/actions";
import { roleHome } from "@/lib/role-home";

export default async function CabinetLayout({
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
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/admin/login");
  if (!["patient", "admin"].includes(profile.role)) {
    redirect(roleHome(profile.role));
  }

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      <header className="border-b border-[var(--color-gray-200)] bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="font-semibold text-[var(--color-navy)]">
            Dentology · Личный кабинет
          </span>
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
      <main className="mx-auto max-w-4xl px-6 py-10">{children}</main>
    </div>
  );
}

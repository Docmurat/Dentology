// app/doctor/layout.tsx
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { getCurrentUser, canModerate } from "@/lib/auth-guards";
import { getNewLeadCount } from "@/lib/leads";
import { CabinetNav, type CabinetLink } from "@/components/admin/cabinet-nav";
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

  const links: CabinetLink[] = [{ href: "/doctor", label: "Мои кейсы" }];
  if (canCourses) {
    links.push({ href: "/doctor/courses", label: "Мои курсы" });
  }

  // Врач с галочкой модератора попадает в раздел заявок отсюда:
  // отдельного входа у него нет.
  if (canModerate(user)) {
    const newLeads = await getNewLeadCount();
    links.push({
      href: "/moderator",
      label: "Заявки и отзывы",
      badge: newLeads,
    });
  }

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      <CabinetNav
        brandTitle="Врач"
        brandHref="/doctor"
        userLabel={profile?.full_name || user.email}
        signOutAction={signOut}
        links={links}
      />

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
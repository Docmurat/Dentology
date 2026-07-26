// app/moderator/layout.tsx
import { redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { getCurrentUser, canModerate, isStaff } from "@/lib/auth-guards";
import { getNewLeadCount } from "@/lib/leads";
import { CabinetNav, type CabinetLink } from "@/components/admin/cabinet-nav";
import { signOut } from "@/app/admin/actions";
import { roleHome } from "@/lib/role-home";
import type { Metadata } from "next";
/**
 * Кабинет модератора — только заявки и отзывы.
 *
 * Общая админка сюда не подходит: человеку, который обрабатывает
 * обращения, кейсы, направления и конструктор главной не нужны,
 * а давать к ним доступ ради одного раздела неправильно.
 */
export const metadata: Metadata = {
  manifest: "/staff.webmanifest",
  robots: { index: false, follow: false },
};

export default async function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (!canModerate(user)) redirect(roleHome(user.role));

  const [profile, newLeads] = await Promise.all([
    queryOne<{ full_name: string | null }>(
      `select full_name from profiles where id = $1`,
      [user.id]
    ),
    getNewLeadCount(),
  ]);

  // Врач и сотрудник заходят сюда из своего кабинета — им нужен путь
  // обратно. У «чистого» модератора другого кабинета нет.
  let backLink: CabinetLink | undefined;
  if (isStaff(user)) {
    backLink = { href: "/admin", label: "← В админку" };
  } else if (user.role === "doctor") {
    backLink = { href: "/doctor", label: "← В кабинет врача" };
  }

  return (
    <div className="min-h-screen bg-[var(--color-gray-50)]">
      <CabinetNav
        brandTitle="Модерация"
        brandHref="/moderator"
        userLabel={profile?.full_name || user.email}
        signOutAction={signOut}
        backLink={backLink}
        links={[
          { href: "/moderator", label: "Заявки", badge: newLeads },
          { href: "/moderator/reviews", label: "Отзывы" },
        ]}
      />

      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
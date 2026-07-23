import { notFound } from "next/navigation";
import { TeamForm } from "@/components/admin/team-form";
import { TeamAccountForm } from "@/components/admin/team-account-form";
import { getTeamMemberBySlug } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";
import { emailToLogin } from "@/lib/auth-login";

export const dynamic = "force-dynamic";

type EditTeamMemberPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditTeamMemberPage({
  params,
}: EditTeamMemberPageProps) {
  const { slug } = await params;
  const member = await getTeamMemberBySlug(slug);
  if (!member) notFound();

  const directions = (await getDirections()).map((d) => ({
    slug: d.slug,
    label: d.title,
  }));

  // Управление аккаунтом — только администратору.
  const me = await getCurrentUser();
  const isAdmin = me?.role === "admin";

  let currentEmail: string | null = null;
  if (isAdmin) {
    const linked = await queryOne<{ email: string }>(
      `select email from profiles where doctor_slug = $1`,
      [slug]
    );
    currentEmail = linked?.email ?? null;
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Редактирование сотрудника
      </h1>
      <p className="mt-2 text-sm text-[var(--color-gray-600)]">{member.name}</p>

      <div className="mt-8 space-y-8">
        <TeamForm initial={member} directions={directions} />

        {isAdmin ? (
          <TeamAccountForm
            slug={member.slug}
            name={member.name}
            currentLogin={currentEmail ? emailToLogin(currentEmail) : null}
          />
        ) : null}
      </div>
    </div>
  );
}
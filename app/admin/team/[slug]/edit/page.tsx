import { notFound } from "next/navigation";
import { TeamForm } from "@/components/admin/team-form";
import { TeamAccountForm } from "@/components/admin/team-account-form";
import { getTeamMemberBySlug } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/lib/supabase-admin";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();
  const isAdmin = me?.role === "admin";

  let currentEmail: string | null = null;
  if (isAdmin) {
    const admin = createAdminClient();
    const { data: linked } = await admin
      .from("profiles")
      .select("id")
      .eq("doctor_slug", slug)
      .maybeSingle();
    if (linked) {
      const { data } = await admin.auth.admin.getUserById(linked.id);
      currentEmail = data.user?.email ?? null;
    }
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
import { notFound } from "next/navigation";
import { TeamForm } from "@/components/admin/team-form";
import { getTeamMemberBySlug } from "@/lib/team";

export const dynamic = "force-dynamic";

type EditTeamMemberPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditTeamMemberPage({
  params,
}: EditTeamMemberPageProps) {
  const { slug } = await params;
  const member = await getTeamMemberBySlug(slug);

  if (!member) {
    notFound();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Редактирование сотрудника
      </h1>
      <p className="mt-2 text-sm text-[var(--color-gray-600)]">{member.name}</p>

      <div className="mt-8">
        <TeamForm initial={member} />
      </div>
    </div>
  );
}

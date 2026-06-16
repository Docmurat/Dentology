import { notFound } from "next/navigation";
import { CaseForm } from "@/components/admin/case-form";
import { getCaseBySlugAuthed } from "@/lib/cases";
import { getTeamMembers } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function AdminEditCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getCaseBySlugAuthed(slug);
  if (!item) notFound();

  const team = await getTeamMembers();
  const doctors = team.map((d) => ({
    slug: d.slug,
    name: d.name,
    position: d.position,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Изменить кейс
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--color-gray-600)]">
        Правки администратора. Статус публикации не меняется.
      </p>

      <CaseForm doctors={doctors} initial={item} redirectTo="/admin/cases" />
    </div>
  );
}

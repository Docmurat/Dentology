import { notFound, redirect } from "next/navigation";
import { CaseForm } from "@/components/admin/case-form";
import { updateDoctorCase } from "../../../actions";
import { getCaseBySlugAuthed } from "@/lib/cases";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function DoctorEditCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  // Врач может править только свой кейс и только пока он на модерации.
  const guard = await queryOne<{ created_by: string | null; published: boolean }>(
    `select created_by, published from cases where slug = $1`,
    [slug]
  );

  if (!guard) notFound();
  if (guard.created_by !== user.id || guard.published) {
    redirect("/doctor");
  }

  const item = await getCaseBySlugAuthed(slug);
  if (!item) notFound();

  const team = await getTeamMembers();
  const doctors = team.map((d) => ({
    slug: d.slug,
    name: d.name,
    position: d.position,
  }));

  const directions = (await getDirections()).map((d) => ({
    slug: d.slug,
    label: d.title,
  }));

  const lockedDoctorSlug =
    user.doctorSlug && doctors.some((d) => d.slug === user.doctorSlug)
      ? user.doctorSlug
      : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Изменить кейс
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--color-gray-600)]">
        Кейс на модерации — изменения сохранятся и снова уйдут администратору.
      </p>

      <CaseForm
        doctors={doctors}
        directions={directions}
        initial={item}
        updateAction={updateDoctorCase}
        redirectTo="/doctor"
        lockedDoctorSlug={lockedDoctorSlug}
        doctorLocked
      />
    </div>
  );
}
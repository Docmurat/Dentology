import { notFound, redirect } from "next/navigation";
import { CaseForm } from "@/components/admin/case-form";
import { updateDoctorCase } from "../../../actions";
import { getCaseBySlugAuthed } from "@/lib/cases";
import { getTeamMembers } from "@/lib/team";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function DoctorEditCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Врач может править только свой кейс и только пока он на модерации.
  const { data: guard } = await supabase
    .from("cases")
    .select("created_by, published")
    .eq("slug", slug)
    .maybeSingle();

  if (!guard) notFound();
  if (guard.created_by !== user!.id || guard.published) {
    redirect("/doctor");
  }

  const item = await getCaseBySlugAuthed(slug);
  if (!item) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("doctor_slug")
    .eq("id", user!.id)
    .maybeSingle();

  const team = await getTeamMembers();
  const doctors = team.map((d) => ({
    slug: d.slug,
    name: d.name,
    position: d.position,
  }));

  const lockedDoctorSlug =
    profile?.doctor_slug && doctors.some((d) => d.slug === profile.doctor_slug)
      ? profile.doctor_slug
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
        initial={item}
        updateAction={updateDoctorCase}
        redirectTo="/doctor"
        lockedDoctorSlug={lockedDoctorSlug}
        doctorLocked
      />
    </div>
  );
}

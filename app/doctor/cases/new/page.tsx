import { CaseForm } from "@/components/admin/case-form";
import { createDoctorCase } from "../../actions";
import { getTeamMembers } from "@/lib/team";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function DoctorNewCasePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Подставляем врача-себя, только если аккаунт привязан к карточке и она есть.
  const lockedDoctorSlug =
    profile?.doctor_slug && doctors.some((d) => d.slug === profile.doctor_slug)
      ? profile.doctor_slug
      : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Новый кейс
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--color-gray-600)]">
        После сохранения кейс уйдёт на модерацию администратору.
      </p>

      <CaseForm
        doctors={doctors}
        createAction={createDoctorCase}
        redirectTo="/doctor"
        lockedDoctorSlug={lockedDoctorSlug}
        doctorLocked
      />
    </div>
  );
}

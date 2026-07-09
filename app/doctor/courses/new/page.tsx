import { redirect } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { createSpeakerCourse } from "../../course-actions";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function SpeakerNewCoursePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, doctor_slug")
    .eq("id", user.id)
    .maybeSingle();
  const isStaff = ["admin", "editor"].includes(profile?.role ?? "");
  const lockedDoctorSlug =
    !isStaff && profile?.doctor_slug ? profile.doctor_slug : undefined;

  const team = await getTeamMembers();
  const doctors = team
    .filter((m) => m.category === "doctor")
    .map((m) => ({ slug: m.slug, name: m.name }));
  const directions = (await getDirections()).map((d) => ({
    slug: d.slug,
    label: d.title,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Новый курс
      </h1>
      <p className="mb-8 mt-2 text-sm text-[var(--color-gray-600)]">
        Заполните данные курса. Порядок публикации задаёт администратор.
      </p>

      <CourseForm
        doctors={doctors}
        directions={directions}
        action={createSpeakerCourse}
        redirectTo="/doctor/courses"
        submitLabel="Создать курс"
        hideOrder
        lockedDoctorSlug={lockedDoctorSlug}
      />
    </div>
  );
}
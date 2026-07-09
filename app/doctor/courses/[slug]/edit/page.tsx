import { notFound, redirect } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { updateSpeakerCourse } from "../../../course-actions";
import { getCourseBySlugAdmin } from "@/lib/courses";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function SpeakerEditCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

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

  const course = await getCourseBySlugAdmin(slug);
  if (!course) notFound();

  // Спикер может править только свой курс; сотрудник — любой.
  if (!isStaff && course.createdBy !== user.id) redirect("/doctor/courses");

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
        Редактирование курса
      </h1>
      <p className="mb-8 mt-2 text-sm text-[var(--color-gray-600)]">
        Изменения появятся на странице обучения после сохранения.
      </p>

      <CourseForm
        doctors={doctors}
        directions={directions}
        initial={course}
        action={updateSpeakerCourse}
        redirectTo="/doctor/courses"
        submitLabel="Сохранить"
        hideOrder
        lockedDoctorSlug={lockedDoctorSlug}
      />
    </div>
  );
}
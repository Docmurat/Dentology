// app/doctor/courses/[slug]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { updateSpeakerCourse } from "../../../course-actions";
import { getCourseBySlugAdmin, canEditCourse } from "@/lib/courses";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { getCurrentUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function SpeakerEditCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const isStaff = ["admin", "editor"].includes(user.role);
  const lockedDoctorSlug =
    !isStaff && user.doctorSlug ? user.doctorSlug : undefined;

  const course = await getCourseBySlugAdmin(slug);
  if (!course) notFound();

  // Владение: курс мой, если я его создал ИЛИ он привязан к моей карточке
  // врача. Раньше здесь стояло `course.createdBy !== user.id`, и врач,
  // назначенный спикером курса, при нажатии «Изменить» получал редирект
  // обратно на список — со стороны это выглядело как неработающая кнопка.
  const allowed = await canEditCourse(slug, {
    id: user.id,
    role: user.role,
    doctorSlug: user.doctorSlug,
  });
  if (!allowed) redirect("/doctor/courses");

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
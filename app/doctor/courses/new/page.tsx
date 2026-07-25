// app/doctor/courses/new/page.tsx
import { redirect } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { createSpeakerCourse } from "../../course-actions";
import { getDoctors } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { getCurrentUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function SpeakerNewCoursePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const isStaff = ["admin", "editor"].includes(user.role);
  const lockedDoctorSlug =
    !isStaff && user.doctorSlug ? user.doctorSlug : undefined;

  // Только врачи: ассистент курс не ведёт.
  const doctors = (await getDoctors()).map((m) => ({
    slug: m.slug,
    name: m.name,
  }));
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
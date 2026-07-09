import { CourseForm } from "@/components/admin/course-form";
import { createCourse } from "../actions";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";

export const dynamic = "force-dynamic";

export default async function NewCoursePage() {
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
        Заполните данные курса. Спикера выберите из списка команды.
      </p>

      <CourseForm
        doctors={doctors}
        directions={directions}
        action={createCourse}
        redirectTo="/admin/education"
        submitLabel="Создать курс"
      />
    </div>
  );
}
import { notFound, redirect } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { updateCourse } from "../../actions";
import { getCourseBySlug } from "@/lib/courses";
import { getTeamMembers } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  const team = await getTeamMembers();
  const doctors = team
    .filter((m) => m.category === "doctor")
    .map((m) => ({ slug: m.slug, name: m.name }));

  async function action(formData: FormData) {
    "use server";
    await updateCourse(formData);
    redirect("/admin/education");
  }

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
        initial={course}
        action={action}
        submitLabel="Сохранить"
      />
    </div>
  );
}
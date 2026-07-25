// app/admin/education/[slug]/edit/page.tsx
import { notFound } from "next/navigation";
import { CourseForm } from "@/components/admin/course-form";
import { updateCourse } from "../../actions";
import { getCourseBySlug } from "@/lib/courses";
import { getDoctors } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";

export const dynamic = "force-dynamic";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) notFound();

  // Только врачи: спикером курса ассистент быть не может.
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
        Редактирование курса
      </h1>
      <p className="mb-8 mt-2 text-sm text-[var(--color-gray-600)]">
        Изменения появятся на странице обучения после сохранения. Незаполненные
        блоки на сайте не показываются.
      </p>

      <CourseForm
        doctors={doctors}
        directions={directions}
        initial={course}
        action={updateCourse}
        redirectTo="/admin/education"
        submitLabel="Сохранить"
      />
    </div>
  );
}
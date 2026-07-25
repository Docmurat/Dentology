// app/education/[slug]/preview/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView } from "@/components/education/course-view";
import { getCourseBySlugAdmin, canEditCourse } from "@/lib/courses";
import { getCurrentUser } from "@/lib/auth-guards";

// Предпросмотр всегда свежий и всегда персональный: нужно знать,
// кто смотрит. Именно поэтому он вынесен из публичного маршрута,
// который теперь кешируется.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Предпросмотр курса",
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CoursePreviewPage({ params }: Props) {
  const { slug } = await params;

  const course = await getCourseBySlugAdmin(slug);
  if (!course) notFound();

  const user = await getCurrentUser();
  // Посторонним отдаём 404, а не 403: существование черновика
  // не должно подтверждаться.
  if (!user) notFound();

  const isStaff = ["admin", "editor"].includes(user.role);

  // Владение: курс мой, если я его создал ИЛИ он привязан к моей карточке
  // врача. Раньше здесь сравнивался только createdBy, и врач, назначенный
  // спикером, получал 404 на предпросмотре собственного черновика.
  const allowed = await canEditCourse(slug, {
    id: user.id,
    role: user.role,
    doctorSlug: user.doctorSlug,
  });
  if (!allowed) notFound();

  return (
    <CourseView
      course={course}
      isDraftPreview={!course.published}
      draftBackHref={isStaff ? "/admin/education" : "/doctor/courses"}
    />
  );
}
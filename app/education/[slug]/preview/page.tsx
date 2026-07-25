// app/education/[slug]/preview/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView } from "@/components/education/course-view";
import { getCourseBySlugAdmin } from "@/lib/courses";
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
  const isStaff = user ? ["admin", "editor"].includes(user.role) : false;
  const isAuthor = Boolean(
    user && course.createdBy !== null && course.createdBy === user.id
  );

  // Посторонним отдаём 404, а не 403: существование черновика
  // не должно подтверждаться.
  if (!isStaff && !isAuthor) notFound();

  return (
    <CourseView
      course={course}
      isDraftPreview={!course.published}
      draftBackHref={isStaff ? "/admin/education" : "/doctor/courses"}
    />
  );
}
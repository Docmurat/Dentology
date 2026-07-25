// app/education/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseView } from "@/components/education/course-view";
import { getCourseBySlug, getPublishedCourses } from "@/lib/courses";

// Раньше здесь стоял force-dynamic из-за предпросмотра черновика: страница
// обязана была знать, кто её смотрит, и кеш отключался целиком. Предпросмотр
// переехал на /education/[slug]/preview, публичная страница живёт на ISR.
export const revalidate = 60;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const courses = await getPublishedCourses();
    return courses.map((c) => ({ slug: c.slug }));
  } catch {
    // База недоступна на сборке — страницы отрисуются по запросу.
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course || !course.published) return {};

  const description = course.description || undefined;
  const url = `/education/${slug}`;
  const image = course.quoteImage || undefined;

  return {
    title: `${course.title} — Обучение`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: course.title,
      description,
      url,
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: course.title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function CoursePage({ params }: Props) {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);

  // Архивные курсы остаются доступны по прямой ссылке: они пропадают
  // из списка /education, но связанные отзывы и ссылки продолжают работать.
  if (!course || !course.published) notFound();

  return <CourseView course={course} />;
}
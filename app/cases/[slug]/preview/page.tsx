// app/cases/[slug]/preview/page.tsx
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CaseView } from "@/components/cases/case-view";
import { getCaseBySlugAuthed, canEditCase } from "@/lib/cases";
import { getTeamMemberBySlug } from "@/lib/team";
import { getCurrentUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

// Предпросмотр кейса «как на сайте». Раньше доступ ограничивала RLS,
// теперь проверяем в коде: сотрудник видит любой кейс, врач — свой.
export default async function CasePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const isStaff = ["admin", "editor"].includes(user.role);
  const backHref = isStaff ? "/admin/cases" : "/doctor";

  const item = await getCaseBySlugAuthed(slug);
  if (!item) notFound();

  // Владение: кейс мой, если я его создал ИЛИ он привязан к моей карточке
  // врача. Раньше сравнивался только created_by, и врач не мог открыть
  // предпросмотр собственного кейса, заведённого администратором.
  // canEditCase сама пропускает сотрудников, отдельная ветка не нужна.
  const allowed = await canEditCase(slug, {
    id: user.id,
    role: user.role,
    doctorSlug: user.doctorSlug,
  });
  if (!allowed) notFound();

  const doctor = item.doctorSlug
    ? await getTeamMemberBySlug(item.doctorSlug)
    : null;

  return (
    <>
      <div className="flex items-center justify-between gap-4 bg-amber-100 px-4 py-2 text-sm text-amber-800">
        <span>Предпросмотр · так кейс будет выглядеть на сайте</span>
        <Link href={backHref} className="font-medium underline">
          ← к списку
        </Link>
      </div>
      <CaseView item={item} doctor={doctor} />
    </>
  );
}
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CaseView } from "@/components/cases/case-view";
import { getCaseBySlugAuthed } from "@/lib/cases";
import { getTeamMemberBySlug } from "@/lib/team";
import { queryOne } from "@/lib/db";
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

  // Не сотрудник видит только свой кейс.
  if (!isStaff) {
    const owner = await queryOne<{ created_by: string | null }>(
      `select created_by from cases where slug = $1`,
      [slug]
    );
    if (owner?.created_by !== user.id) notFound();
  }

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
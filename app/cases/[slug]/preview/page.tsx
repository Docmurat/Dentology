import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { CaseView } from "@/components/cases/case-view";
import { getCaseBySlugAuthed } from "@/lib/cases";
import { getTeamMemberBySlug } from "@/lib/team";

export const dynamic = "force-dynamic";

// Предпросмотр кейса «как на сайте». Доступ ограничен RLS:
// сотрудник видит любой кейс, автор — свой (в т.ч. на модерации).
export default async function CasePreviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Ссылка «к списку» — туда, откуда пришёл пользователь по роли.
  const backHref = ["admin", "editor"].includes(profile?.role ?? "")
    ? "/admin/cases"
    : "/doctor";

  const item = await getCaseBySlugAuthed(slug);
  if (!item) notFound();

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

// app/doctor/cases/[slug]/edit/page.tsx
import { notFound, redirect } from "next/navigation";
import { CaseForm } from "@/components/admin/case-form";
import { updateDoctorCase } from "../../../actions";
import { getCaseBySlugAuthed, canEditCase } from "@/lib/cases";
import { getTeamMembers } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { queryOne } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function DoctorEditCasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  const guard = await queryOne<{ published: boolean }>(
    `select published from cases where slug = $1`,
    [slug]
  );
  if (!guard) notFound();

  // Владение: кейс мой, если я его создал ИЛИ он привязан к моей карточке
  // врача. Раньше здесь стояло `guard.created_by !== user.id`, и врач,
  // назначенный автором кейса, при нажатии «Изменить» получал редирект
  // обратно на список — со стороны это выглядело как неработающая кнопка.
  const isOwner = await canEditCase(slug, {
    id: user.id,
    role: user.role,
    doctorSlug: user.doctorSlug,
  });

  // Опубликованный кейс врач не правит — это делает сотрудник через
  // админку. Условие повторяет проверку в updateDoctorCase: раньше
  // страница разворачивала даже администратора, хотя экшен его пропускал.
  const canEdit = user.role === "admin" || (isOwner && !guard.published);
  if (!canEdit) redirect("/doctor");

  const item = await getCaseBySlugAuthed(slug);
  if (!item) notFound();

  const team = await getTeamMembers();
  const doctors = team.map((d) => ({
    slug: d.slug,
    name: d.name,
    position: d.position,
  }));

  const directions = (await getDirections()).map((d) => ({
    slug: d.slug,
    label: d.title,
  }));

  const lockedDoctorSlug =
    user.doctorSlug && doctors.some((d) => d.slug === user.doctorSlug)
      ? user.doctorSlug
      : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Изменить кейс
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--color-gray-600)]">
        Кейс на модерации — изменения сохранятся и снова уйдут администратору.
      </p>

      <CaseForm
        doctors={doctors}
        directions={directions}
        initial={item}
        updateAction={updateDoctorCase}
        redirectTo="/doctor"
        lockedDoctorSlug={lockedDoctorSlug}
        doctorLocked
      />
    </div>
  );
}
// app/doctor/cases/new/page.tsx
import { redirect } from "next/navigation";
import { CaseForm } from "@/components/admin/case-form";
import { createDoctorCase } from "../../actions";
import { getDoctors } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";
import { getCurrentUser } from "@/lib/auth-guards";

export const dynamic = "force-dynamic";

export default async function DoctorNewCasePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");

  // Только врачи: ассистент клинический случай не ведёт.
  const doctors = (await getDoctors()).map((d) => ({
    slug: d.slug,
    name: d.name,
    position: d.position,
  }));
  const directions = (await getDirections()).map((d) => ({
    slug: d.slug,
    label: d.title,
  }));

  // Подставляем врача-себя, только если аккаунт привязан к карточке и она есть.
  const lockedDoctorSlug =
    user.doctorSlug && doctors.some((d) => d.slug === user.doctorSlug)
      ? user.doctorSlug
      : undefined;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Новый кейс
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--color-gray-600)]">
        После сохранения кейс уйдёт на модерацию администратору.
      </p>

      <CaseForm
        doctors={doctors}
        directions={directions}
        createAction={createDoctorCase}
        redirectTo="/doctor"
        lockedDoctorSlug={lockedDoctorSlug}
        doctorLocked
      />
    </div>
  );
}
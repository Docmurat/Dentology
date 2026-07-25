// app/admin/cases/new/page.tsx
import { CaseForm } from "@/components/admin/case-form";
import { getDoctors } from "@/lib/team";
import { getDirections } from "@/lib/directions-db";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  // Раньше здесь стоял teamData — статический демо-массив из lib/team-data.ts.
  // В списке врачей показывались пять выдуманных карточек вместо реальных,
  // и выбранный слаг мог не существовать в базе. Читаем из базы.
  const doctors = (await getDoctors()).map((doctor) => ({
    slug: doctor.slug,
    name: doctor.name,
    position: doctor.position,
  }));

  const directions = (await getDirections()).map((d) => ({
    slug: d.slug,
    label: d.title,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Новый клинический случай
      </h1>
      <p className="mt-2 text-sm text-[var(--color-gray-600)]">
        Заполните нужные поля. Незаполненные блоки не будут показаны на странице
        кейса.
      </p>

      <div className="mt-8">
        <CaseForm doctors={doctors} directions={directions} />
      </div>
    </div>
  );
}
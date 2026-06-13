import { teamData } from "@/lib/team-data";
import { CaseForm } from "@/components/admin/case-form";

export default function NewCasePage() {
  const doctors = teamData.map((doctor) => ({
    slug: doctor.slug,
    name: doctor.name,
    position: doctor.position,
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
        <CaseForm doctors={doctors} />
      </div>
    </div>
  );
}

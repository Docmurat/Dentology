import { notFound } from "next/navigation";
import { teamData } from "@/lib/team-data";
import { CaseForm } from "@/components/admin/case-form";
import { getCaseBySlug } from "@/lib/cases";

export const dynamic = "force-dynamic";

type EditCasePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function EditCasePage({ params }: EditCasePageProps) {
  const { slug } = await params;
  const item = await getCaseBySlug(slug);

  if (!item) {
    notFound();
  }

  const doctors = teamData.map((doctor) => ({
    slug: doctor.slug,
    name: doctor.name,
    position: doctor.position,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Редактирование кейса
      </h1>
      <p className="mt-2 text-sm text-[var(--color-gray-600)]">
        {item.title}
      </p>

      <div className="mt-8">
        <CaseForm doctors={doctors} initial={item} />
      </div>
    </div>
  );
}

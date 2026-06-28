import { notFound } from "next/navigation";
import { DirectionForm } from "@/components/admin/direction-form";
import { getDirectionBySlug } from "@/lib/directions-db";

export const dynamic = "force-dynamic";

export default async function EditDirectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const direction = await getDirectionBySlug(slug);
  if (!direction) notFound();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Изменить направление
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--color-gray-600)]">
        {direction.title}
      </p>

      <DirectionForm initial={direction} />
    </div>
  );
}
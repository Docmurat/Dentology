import { getDirections } from "@/lib/directions-db";
import { TeamForm } from "@/components/admin/team-form";

export const dynamic = "force-dynamic";

export default async function NewTeamMemberPage() {
  const directions = (await getDirections()).map((d) => ({
    slug: d.slug,
    label: d.title,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Новый сотрудник
      </h1>
      <p className="mt-2 text-sm text-[var(--color-gray-600)]">
        Заполните данные. Отметьте «ведущий специалист», чтобы карточка
        показывалась на главной и на странице направления.
      </p>

      <div className="mt-8">
        <TeamForm directions={directions} />
      </div>
    </div>
  );
}
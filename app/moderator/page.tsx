// app/moderator/page.tsx
import { LeadsBoard, isLeadStatus } from "@/components/admin/leads-board";

export const dynamic = "force-dynamic";

export default async function ModeratorLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status && isLeadStatus(status) ? status : null;

  return (
    <div>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
          Заявки
        </h1>
        <p className="text-sm text-[var(--color-gray-600)]">
          Обращения с форм сайта. Возьмите заявку в работу, чтобы коллеги
          видели, что ей занимаются.
        </p>
      </div>

      {/* Удаление заявок оставлено администратору: это персональные
          данные и след обращения пациента. */}
      <LeadsBoard active={active} basePath="/moderator" />
    </div>
  );
}
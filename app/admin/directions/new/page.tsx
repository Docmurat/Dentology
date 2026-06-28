import { DirectionForm } from "@/components/admin/direction-form";

export const dynamic = "force-dynamic";

export default function NewDirectionPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Новое направление
      </h1>
      <p className="mt-2 mb-6 text-sm text-[var(--color-gray-600)]">
        Структура — как у Эндодонтии. Заполненные блоки появятся на странице
        направления и в коллаже на главной.
      </p>

      <DirectionForm />
    </div>
  );
}
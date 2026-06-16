export const dynamic = "force-dynamic";

export default function CabinetPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">
        Личный кабинет
      </h1>
      <p className="mt-3 max-w-prose text-sm leading-7 text-[var(--color-gray-700)]">
        Здесь будет доступна информация по вашему лечению. В ближайшее время
        появится раздел контроля оплаты рассрочки — с графиком платежей и
        статусом по каждому взносу.
      </p>

      <div className="mt-6 rounded-2xl border border-dashed border-[var(--color-gray-200)] bg-white px-6 py-10 text-center">
        <p className="text-sm text-[var(--color-gray-500)]">
          Раздел в разработке.
        </p>
      </div>
    </div>
  );
}

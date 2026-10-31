import { getPriceListContent } from "@/lib/homepage";
import { PriceListEditor } from "@/components/admin/price-list-editor";

export const dynamic = "force-dynamic";

export default async function AdminPricesPage() {
  const content = await getPriceListContent();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[var(--color-navy)]">Цены</h1>
      <p className="mt-2 text-sm text-[var(--color-gray-600)]">
        Страница «Цены» на сайте (/prices). Раздел без позиций на сайте не
        показывается. Цены должны совпадать с прейскурантом клиники.
      </p>

      <div className="mt-8">
        <PriceListEditor initial={content} />
      </div>
    </div>
  );
}

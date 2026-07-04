import { getPageHeading, type PageHeadingKey } from "@/lib/page-content";
import { savePageHeading } from "@/app/admin/page-heading-actions";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

/**
 * Редактор заголовка страницы (PageHero). Серверный компонент:
 * сам подгружает текущий контент по ключу. Подключение = один тег.
 */
export async function PageHeadingEditor({ pageKey }: { pageKey: PageHeadingKey }) {
  const initial = await getPageHeading(pageKey);

  return (
    <details className="mt-8 mb-8 rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
      <summary className="cursor-pointer text-sm font-medium text-[var(--color-navy-secondary)]">
        Редактировать заголовок страницы
      </summary>

      <form action={savePageHeading} className="mt-4 space-y-4">
        <input type="hidden" name="pageKey" value={pageKey} />

        <div>
          <label className={labelCls}>Надзаголовок</label>
          <input name="eyebrow" defaultValue={initial.eyebrow} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Заголовок</label>
          <textarea
            name="title"
            rows={2}
            defaultValue={initial.title}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Описание</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={initial.description}
            className={inputCls}
          />
        </div>

        <button
          type="submit"
          style={{ color: "#ffffff" }}
          className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          Сохранить заголовок
        </button>
      </form>
    </details>
  );
}
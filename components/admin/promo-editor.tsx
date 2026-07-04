import { savePromoContent } from "@/app/admin/homepage/actions";
import type { PromoContent } from "@/lib/homepage";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function PromoEditor({ initial }: { initial: PromoContent }) {
  return (
    <form action={savePromoContent} className="space-y-4">
      <div>
        <label className={labelCls}>Подпись (например «Акция», «Важно»)</label>
        <input name="eyebrow" defaultValue={initial.eyebrow} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Текст</label>
        <textarea
          name="text"
          rows={3}
          defaultValue={initial.text}
          className={inputCls}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Текст ссылки</label>
          <input
            name="linkLabel"
            defaultValue={initial.linkLabel}
            className={inputCls}
            placeholder="Подробнее"
          />
        </div>
        <div>
          <label className={labelCls}>Ссылка (URL или /путь)</label>
          <input
            name="linkHref"
            defaultValue={initial.linkHref}
            className={inputCls}
            placeholder="/contacts или https://…"
          />
        </div>
      </div>

      <p className="text-xs text-[var(--color-gray-500)]">
        Если оставить ссылку пустой — кнопка не показывается. Блок по умолчанию
        выключен: включите его переключателем «Показать», когда нужна плашка.
      </p>

      <button
        type="submit"
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90"
      >
        Сохранить плашку
      </button>
    </form>
  );
}
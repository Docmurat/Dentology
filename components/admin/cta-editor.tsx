import { saveCtaContent } from "@/app/admin/homepage/actions";
import type { CtaContent } from "@/lib/homepage";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function CtaEditor({ initial }: { initial: CtaContent }) {
  return (
    <form action={saveCtaContent} className="space-y-4">
      <div>
        <label className={labelCls}>Заголовок</label>
        <textarea name="title" rows={2} defaultValue={initial.title} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Абзац 1</label>
        <textarea name="text1" rows={3} defaultValue={initial.text1} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Абзац 2</label>
        <textarea name="text2" rows={2} defaultValue={initial.text2} className={inputCls} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Кнопка 1 (текст)</label>
          <input name="primaryLabel" defaultValue={initial.primaryLabel} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Кнопка 2 (текст)</label>
          <input name="secondaryLabel" defaultValue={initial.secondaryLabel} className={inputCls} />
        </div>
      </div>

      <button
        type="submit"
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90"
      >
        Сохранить блок
      </button>
    </form>
  );
}
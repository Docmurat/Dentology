import { saveAboutContent } from "@/app/admin/homepage/actions";
import type { AboutContent } from "@/lib/homepage";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function AboutEditor({ initial }: { initial: AboutContent }) {
  return (
    <form action={saveAboutContent} className="space-y-4">
      <div>
        <label className={labelCls}>Надзаголовок</label>
        <input name="eyebrow" defaultValue={initial.eyebrow} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Основной текст</label>
        <textarea
          name="text1"
          rows={4}
          defaultValue={initial.text1}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Текст снизу</label>
        <textarea
          name="text2"
          rows={2}
          defaultValue={initial.text2}
          className={inputCls}
        />
      </div>

      <button
        type="submit"
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90"
      >
        Сохранить «О Lucenta»
      </button>
    </form>
  );
}
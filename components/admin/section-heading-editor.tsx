import { saveSectionHeadingContent } from "@/app/admin/homepage/actions";
import type { SectionHeadingContent } from "@/lib/homepage";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function SectionHeadingEditor({
  blockKey,
  initial,
}: {
  blockKey: string;
  initial: SectionHeadingContent;
}) {
  return (
    <form action={saveSectionHeadingContent} className="space-y-4">
      <input type="hidden" name="blockKey" value={blockKey} />

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

      <p className="text-xs text-[var(--color-gray-500)]">
        Карточки этого блока берутся из своего раздела админки — здесь только
        текст заголовка.
      </p>

      <button
        type="submit"
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90"
      >
        Сохранить заголовок
      </button>
    </form>
  );
}
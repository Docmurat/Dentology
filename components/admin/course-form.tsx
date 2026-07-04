import type { Course } from "@/lib/courses";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

type DoctorOption = { slug: string; name: string };
type DirectionOption = { slug: string; label: string };
type CourseAction = (formData: FormData) => void | Promise<void>;

export function CourseForm({
  doctors,
  directions,
  initial,
  action,
  submitLabel,
}: {
  doctors: DoctorOption[];
  directions: DirectionOption[];
  initial?: Course;
  action: CourseAction;
  submitLabel: string;
}) {
  const selectedDirs = new Set(initial?.directionSlugs ?? []);
  return (
    <form action={action} className="max-w-2xl space-y-5">
      {initial ? (
        <input type="hidden" name="originalSlug" value={initial.slug} />
      ) : null}

      <div>
        <label className={labelCls}>Название курса</label>
        <input
          name="title"
          required
          defaultValue={initial?.title ?? ""}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Краткое описание (для карточки)</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Ведущий врач</label>
        <select
          name="doctorSlug"
          defaultValue={initial?.doctorSlug ?? ""}
          className={inputCls}
        >
          <option value="">— выберите врача —</option>
          {doctors.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--color-gray-500)]">
          Фото (в формате 3:4) и ФИО берутся из карточки выбранного врача.
        </p>
      </div>

      <div>
        <label className={labelCls}>Направления кейсов (для блока «Клинические случаи»)</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {directions.map((d) => (
            <label
              key={d.slug}
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-gray-200)] px-3 py-1.5 text-sm text-[var(--color-navy)]"
            >
              <input
                type="checkbox"
                name="directionSlug"
                value={d.slug}
                defaultChecked={selectedDirs.has(d.slug)}
              />
              {d.label}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-[var(--color-gray-500)]">
          Кейсы на странице курса — только ведущего врача и по выбранным
          направлениям. Если ничего не выбрано, блок кейсов скрыт.
        </p>
      </div>

      <div className="rounded-xl border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] p-4">
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Метрика по зубам (на странице курса)
        </p>
        <p className="mt-1 text-xs text-[var(--color-gray-500)]">
          Оставьте «Пролечено» пустым, чтобы скрыть блок. «Сохранено, %»
          считается автоматически как 100 − радикальный подход.
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Пролечено зубов</label>
            <input
              name="metricTreated"
              defaultValue={initial?.metricTreated || "5 000+"}
              className={inputCls}
              placeholder="5 000+"
            />
          </div>
          <div>
            <label className={labelCls}>Радикальный подход, % (удаление/резекция)</label>
            <input
              type="number"
              name="metricRadical"
              min={0}
              max={100}
              defaultValue={initial?.metricRadical || 2}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Порядок (меньше — выше)</label>
          <input
            type="number"
            name="sortOrder"
            defaultValue={initial?.sortOrder ?? 0}
            className={inputCls}
          />
        </div>
        <label className="mt-6 inline-flex items-center gap-2 text-sm text-[var(--color-navy)]">
          <input
            type="checkbox"
            name="published"
            defaultChecked={initial ? initial.published : true}
          />
          Опубликован
        </label>
      </div>

      <button
        type="submit"
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90"
      >
        {submitLabel}
      </button>
    </form>
  );
}
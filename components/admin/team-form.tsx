"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTeamMember, updateTeamMember } from "@/app/admin/team/actions";
import { CropField } from "@/components/admin/crop-field";
import { slugify } from "@/lib/slugify";
import { createClient } from "@/utils/supabase/client";
import type { TeamMember } from "@/lib/team-data";

const DIRECTIONS = [
  { slug: "endodontics", label: "Эндодонтия" },
  { slug: "implantation", label: "Имплантация" },
  { slug: "gnathology", label: "Гнатология" },
  { slug: "prosthetics", label: "Ортопедия" },
  { slug: "restoration", label: "Реставрация" },
];

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";
const cardCls =
  "rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 space-y-4";

const BUCKET = "team-images";

async function uploadBlob(
  supabase: ReturnType<typeof createClient>,
  slug: string,
  name: string,
  blob: Blob | null
): Promise<string | null> {
  if (!blob) return null;
  const path = `${slug}/${name}-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (error) throw new Error(`Не удалось загрузить фото: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function TeamForm({ initial }: { initial?: TeamMember }) {
  const router = useRouter();
  const supabase = createClient();

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [isLead, setIsLead] = useState<boolean>(initial?.isLead ?? false);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [diplomaBlob, setDiplomaBlob] = useState<Blob | null>(null);
  const [diplomaRemoved, setDiplomaRemoved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const slug =
        slugify(String(formData.get("slug") || "")) ||
        slugify(String(formData.get("name") || "")) ||
        initial?.slug ||
        `member-${Date.now()}`;

      // Фото уже обрезано до 4:3 в CropField — грузим blob.
      const uploadedUrl = photoBlob
        ? await uploadBlob(supabase, slug, "photo", photoBlob)
        : null;
      const image = photoRemoved ? "" : uploadedUrl ?? initial?.image ?? "";
      formData.set("image", image);

      const uploadedDiploma = diplomaBlob
        ? await uploadBlob(supabase, slug, "diploma", diplomaBlob)
        : null;
      const diploma = diplomaRemoved
        ? ""
        : uploadedDiploma ?? initial?.diplomaImage ?? "";
      formData.set("diplomaImage", diploma);

      const action = initial ? updateTeamMember : createTeamMember;
      const result = await action(formData);

      if (result.error) {
        setError(result.error);
        setSaving(false);
        return;
      }

      router.push("/admin/team");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {initial ? (
        <input type="hidden" name="originalSlug" value={initial.slug} />
      ) : null}

      {/* Основное */}
      <div className={cardCls}>
        <div>
          <label className={labelCls}>Имя</label>
          <input
            name="name"
            defaultValue={initial?.name}
            required
            className={inputCls}
            placeholder="Мурат Курджиев"
          />
        </div>

        <div>
          <label className={labelCls}>
            Имя в родительном падеже (для заголовка «Все кейсы …»)
          </label>
          <input
            name="nameGenitive"
            defaultValue={initial?.nameGenitive ?? ""}
            className={inputCls}
            placeholder="Мурата Курджиева"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Должность</label>
            <input
              name="position"
              defaultValue={initial?.position}
              className={inputCls}
              placeholder="Врач-имплантолог"
            />
          </div>
          <div>
            <label className={labelCls}>Slug (необязательно)</label>
            <input
              name="slug"
              defaultValue={initial?.slug}
              className={inputCls}
              placeholder="сгенерируется из имени"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Роль (подпись)</label>
            <input
              name="role"
              defaultValue={initial?.role}
              className={inputCls}
              placeholder="Имплантация и реабилитация"
            />
          </div>
          <div>
            <label className={labelCls}>Короткая роль</label>
            <input
              name="shortRole"
              defaultValue={initial?.shortRole}
              className={inputCls}
              placeholder="Имплантация"
            />
          </div>
        </div>
      </div>

      {/* Тексты */}
      <div className={cardCls}>
        <div>
          <label className={labelCls}>Краткое описание (для карточки)</label>
          <textarea
            name="excerpt"
            defaultValue={initial?.excerpt}
            rows={2}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Полное описание (для страницы)</label>
          <textarea
            name="description"
            defaultValue={initial?.description}
            rows={6}
            className={inputCls}
          />
        </div>
      </div>

      {/* Фото с кропом 4:3 — превью/миниатюра как в кейсах */}
      <div className={cardCls}>
        <div className="max-w-[180px]">
          <CropField
            label="Фотография (3:4, вертикальная)"
            aspect={3 / 4}
            existingUrl={initial?.image}
            onCropped={(blob) => setPhotoBlob(blob)}
            onRemovedToggle={setPhotoRemoved}
          />
        </div>
      </div>

      {/* Цитата врача */}
      <div className={cardCls}>
        <label className={labelCls}>Цитата врача (под фото)</label>
        <textarea
          name="quote"
          rows={3}
          defaultValue={initial?.quote ?? ""}
          className={inputCls}
          placeholder="Короткая цитата, которая покажется под фотографией"
        />
      </div>

      {/* Дополнительное образование */}
      <div className={cardCls}>
        <div>
          <label className={labelCls}>
            Пройденные курсы (по одному на строку: «Название, где пройден»)
          </label>
          <textarea
            name="courses"
            rows={5}
            defaultValue={initial?.courses?.join("\n") ?? ""}
            className={inputCls}
            placeholder={"Эндодонтия под микроскопом, Москва\nИмплантология, курс, Берлин"}
          />
        </div>
        <div>
          <label className={labelCls}>
            Диплом специалиста (кроп 4:3, горизонтально)
          </label>
          <div className="mt-2 max-w-[320px]">
            <CropField
              label="Картинка диплома"
              aspect={4 / 3}
              existingUrl={initial?.diplomaImage}
              onCropped={(blob) => setDiplomaBlob(blob)}
              onRemovedToggle={setDiplomaRemoved}
            />
          </div>
        </div>
      </div>

      {/* Счётчики (показатели) */}
      <div className={cardCls}>
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Счётчики на странице врача
        </p>
        <p className="text-xs text-[var(--color-gray-500)]">
          Значение и подпись. Например: «12» — «лет практики», «5000» —
          «пролеченных зубов». До трёх.
        </p>
        {[0, 1, 2].map((i) => (
          <div key={i} className="grid gap-3 sm:grid-cols-[160px_1fr]">
            <input
              name={`statValue${i + 1}`}
              defaultValue={initial?.stats?.[i]?.value ?? ""}
              className={inputCls}
              placeholder="напр. 12"
            />
            <input
              name={`statLabel${i + 1}`}
              defaultValue={initial?.stats?.[i]?.label ?? ""}
              className={inputCls}
              placeholder="напр. лет практики"
            />
          </div>
        ))}
      </div>

      {/* Клинический фокус / когда обратиться */}
      <div className={cardCls}>
        <div>
          <label className={labelCls}>
            Клинический фокус (по одному пункту на строку)
          </label>
          <textarea
            name="focusPoints"
            rows={4}
            defaultValue={initial?.focusPoints?.join("\n") ?? ""}
            className={inputCls}
            placeholder={"Работа со сложными случаями\nДиагностика и тактика лечения"}
          />
        </div>
        <div>
          <label className={labelCls}>
            Когда стоит обратиться (по одному пункту на строку)
          </label>
          <textarea
            name="visitPoints"
            rows={4}
            defaultValue={initial?.visitPoints?.join("\n") ?? ""}
            className={inputCls}
            placeholder={"Нужно экспертное мнение по сложному случаю\nРанее предложенное решение вызывает сомнения"}
          />
        </div>
      </div>

      {/* Иерархия и направления */}
      <div className={cardCls}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Категория</label>
            <select
              name="category"
              defaultValue={initial?.category ?? "doctor"}
              className={inputCls}
            >
              <option value="doctor">Врач</option>
              <option value="staff">Персонал</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Порядок (внутри группы)</label>
            <input
              name="sortOrder"
              type="number"
              defaultValue={initial?.sortOrder ?? 0}
              className={inputCls}
            />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-navy)]">
          <input
            type="checkbox"
            name="isChief"
            defaultChecked={initial?.isChief}
          />
          Главный врач (всегда первый, может быть только один)
        </label>

        <label className="flex items-center gap-2 text-sm text-[var(--color-navy)]">
          <input
            type="checkbox"
            name="isLead"
            checked={isLead}
            onChange={(e) => setIsLead(e.target.checked)}
          />
          Ведущий специалист направления
        </label>

        {isLead ? (
          <div>
            <label className={labelCls}>Ведущий по направлению</label>
            <select
              name="leadDirectionSlug"
              defaultValue={initial?.leadDirectionSlug ?? ""}
              className={inputCls}
            >
              <option value="">— выберите —</option>
              {DIRECTIONS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--color-gray-500)]">
              На каждое направление допускается один ведущий. Предыдущий ведущий
              этого направления будет снят автоматически.
            </p>
          </div>
        ) : null}

        <div>
          <label className={labelCls}>Участвует в направлениях</label>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {DIRECTIONS.map((d) => (
              <label
                key={d.slug}
                className="flex items-center gap-2 text-sm text-[var(--color-gray-700)]"
              >
                <input
                  type="checkbox"
                  name="directionSlugs"
                  value={d.slug}
                  defaultChecked={initial?.directionSlugs?.includes(d.slug)}
                />
                {d.label}
              </label>
            ))}
          </div>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={saving}
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-3 text-sm font-medium hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Сохранение…" : initial ? "Сохранить" : "Добавить сотрудника"}
      </button>
    </form>
  );
}
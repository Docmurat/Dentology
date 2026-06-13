"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCase, updateCase } from "@/app/admin/cases/actions";
import { slugify } from "@/lib/slugify";
import { createClient } from "@/utils/supabase/client";
import type { CaseItem } from "@/lib/cases-data";

type DoctorOption = { slug: string; name: string; position: string };

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

const BUCKET = "case-images";

async function uploadFile(
  supabase: ReturnType<typeof createClient>,
  slug: string,
  name: string,
  file: File | null
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${slug}/${name}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(`Не удалось загрузить ${name}: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function UploadIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

// Понятный кликабельный блок выбора файла (скрытый нативный input внутри label).
function FileField({
  name,
  multiple,
  hint,
}: {
  name: string;
  multiple?: boolean;
  hint: string;
}) {
  const [picked, setPicked] = useState<string[]>([]);

  return (
    <label className="mt-1 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-4 text-center text-sm text-[var(--color-gray-600)] transition hover:border-[var(--color-teal)] hover:bg-white hover:text-[var(--color-navy)]">
      <input
        name={name}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) =>
          setPicked(Array.from(e.target.files ?? []).map((f) => f.name))
        }
        className="hidden"
      />
      <span className="text-[var(--color-teal)]">
        <UploadIcon />
      </span>
      {picked.length ? (
        <span className="font-medium text-[var(--color-navy)]">
          {picked.length > 1 ? `Выбрано файлов: ${picked.length}` : picked[0]}
        </span>
      ) : (
        <span>{hint}</span>
      )}
    </label>
  );
}

function Thumb({ url }: { url: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt=""
      className="mt-2 h-20 w-20 rounded-lg border border-[var(--color-gray-200)] object-cover"
    />
  );
}

export function CaseForm({
  doctors,
  initial,
}: {
  doctors: DoctorOption[];
  initial?: CaseItem;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);

  const [coverRemoved, setCoverRemoved] = useState(false);
  const [beforeRemoved, setBeforeRemoved] = useState(false);
  const [afterRemoved, setAfterRemoved] = useState(false);
  const [protocolKeep, setProtocolKeep] = useState<string[]>(
    initial?.protocolImages ?? []
  );

  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSlug = isEdit
    ? initial!.slug
    : slugTouched
      ? slug
      : slugify(title);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const raw = new FormData(e.currentTarget);
    const finalSlug = isEdit
      ? initial!.slug
      : slugify(autoSlug) || `case-${Date.now()}`;

    try {
      const supabase = createClient();
      setStatus("Загрузка изображений…");

      async function resolveSingle(
        field: string,
        existing: string | undefined,
        removed: boolean
      ): Promise<string> {
        const uploaded = await uploadFile(
          supabase,
          finalSlug,
          field,
          raw.get(field) as File | null
        );
        if (uploaded) return uploaded;
        if (removed) return "";
        return existing ?? "";
      }

      const coverUrl = await resolveSingle(
        "coverImage",
        initial?.coverImage,
        coverRemoved
      );
      const beforeUrl = await resolveSingle(
        "imageBefore",
        initial?.imageBefore,
        beforeRemoved
      );
      const afterUrl = await resolveSingle(
        "imageAfter",
        initial?.imageAfter,
        afterRemoved
      );

      const newProtocolFiles = raw.getAll("protocolImages") as File[];
      const newProtocolUrls: string[] = [];
      for (let i = 0; i < newProtocolFiles.length; i++) {
        const url = await uploadFile(
          supabase,
          finalSlug,
          `protocol-${Date.now()}-${i + 1}`,
          newProtocolFiles[i]
        );
        if (url) newProtocolUrls.push(url);
      }
      const finalProtocols = [...protocolKeep, ...newProtocolUrls];

      setStatus("Сохранение…");
      const payload = new FormData();
      payload.set("slug", finalSlug);
      if (isEdit) payload.set("originalSlug", initial!.slug);
      for (const field of [
        "title",
        "excerpt",
        "doctorSlug",
        "directionSlug",
        "category",
        "status",
        "situation",
        "diagnostics",
        "decision",
        "result",
      ]) {
        payload.set(field, String(raw.get(field) || ""));
      }
      payload.set("coverImage", coverUrl);
      payload.set("imageBefore", beforeUrl);
      payload.set("imageAfter", afterUrl);
      finalProtocols.forEach((url) => payload.append("protocolImages", url));

      const result = isEdit
        ? await updateCase(payload)
        : await createCase(payload);

      if (result?.error) {
        setError(result.error);
        setStatus(null);
        setSubmitting(false);
        return;
      }

      router.push("/admin/cases");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить кейс");
      setStatus(null);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className={cardCls}>
        <div>
          <label className={labelCls}>Заголовок *</label>
          <input
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Slug (адрес страницы)</label>
          <input
            name="slug"
            value={autoSlug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            disabled={isEdit}
            className={`${inputCls} ${isEdit ? "opacity-60" : ""}`}
          />
          <p className="mt-1 text-xs text-[var(--color-gray-500)]">
            {isEdit
              ? "Адрес кейса менять нельзя, чтобы не ломать ссылки."
              : `Страница будет доступна по адресу /cases/${autoSlug || "…"}`}
          </p>
        </div>

        <div>
          <label className={labelCls}>Краткое описание</label>
          <textarea
            name="excerpt"
            rows={2}
            defaultValue={initial?.excerpt}
            className={inputCls}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Врач, ведущий случай</label>
            <select
              name="doctorSlug"
              defaultValue={initial?.doctorSlug ?? ""}
              className={inputCls}
            >
              <option value="">— не выбран —</option>
              {doctors.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name} ({d.position})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Направление</label>
            <select
              name="directionSlug"
              defaultValue={initial?.directionSlug ?? ""}
              className={inputCls}
            >
              <option value="">— не выбрано —</option>
              {DIRECTIONS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Категория</label>
            <input
              name="category"
              defaultValue={initial?.category}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Статус (опционально)</label>
            <input
              name="status"
              defaultValue={initial?.status}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div>
          <label className={labelCls}>Клиническая ситуация</label>
          <textarea
            name="situation"
            rows={4}
            defaultValue={initial?.situation}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Диагностика</label>
          <textarea
            name="diagnostics"
            rows={4}
            defaultValue={initial?.diagnostics}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Принятое решение</label>
          <textarea
            name="decision"
            rows={4}
            defaultValue={initial?.decision}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Результат</label>
          <textarea
            name="result"
            rows={4}
            defaultValue={initial?.result}
            className={inputCls}
          />
        </div>
      </div>

      <div className={cardCls}>
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Изображения
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Обложка</label>
            {initial?.coverImage && !coverRemoved ? (
              <>
                <Thumb url={initial.coverImage} />
                <label className="mt-1 flex items-center gap-2 text-xs text-[var(--color-gray-600)]">
                  <input
                    type="checkbox"
                    onChange={(e) => setCoverRemoved(e.target.checked)}
                  />
                  Удалить текущее
                </label>
              </>
            ) : null}
            <FileField name="coverImage" hint="Нажмите, чтобы выбрать файл" />
          </div>

          <div>
            <label className={labelCls}>Фото «До»</label>
            {initial?.imageBefore && !beforeRemoved ? (
              <>
                <Thumb url={initial.imageBefore} />
                <label className="mt-1 flex items-center gap-2 text-xs text-[var(--color-gray-600)]">
                  <input
                    type="checkbox"
                    onChange={(e) => setBeforeRemoved(e.target.checked)}
                  />
                  Удалить текущее
                </label>
              </>
            ) : null}
            <FileField name="imageBefore" hint="Нажмите, чтобы выбрать файл" />
          </div>

          <div>
            <label className={labelCls}>Фото «После»</label>
            {initial?.imageAfter && !afterRemoved ? (
              <>
                <Thumb url={initial.imageAfter} />
                <label className="mt-1 flex items-center gap-2 text-xs text-[var(--color-gray-600)]">
                  <input
                    type="checkbox"
                    onChange={(e) => setAfterRemoved(e.target.checked)}
                  />
                  Удалить текущее
                </label>
              </>
            ) : null}
            <FileField name="imageAfter" hint="Нажмите, чтобы выбрать файл" />
          </div>
        </div>

        <div>
          <label className={labelCls}>Протокол</label>

          {protocolKeep.length ? (
            <div className="mt-2 flex flex-wrap gap-3">
              {protocolKeep.map((url) => (
                <div key={url} className="relative">
                  <Thumb url={url} />
                  <button
                    type="button"
                    onClick={() =>
                      setProtocolKeep((prev) => prev.filter((u) => u !== url))
                    }
                    className="absolute -right-2 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                    aria-label="Удалить фото"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-2">
            <FileField
              name="protocolImages"
              multiple
              hint="Нажмите, чтобы добавить фото (можно несколько)"
            />
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting
            ? status || "Сохранение…"
            : isEdit
              ? "Сохранить изменения"
              : "Сохранить кейс"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/cases")}
          className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

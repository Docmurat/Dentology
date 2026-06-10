"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCase } from "../actions";
import { slugify } from "@/lib/slugify";
import { createClient } from "@/utils/supabase/client";

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

// Загрузка одного файла в Storage прямо из браузера → возвращает публичный URL.
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

export function CaseForm({ doctors }: { doctors: DoctorOption[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const autoSlug = slugTouched ? slug : slugify(title);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const raw = new FormData(e.currentTarget);
    const finalSlug = slugify(autoSlug) || `case-${Date.now()}`;

    try {
      const supabase = createClient();

      // 1) Загружаем картинки прямо в Storage.
      setStatus("Загрузка изображений…");
      const coverUrl = await uploadFile(
        supabase,
        finalSlug,
        "cover",
        raw.get("coverImage") as File | null
      );
      const beforeUrl = await uploadFile(
        supabase,
        finalSlug,
        "before",
        raw.get("imageBefore") as File | null
      );
      const afterUrl = await uploadFile(
        supabase,
        finalSlug,
        "after",
        raw.get("imageAfter") as File | null
      );

      const protocolFiles = raw.getAll("protocolImages") as File[];
      const protocolUrls: string[] = [];
      for (let i = 0; i < protocolFiles.length; i++) {
        const url = await uploadFile(
          supabase,
          finalSlug,
          `protocol-${i + 1}`,
          protocolFiles[i]
        );
        if (url) protocolUrls.push(url);
      }

      // 2) Отправляем в Server Action только текст + ссылки.
      setStatus("Сохранение…");
      const payload = new FormData();
      payload.set("slug", finalSlug);
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
      if (coverUrl) payload.set("coverImage", coverUrl);
      if (beforeUrl) payload.set("imageBefore", beforeUrl);
      if (afterUrl) payload.set("imageAfter", afterUrl);
      protocolUrls.forEach((url) => payload.append("protocolImages", url));

      const result = await createCase(payload);

      if (result?.error) {
        setError(result.error);
        setStatus(null);
        setSubmitting(false);
        return;
      }

      // 3) Успех — уходим в список.
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
            placeholder="генерируется из заголовка"
            className={inputCls}
          />
          <p className="mt-1 text-xs text-[var(--color-gray-500)]">
            Страница будет доступна по адресу /cases/{autoSlug || "…"}
          </p>
        </div>

        <div>
          <label className={labelCls}>Краткое описание</label>
          <textarea name="excerpt" rows={2} className={inputCls} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Врач, ведущий случай</label>
            <select name="doctorSlug" defaultValue="" className={inputCls}>
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
            <select name="directionSlug" defaultValue="" className={inputCls}>
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
            <input name="category" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Статус (опционально)</label>
            <input name="status" className={inputCls} />
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div>
          <label className={labelCls}>Клиническая ситуация</label>
          <textarea name="situation" rows={4} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Диагностика</label>
          <textarea name="diagnostics" rows={4} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Принятое решение</label>
          <textarea name="decision" rows={4} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Результат</label>
          <textarea name="result" rows={4} className={inputCls} />
        </div>
      </div>

      <div className={cardCls}>
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Изображения
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Обложка</label>
            <input
              name="coverImage"
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
            />
          </div>
          <div>
            <label className={labelCls}>Фото «До»</label>
            <input
              name="imageBefore"
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
            />
          </div>
          <div>
            <label className={labelCls}>Фото «После»</label>
            <input
              name="imageAfter"
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm"
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Протокол (можно несколько)</label>
          <input
            name="protocolImages"
            type="file"
            accept="image/*"
            multiple
            className="mt-1 block w-full text-sm"
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? status || "Сохранение…" : "Сохранить кейс"}
        </button>
      </div>
    </form>
  );
}
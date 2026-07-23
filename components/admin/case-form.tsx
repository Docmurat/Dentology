"use client";
import { ContentBlocksEditor } from "@/components/admin/content-blocks-editor";
import { CropField } from "@/components/admin/crop-field";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCase, updateCase } from "@/app/admin/cases/actions";
import { slugify } from "@/lib/slugify";
import { uploadImageBlob } from "@/lib/upload-client";
import type { CaseItem } from "@/lib/cases-data";

type DoctorOption = { slug: string; name: string; position: string };
type CaseAction = (
  formData: FormData
) => Promise<{ error?: string; slug?: string }>;

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";
const cardCls =
  "rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 space-y-4";

const COVER_ASPECT = 3 / 2;

// Загрузка через серверный экшен (Object Storage).
async function uploadBlob(
  slug: string,
  name: string,
  blob: Blob | null
): Promise<string | null> {
  if (!blob) return null;
  return uploadImageBlob(`case-images/${slug}`, blob, name);
}

export function CaseForm({
  doctors,
  directions,
  initial,
  createAction = createCase,
  updateAction = updateCase,
  redirectTo = "/admin/cases",
  lockedDoctorSlug,
  doctorLocked = false,
}: {
  doctors: DoctorOption[];
  directions: { slug: string; label: string }[];
  initial?: CaseItem;
  createAction?: CaseAction;
  updateAction?: CaseAction;
  redirectTo?: string;
  // slug врача, к которому привязан аккаунт (для роли доктора).
  lockedDoctorSlug?: string;
  // true — у роли доктора: выбор врача недоступен, врач = он сам.
  doctorLocked?: boolean;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(false);

  const [coverBlob, setCoverBlob] = useState<Blob | null>(null);
  const [beforeBlob, setBeforeBlob] = useState<Blob | null>(null);
  const [afterBlob, setAfterBlob] = useState<Blob | null>(null);
  const [coverRemoved, setCoverRemoved] = useState(false);
  const [beforeRemoved, setBeforeRemoved] = useState(false);
  const [afterRemoved, setAfterRemoved] = useState(false);

  const [baAspect, setBaAspect] = useState<number | "free" | null>(null);

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
      setStatus("Загрузка изображений…");

      async function resolveSingle(
        name: string,
        blob: Blob | null,
        existing: string | undefined,
        removed: boolean
      ): Promise<string> {
        const uploaded = await uploadBlob(finalSlug, name, blob);
        if (uploaded) return uploaded;
        if (removed) return "";
        return existing ?? "";
      }

      const coverUrl = await resolveSingle(
        "coverImage",
        coverBlob,
        initial?.coverImage,
        coverRemoved
      );
      const beforeUrl = await resolveSingle(
        "imageBefore",
        beforeBlob,
        initial?.imageBefore,
        beforeRemoved
      );
      const afterUrl = await resolveSingle(
        "imageAfter",
        afterBlob,
        initial?.imageAfter,
        afterRemoved
      );

      setStatus("Сохранение…");
      const payload = new FormData();
      payload.set("slug", finalSlug);
      if (isEdit) payload.set("originalSlug", initial!.slug);
      for (const field of [
        "title",
        "excerpt",
        "doctorSlug",
        "directionSlug",
        "doctorWords",
        "contentBlocks",
      ]) {
        payload.set(field, String(raw.get(field) || ""));
      }
      payload.set("coverImage", coverUrl);
      payload.set("imageBefore", beforeUrl);
      payload.set("imageAfter", afterUrl);

      const result = isEdit
        ? await updateAction(payload)
        : await createAction(payload);

      if (result?.error) {
        setError(result.error);
        setStatus(null);
        setSubmitting(false);
        return;
      }

      router.push(redirectTo);
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
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Изображения
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          <CropField
            label="Обложка (3:2)"
            aspect={COVER_ASPECT}
            existingUrl={initial?.coverImage}
            onCropped={(blob) => setCoverBlob(blob)}
            onRemovedToggle={setCoverRemoved}
          />

          <CropField
            label="Фото «До»"
            aspect={baAspect}
            existingUrl={initial?.imageBefore}
            onCropped={(blob, a) => {
              setBeforeBlob(blob);
              setBaAspect(a);
            }}
            onRemovedToggle={setBeforeRemoved}
          />

          <CropField
            label="Фото «После»"
            aspect={baAspect}
            existingUrl={initial?.imageAfter}
            onCropped={(blob, a) => {
              setAfterBlob(blob);
              setBaAspect(a);
            }}
            onRemovedToggle={setAfterRemoved}
          />
        </div>

        <p className="text-xs text-[var(--color-gray-500)]">
          Формат «до/после» задаёт та картинка, которую обрежете первой; вторая
          наследует его — у неё можно поменять только область кропа.
        </p>
      </div>

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

        {/* Slug нужен только сотрудникам; врачу его не показываем. */}
        {!doctorLocked ? (
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
        ) : null}

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
            {doctorLocked ? (
              lockedDoctorSlug ? (
                <>
                  <div className="mt-1 rounded-lg border border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-2 text-sm text-[var(--color-navy)]">
                    {doctors.find((d) => d.slug === lockedDoctorSlug)?.name ??
                      lockedDoctorSlug}
                  </div>
                  <input
                    type="hidden"
                    name="doctorSlug"
                    value={lockedDoctorSlug}
                  />
                  <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                    Кейс привязан к вам.
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xs text-[var(--color-gray-500)]">
                  Ваш аккаунт не привязан к карточке врача — кейс добавится без
                  врача, администратор укажет его при модерации.
                </p>
              )
            ) : (
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
            )}
          </div>

          <div>
            <label className={labelCls}>Направление</label>
            <select
              name="directionSlug"
              defaultValue={initial?.directionSlug ?? ""}
              className={inputCls}
            >
              <option value="">— не выбрано —</option>
              {directions.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ContentBlocksEditor initial={initial} />

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
          onClick={() => router.push(redirectTo)}
          className="text-sm text-[var(--color-gray-600)] hover:text-[var(--color-navy)]"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}
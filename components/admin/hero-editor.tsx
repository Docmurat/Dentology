"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CropField } from "@/components/admin/crop-field";
import { createClient } from "@/utils/supabase/client";
import { saveHeroContent } from "@/app/admin/homepage/actions";
import type { HeroContent } from "@/lib/homepage";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

const BUCKET = "team-images";

async function uploadBlob(
  supabase: ReturnType<typeof createClient>,
  blob: Blob
): Promise<string> {
  const path = `hero/photo-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function HeroEditor({ initial }: { initial: HeroContent }) {
  const router = useRouter();
  const supabase = createClient();

  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setDone(false);

    try {
      const formData = new FormData(e.currentTarget);

      // Фото: новое (blob) → грузим; удалено → пусто; иначе оставляем прежнее.
      let photo = initial.photo;
      if (photoBlob) photo = await uploadBlob(supabase, photoBlob);
      else if (photoRemoved) photo = "";
      formData.set("photo", photo);

      await saveHeroContent(formData);
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={labelCls}>Надзаголовок (eyebrow)</label>
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
        <label className={labelCls}>Подзаголовок</label>
        <textarea
          name="subtitle"
          rows={3}
          defaultValue={initial.subtitle}
          className={inputCls}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Карточка 1 — заголовок</label>
          <input name="card1Label" defaultValue={initial.card1Label} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Карточка 1 — значение</label>
          <input name="card1Value" defaultValue={initial.card1Value} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Карточка 2 — заголовок</label>
          <input name="card2Label" defaultValue={initial.card2Label} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Карточка 2 — значение</label>
          <input name="card2Value" defaultValue={initial.card2Value} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Фотография (кроп 3:4)</label>
        <div className="mt-2 max-w-[200px]">
          <CropField
            label="Фото Hero (3:4)"
            aspect={3 / 4}
            existingUrl={initial.photo}
            onCropped={(blob) => setPhotoBlob(blob)}
            onRemovedToggle={setPhotoRemoved}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Цитата (на фото)</label>
        <textarea
          name="quote"
          rows={2}
          defaultValue={initial.quote}
          className={inputCls}
        />
      </div>

      <div>
        <label className={labelCls}>Подпись под цитатой</label>
        <input
          name="quoteCaption"
          defaultValue={initial.quoteCaption}
          className={inputCls}
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {done ? <p className="text-sm text-[var(--color-teal)]">Сохранено.</p> : null}

      <button
        type="submit"
        disabled={saving}
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60"
      >
        {saving ? "Сохранение…" : "Сохранить Hero"}
      </button>
    </form>
  );
}
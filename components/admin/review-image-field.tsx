"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { setReviewImage } from "@/app/admin/reviews/actions";

const BUCKET = "review-images";

export function ReviewImageField({
  id,
  current,
}: {
  id: string;
  current: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(url: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("url", url);
    await setReviewImage(fd);
    router.refresh();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${id}/photo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      await save(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    await save("");
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-3">
      {current ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-100)] text-xs text-[var(--color-gray-400)]">
          фото
        </div>
      )}

      <label className="cursor-pointer text-sm font-medium text-[var(--color-navy)] underline-offset-2 hover:underline">
        {busy ? "Загрузка…" : current ? "Заменить фото" : "Добавить фото"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
          disabled={busy}
        />
      </label>

      {current ? (
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          Убрать
        </button>
      ) : null}

      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
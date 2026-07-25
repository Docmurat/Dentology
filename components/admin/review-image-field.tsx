// components/admin/review-image-field.tsx
"use client";

import { useState } from "react";
import { uploadImageFile } from "@/lib/upload-client";
import { compressImage } from "@/lib/image-compress";
import { setReviewImage } from "@/app/admin/reviews/actions";

export function ReviewImageField({
  id,
  current,
}: {
  id: string;
  current: string | null;
}) {
  const [url, setUrl] = useState<string | null>(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(next: string) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("url", next);
    await setReviewImage(fd);
    setUrl(next || null);
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      // Сжимаем перед загрузкой, чтобы в хранилище не попадали тяжёлые оригиналы.
      const compressed = await compressImage(file);
      const url = await uploadImageFile(
        `review-images/${id}`,
        compressed,
        "photo"
      );
      await save(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      await save("");
    } catch (err) {
      // Модератору могут отказать, если отзыв уже опубликован —
      // показываем причину вместо необработанной ошибки.
      setError(err instanceof Error ? err.message : "Не удалось убрать фото");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--color-gray-100)] text-xs text-[var(--color-gray-400)]">
          фото
        </div>
      )}

      <label className="cursor-pointer text-sm font-medium text-[var(--color-navy)] underline-offset-2 hover:underline">
        {busy ? "Загрузка…" : url ? "Заменить фото" : "Добавить фото"}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFile}
          disabled={busy}
        />
      </label>

      {url ? (
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
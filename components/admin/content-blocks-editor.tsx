"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import type { CaseItem, ContentBlock } from "@/lib/cases-data";

const MAX_BLOCKS = 10;
const BUCKET = "case-images";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

type EditableBlock = ContentBlock & { uid: string };

function emptyBlock(): EditableBlock {
  return {
    uid: crypto.randomUUID(),
    title: "",
    body: "",
    images: [],
    float: "none",
  };
}

// Загружаем фото сразу при выборе — в content_blocks хранятся уже готовые ссылки.
async function uploadBlockImage(
  supabase: ReturnType<typeof createClient>,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `blocks/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function ContentBlocksEditor({ initial }: { initial?: CaseItem }) {
  const supabase = createClient();

  const [doctorWords, setDoctorWords] = useState(initial?.doctorWords ?? "");
  const [blocks, setBlocks] = useState<EditableBlock[]>(
    initial?.contentBlocks?.length
      ? initial.contentBlocks.map((b) => ({ ...b, uid: crypto.randomUUID() }))
      : []
  );
  const [busy, setBusy] = useState(false);

  function patch(uid: string, data: Partial<EditableBlock>) {
    setBlocks((prev) =>
      prev.map((b) => (b.uid === uid ? { ...b, ...data } : b))
    );
  }

  function move(uid: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const i = prev.findIndex((b) => b.uid === uid);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  async function addImages(uid: string, files: FileList | null) {
    if (!files || !files.length) return;
    setBusy(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size === 0) continue;
        urls.push(await uploadBlockImage(supabase, file));
      }
      setBlocks((prev) =>
        prev.map((b) =>
          b.uid === uid ? { ...b, images: [...b.images, ...urls] } : b
        )
      );
    } catch (err) {
      alert(
        "Не удалось загрузить фото: " +
          (err instanceof Error ? err.message : "ошибка")
      );
    } finally {
      setBusy(false);
    }
  }

  // Сериализация для отправки: пустые блоки отбрасываем, uid убираем.
  const serialized: ContentBlock[] = blocks
    .filter((b) => b.title.trim() || b.body.trim() || b.images.length)
    .map(({ title, body, images, float }) => ({ title, body, images, float }));

  return (
    <div className="space-y-6">
      <input type="hidden" name="doctorWords" value={doctorWords} />
      <input
        type="hidden"
        name="contentBlocks"
        value={JSON.stringify(serialized)}
      />

      {/* Слова врача */}
      <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6">
        <label className={labelCls}>Слова врача (цитата)</label>
        <textarea
          rows={3}
          value={doctorWords}
          onChange={(e) => setDoctorWords(e.target.value)}
          placeholder="Короткая прямая речь врача о случае. Пусто — блок не показывается."
          className={inputCls}
        />
      </div>

      {/* Блоки описания */}
      <div className="space-y-6">
        {blocks.map((block, index) => (
          <div
            key={block.uid}
            className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[var(--color-navy)]">
                Блок {index + 1}
              </span>
              <div className="flex items-center gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => move(block.uid, -1)}
                  disabled={index === 0}
                  className="text-[var(--color-navy-secondary)] disabled:opacity-30"
                  aria-label="Выше"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(block.uid, 1)}
                  disabled={index === blocks.length - 1}
                  className="text-[var(--color-navy-secondary)] disabled:opacity-30"
                  aria-label="Ниже"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBlocks((prev) =>
                      prev.filter((b) => b.uid !== block.uid)
                    )
                  }
                  className="font-medium text-red-600 hover:text-red-700"
                >
                  Удалить
                </button>
              </div>
            </div>

            <div>
              <label className={labelCls}>Заголовок</label>
              <input
                value={block.title}
                onChange={(e) => patch(block.uid, { title: e.target.value })}
                className={inputCls}
                placeholder="Например: Протокол лечения"
              />
            </div>

            <div>
              <label className={labelCls}>Текст</label>
              <textarea
                rows={5}
                value={block.body}
                onChange={(e) => patch(block.uid, { body: e.target.value })}
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>Обтекание фото</label>
              <select
                value={block.float}
                onChange={(e) =>
                  patch(block.uid, {
                    float: e.target.value as ContentBlock["float"],
                  })
                }
                className={inputCls}
              >
                <option value="none">Без обтекания (сеткой во всю ширину)</option>
                <option value="left">Фото слева, текст справа</option>
                <option value="right">Фото справа, текст слева</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Фото блока</label>

              {block.images.length ? (
                <div className="mt-2 flex flex-wrap gap-3">
                  {block.images.map((url) => (
                    <div key={url} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="h-20 w-20 rounded-lg border border-[var(--color-gray-200)] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          patch(block.uid, {
                            images: block.images.filter((u) => u !== url),
                          })
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

              <label className="mt-2 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-[var(--color-gray-200)] bg-[var(--color-gray-50)] px-3 py-3 text-center text-sm text-[var(--color-gray-600)] transition hover:border-[var(--color-teal)] hover:bg-white">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => addImages(block.uid, e.target.files)}
                  className="hidden"
                />
                {busy ? "Загрузка…" : "Добавить фото (можно несколько)"}
              </label>
            </div>
          </div>
        ))}
      </div>

      {blocks.length < MAX_BLOCKS ? (
        <button
          type="button"
          onClick={() => setBlocks((prev) => [...prev, emptyBlock()])}
          className="w-full rounded-2xl border border-dashed border-[var(--color-gray-300)] bg-white px-4 py-4 text-sm font-medium text-[var(--color-navy)] transition hover:border-[var(--color-teal)] hover:bg-[var(--color-gray-50)]"
        >
          + Добавить блок ({blocks.length}/{MAX_BLOCKS})
        </button>
      ) : (
        <p className="text-center text-sm text-[var(--color-gray-500)]">
          Достигнут максимум — {MAX_BLOCKS} блоков.
        </p>
      )}
    </div>
  );
}

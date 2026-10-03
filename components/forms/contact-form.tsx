// components/forms/contact-form.tsx
"use client";

import { FormEvent, useId, useState } from "react";
import { compressImage } from "@/lib/image-compress";
import { XRAY_UPLOAD_ENABLED } from "@/lib/constants";

// Те же пределы, что проверяет сервер (lib/lead-files.ts). Здесь они
// нужны, чтобы сказать о проблеме сразу, а не после отправки.
const MAX_FILES = 3;
const MAX_FILE_BYTES = 10 * 1024 * 1024;

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
}

function isAcceptedFile(file: File): boolean {
  return file.type.startsWith("image/") || file.type === "application/pdf";
}

/**
 * Отправляет один файл к уже сохранённой заявке. Возвращает текст ошибки
 * или null при успехе.
 *
 * Фото перед отправкой уменьшается: снимок с телефона весит 3–8 МБ,
 * а для оценки хватает 2400 px по длинной стороне. PDF уходит как есть.
 */
async function uploadLeadFile(token: string, file: File): Promise<string | null> {
  const prepared = await compressImage(file, {
    maxDimension: 2400,
    quality: 0.88,
  });

  const data = new FormData();
  data.set("file", prepared, prepared.name);

  try {
    const response = await fetch("/api/contact/files", {
      method: "POST",
      // Пропуск — заголовком: сервер проверяет его до чтения файла.
      headers: { "x-upload-token": token },
      body: data,
    });

    if (response.ok) return null;

    // 413 без JSON — отказ веб-сервера по размеру, до приложения
    // запрос не дошёл.
    try {
      const result = (await response.json()) as ApiResponse;
      return result.message || "Не удалось загрузить файл.";
    } catch {
      return response.status === 413
        ? "Файл слишком большой."
        : "Не удалось загрузить файл.";
    }
  } catch {
    return "Не удалось загрузить файл: нет соединения.";
  }
}

type FormState = {
  name: string;
  phone: string;
  contactMethod: string;
  message: string;
};

type ApiResponse = {
  ok: boolean;
  message: string;
  // Пропуск на загрузку файлов к этой заявке (если файлы были заявлены).
  uploadToken?: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  contactMethod: "",
  message: "",
};

export function ContactForm({
  context,
  onSuccess,
}: {
  // Контекст заявки (напр. "Курс «Осознанная эндодонтия» — Индивидуальное").
  context?: string;
  // Вызывается после успешной отправки (для авто-закрытия модалки).
  onSuccess?: () => void;
}) {
  const [form, setForm] = useState<FormState>(initialState);
  const [consent, setConsent] = useState(false);
  // Антиспам: скрытое поле-ловушка и момент открытия формы.
  const [honeypot, setHoneypot] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Снимки. Выбор накапливается: второй выбор добавляет к первому.
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  // Отдельное согласие на обработку снимков: это сведения о здоровье,
  // общей галочки для них недостаточно.
  const [healthConsent, setHealthConsent] = useState(false);
  const fileInputId = useId();

  function addFiles(list: FileList | null) {
    if (!list?.length) return;
    setFileError("");

    const next = [...files];
    const problems: string[] = [];

    for (const file of Array.from(list)) {
      if (!isAcceptedFile(file)) {
        problems.push(`«${file.name}»: нужен JPG, PNG или PDF`);
        continue;
      }
      // Фото сожмётся перед отправкой, поэтому предел размера
      // проверяем только у PDF.
      if (file.type === "application/pdf" && file.size > MAX_FILE_BYTES) {
        problems.push(`«${file.name}»: больше 10 МБ`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        problems.push(`не больше ${MAX_FILES} файлов`);
        break;
      }
      next.push(file);
    }

    setFiles(next);
    if (problems.length) setFileError(`Не добавлено — ${problems.join("; ")}.`);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError("");
  }
  const [serverMessage, setServerMessage] = useState("");
  const [serverError, setServerError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    setServerMessage("");
    setServerError("");

    if (!form.name.trim() || !form.phone.trim()) {
      setServerError("Пожалуйста, укажите имя и телефон.");
      return;
    }

    if (!consent) {
      setServerError("Необходимо согласие на обработку персональных данных.");
      return;
    }

    if (files.length && !healthConsent) {
      setServerError("Подтвердите согласие на обработку снимков.");
      return;
    }

    setIsSubmitting(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          consent,
          context: context ?? "",
          filesCount: files.length,
          website: honeypot,
          startedAt,
        }),
        signal: controller.signal,
      });

      let result: ApiResponse | null = null;

      try {
        result = (await response.json()) as ApiResponse;
      } catch {
        throw new Error("Сервер вернул некорректный ответ.");
      }

      if (!response.ok || !result.ok) {
        setServerError(result.message || "Не удалось отправить форму.");
        return;
      }

      // Заявка сохранена. Теперь снимки — по одному, отдельными запросами:
      // если загрузка сорвётся, заявка всё равно уже у клиники.
      const failed: string[] = [];
      if (files.length) {
        if (result.uploadToken) {
          setIsUploading(true);
          for (const file of files) {
            const problem = await uploadLeadFile(result.uploadToken, file);
            if (problem) {
              failed.push(`«${file.name}» — ${problem.replace(/\.+$/, "")}`);
            }
          }
          setIsUploading(false);
        } else {
          failed.push("загрузка файлов сейчас недоступна");
        }
      }

      setForm(initialState);
      setConsent(false);
      setHealthConsent(false);
      setFiles([]);
      setFileError("");

      if (failed.length) {
        // Окно не закрываем: человек должен успеть прочитать, что снимок
        // не дошёл и как его передать иначе.
        setServerMessage("Заявка принята, мы свяжемся с вами.");
        setServerError(
          `Снимок загрузить не удалось: ${failed.join("; ")}. Пришлите его в мессенджер или возьмите с собой на приём.`
        );
        return;
      }

      setServerMessage(
        files.length
          ? "Заявка и снимки получены. Мы свяжемся с вами."
          : result.message || "Запрос успешно отправлен."
      );
      onSuccess?.();
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setServerError(
          "Сервер отвечает слишком долго. Попробуйте ещё раз или свяжитесь по телефону."
        );
      } else {
        setServerError(
          "Ошибка соединения. Попробуйте позже или свяжитесь по телефону."
        );
      }
    } finally {
      clearTimeout(timeout);
      setIsSubmitting(false);
      setIsUploading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      {context ? (
        <div className="rounded-xl bg-[var(--color-gray-50)] px-4 py-3 text-sm text-[var(--color-navy)]">
          Заявка по: <span className="font-medium">{context}</span>
        </div>
      ) : null}

      {/* Ловушка для ботов: человек это поле не видит и не заполняет.
          Не type="hidden" — часть скриптов такие поля пропускает. */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
      />

      {/* text-base на телефоне: при шрифте меньше 16px iOS Safari
          зумит страницу на фокусе и поле уезжает из виду. */}
      <input
        type="text"
        placeholder="Имя"
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-4 text-base outline-none transition focus:border-[var(--color-teal)] sm:text-sm"
      />

      <input
        type="tel"
        placeholder="Телефон"
        value={form.phone}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, phone: e.target.value }))
        }
        className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-4 text-base outline-none transition focus:border-[var(--color-teal)] sm:text-sm"
      />

      <input
        type="text"
        placeholder="Удобный способ связи"
        value={form.contactMethod}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, contactMethod: e.target.value }))
        }
        className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-4 text-base outline-none transition focus:border-[var(--color-teal)] sm:text-sm"
      />

      {XRAY_UPLOAD_ENABLED ? (
        <div>
          <label
            htmlFor={fileInputId}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-gray-300)] bg-[var(--color-gray-50)] px-4 py-4 text-sm font-medium text-[var(--color-navy)] transition hover:border-[var(--color-teal)] focus-within:border-[var(--color-teal)]"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 text-[var(--color-teal)]"
            >
              <path d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l8.57-8.57a4 4 0 0 1 5.66 5.66l-8.58 8.57a2 2 0 0 1-2.83-2.83l7.93-7.92" />
            </svg>
            {files.length ? "Добавить ещё снимок" : "Прикрепить снимок"}
            <input
              id={fileInputId}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="sr-only"
              // Сброс значения: иначе тот же файл нельзя выбрать повторно
              // после удаления из списка.
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>

          <p className="mt-2 text-xs leading-5 text-[var(--color-gray-500)]">
            Необязательно. До {MAX_FILES} файлов: фото снимка, JPG, PNG или PDF
            до 10 МБ. КТ целиком удобнее передать ссылкой в сообщении.
          </p>

          {files.length ? (
            <ul className="mt-3 space-y-2">
              {files.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-2.5 text-sm text-[var(--color-navy)]"
                >
                  <span className="min-w-0 truncate">
                    {file.name}
                    <span className="ml-2 text-[var(--color-gray-500)]">
                      {formatSize(file.size)}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    aria-label={`Убрать файл ${file.name}`}
                    className="shrink-0 text-sm font-medium text-[var(--color-gray-500)] hover:text-[#9B4C4C]"
                  >
                    Убрать
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

      <textarea
        placeholder="Кратко опишите ситуацию"
        rows={5}
        value={form.message}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, message: e.target.value }))
        }
        className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-4 text-base outline-none transition focus:border-[var(--color-teal)] sm:text-sm"
      />

          {fileError ? (
            <p className="mt-2 text-sm leading-6 text-[#9B4C4C]">{fileError}</p>
          ) : null}
        </div>
      ) : null}

      {files.length ? (
        <label className="flex items-start gap-2 text-xs leading-5 text-[var(--color-gray-600)]">
          <input
            type="checkbox"
            checked={healthConsent}
            onChange={(e) => setHealthConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Я согласен(на) на обработку прикреплённых снимков и сведений о
            состоянии здоровья для предварительной оценки врачом. Снимки
            доступны только сотрудникам клиники.
          </span>
        </label>
      ) : null}

      <label className="flex items-start gap-2 text-xs leading-5 text-[var(--color-gray-600)]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Я даю согласие на обработку персональных данных и подтверждаю
          ознакомление с{" "}
          <a
            href="/legal/privacy"
            target="_blank"
            className="underline hover:text-[var(--color-navy)]"
          >
            Политикой обработки персональных данных
          </a>
          .
        </span>
      </label>

      <button
        type="submit"
        disabled={
          isSubmitting || !consent || (files.length > 0 && !healthConsent)
        }
        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-teal)] px-6 py-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--color-teal-hover)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isUploading
          ? "Загружаем снимки..."
          : isSubmitting
            ? "Отправка..."
            : files.length
              ? "Отправить со снимком"
              : "Отправить запрос"}
      </button>

      {serverMessage ? (
        <p className="text-sm leading-6 text-[var(--color-navy-secondary)]">
          {serverMessage}
        </p>
      ) : null}

      {serverError ? (
        <p className="text-sm leading-6 text-[#9B4C4C]">{serverError}</p>
      ) : null}

      <p className="text-xs leading-6 text-[var(--color-gray-500)]">
        Ваши данные используются только для связи по поводу консультации.
      </p>
    </form>
  );
}
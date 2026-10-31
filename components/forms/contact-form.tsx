// components/forms/contact-form.tsx
"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { compressImage } from "@/lib/image-compress";
import { XRAY_UPLOAD_ENABLED } from "@/lib/constants";
import { COMPANY } from "@/lib/company";
import { uploadScan, type ScanProgress } from "@/lib/scan-upload";

// Те же пределы, что проверяет сервер (lib/lead-files.ts). Здесь они
// нужны, чтобы сказать о проблеме сразу, а не после отправки.
const MAX_FILES = 3;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_SCAN_BYTES = 1536 * 1024 * 1024;
const SCAN_EXTENSIONS = ["zip", "rar", "7z"];

function isScanArchive(file: File): boolean {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return SCAN_EXTENSIONS.includes(ext);
}

const SCAN_FALLBACK = `Перешлите архив или ссылку на него на ${COMPANY.email} — укажите имя и телефон.`;

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
      // Минута на файл: если сервер или хранилище не отвечают, человек
      // должен получить понятное сообщение, а не вечную «загрузку».
      signal: AbortSignal.timeout(60_000),
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
  onBusyChange,
}: {
  // Контекст заявки (напр. "Курс «Осознанная эндодонтия» — Индивидуальное").
  context?: string;
  // Вызывается после успешной отправки (для авто-закрытия модалки).
  onSuccess?: () => void;
  // Идёт отправка или загрузка: окно с формой закрывать нельзя.
  onBusyChange?: (busy: boolean) => void;
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
  // Архив КЛКТ — отдельно от снимков: другой путь загрузки и свой прогресс.
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanError, setScanError] = useState("");
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);
  const scanAbortRef = useRef<AbortController | null>(null);
  const scanInputId = useId();
  const hasAttachments = files.length > 0 || scanFile !== null;

  const busy = isSubmitting || isUploading;
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  // Пока грузятся файлы, браузер переспросит перед закрытием вкладки.
  useEffect(() => {
    if (!isUploading) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isUploading]);

  function pickScan(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    setScanError("");
    if (!isScanArchive(file)) {
      setScanError("Нужен архив .zip, .rar или .7z. Папку с КЛКТ сначала сожмите в zip.");
      return;
    }
    if (file.size > MAX_SCAN_BYTES) {
      setScanError(`Архив больше 1,5 ГБ. ${SCAN_FALLBACK}`);
      return;
    }
    setScanFile(file);
  }
  // Снимок нужен пациенту. В заявке на курс (её отправляет врач) поле
  // файла только мешает. Признак тот же, что у сервера: контекст
  // начинается со слова «Курс».
  const filesEnabled =
    XRAY_UPLOAD_ENABLED && !(context ?? "").trim().toLowerCase().startsWith("курс");

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

    if (hasAttachments && !healthConsent) {
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
          filesCount: files.length + (scanFile ? 1 : 0),
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
      // Заявка уже сохранена: дальше 15-секундный предел не нужен,
      // архив КЛКТ может грузиться десятки минут.
      clearTimeout(timeout);

      const failed: string[] = [];
      let scanFailed = "";
      if (hasAttachments) {
        if (result.uploadToken) {
          setIsUploading(true);
          for (const file of files) {
            const problem = await uploadLeadFile(result.uploadToken, file);
            if (problem) {
              failed.push(`«${file.name}» — ${problem.replace(/\.+$/, "")}`);
            }
          }
          if (scanFile) {
            const abort = new AbortController();
            scanAbortRef.current = abort;
            const problem = await uploadScan(
              result.uploadToken,
              scanFile,
              setScanProgress,
              abort.signal
            );
            scanAbortRef.current = null;
            if (problem) scanFailed = problem;
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
      setScanFile(null);
      setScanProgress(null);

      if (failed.length || scanFailed) {
        // Окно не закрываем: человек должен успеть прочитать, что файл
        // не дошёл и как его передать иначе.
        setServerMessage("Заявка принята, мы свяжемся с вами.");
        const parts: string[] = [];
        if (failed.length) {
          parts.push(
            `Снимок загрузить не удалось: ${failed.join("; ")}. Пришлите его в мессенджер или возьмите с собой на приём.`
          );
        }
        if (scanFailed) {
          parts.push(`КЛКТ не загрузился: ${scanFailed} ${SCAN_FALLBACK}`);
        }
        setServerError(parts.join(" "));
        return;
      }

      setServerMessage(
        hasAttachments
          ? "Заявка и файлы получены. Мы свяжемся с вами."
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

      {filesEnabled ? (
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
            Необязательно. До {MAX_FILES} файлов: фото прицельного снимка, JPG,
            PNG или PDF до 10 МБ.
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

          {fileError ? (
            <p className="mt-2 text-sm leading-6 text-[#9B4C4C]">{fileError}</p>
          ) : null}
        </div>
      ) : null}

      {filesEnabled ? (
        <div>
          {scanFile ? (
            <div className="rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-3 text-sm text-[var(--color-navy)]">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 truncate">
                  <span className="font-medium">КЛКТ:</span> {scanFile.name}
                  <span className="ml-2 text-[var(--color-gray-500)]">
                    {formatSize(scanFile.size)}
                  </span>
                </span>
                {scanProgress ? (
                  <button
                    type="button"
                    onClick={() => scanAbortRef.current?.abort()}
                    className="shrink-0 text-sm font-medium text-[var(--color-gray-500)] hover:text-[#9B4C4C]"
                  >
                    Отменить
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setScanFile(null)}
                    disabled={busy}
                    aria-label={`Убрать архив ${scanFile.name}`}
                    className="shrink-0 text-sm font-medium text-[var(--color-gray-500)] hover:text-[#9B4C4C] disabled:opacity-50"
                  >
                    Убрать
                  </button>
                )}
              </div>

              {scanProgress ? (
                <div className="mt-3">
                  <div
                    role="progressbar"
                    aria-label="Загрузка КЛКТ"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round((scanProgress.sent / scanProgress.total) * 100)}
                    className="h-2 overflow-hidden rounded-full bg-[var(--color-gray-100)]"
                  >
                    <div
                      className="h-full rounded-full bg-[var(--color-teal)] transition-[width] duration-300"
                      style={{
                        width: `${Math.max(2, (scanProgress.sent / scanProgress.total) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[var(--color-gray-600)]">
                    Загружено {formatSize(scanProgress.sent)} из{" "}
                    {formatSize(scanProgress.total)}. Не закрывайте страницу:
                    заявка уже у нас, а архив догружается.
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <label
              htmlFor={scanInputId}
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
                <path d="M21 8v13H3V8" />
                <path d="M1 3h22v5H1z" />
                <path d="M10 12h4" />
              </svg>
              Прикрепить КЛКТ (архив)
              <input
                id={scanInputId}
                type="file"
                accept=".zip,.rar,.7z,application/zip,application/x-zip-compressed,application/vnd.rar,application/x-rar-compressed,application/x-7z-compressed"
                className="sr-only"
                onChange={(e) => {
                  pickScan(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}

          {!scanProgress ? (
            <p className="mt-2 text-xs leading-5 text-[var(--color-gray-500)]">
              Лучше всего для оценки — КЛКТ. Архив .zip, .rar или .7z до 1,5 ГБ.
              Если КЛКТ на диске или в папке, сожмите папку в zip: правый клик →
              «Отправить» → «Сжатая ZIP-папка» (на Mac — «Сжать»). Если КЛКТ
              пришёл вам письмом или ссылкой, перешлите его на{" "}
              <a
                href={`mailto:${COMPANY.email}?subject=${encodeURIComponent("КЛКТ к заявке")}`}
                className="font-medium text-[var(--color-teal)] underline underline-offset-2"
              >
                {COMPANY.email}
              </a>
              .
            </p>
          ) : null}

          {scanError ? (
            <p className="mt-2 text-sm leading-6 text-[#9B4C4C]">{scanError}</p>
          ) : null}
        </div>
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

      {hasAttachments ? (
        <label className="flex items-start gap-2 text-xs leading-5 text-[var(--color-gray-600)]">
          <input
            type="checkbox"
            checked={healthConsent}
            onChange={(e) => setHealthConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Я согласен(на) на обработку прикреплённых снимков, КЛКТ и сведений
            о состоянии здоровья для предварительной оценки врачом. Файлы
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
          isSubmitting || !consent || (hasAttachments && !healthConsent)
        }
        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-teal)] px-6 py-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--color-teal-hover)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isUploading
          ? scanProgress
            ? "Загружаем КЛКТ..."
            : "Загружаем снимки..."
          : isSubmitting
            ? "Отправка..."
            : hasAttachments
              ? "Отправить с файлами"
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
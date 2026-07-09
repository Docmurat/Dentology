"use client";

import { FormEvent, useState } from "react";

type FormState = {
  name: string;
  phone: string;
  contactMethod: string;
  message: string;
};

type ApiResponse = {
  ok: boolean;
  message: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  contactMethod: "",
  message: "",
};

export function ContactForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setServerError(
        "Необходимо согласие на обработку персональных данных."
      );
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
        body: JSON.stringify({ ...form, consent }),
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

      setServerMessage(result.message || "Запрос успешно отправлен.");
      setForm(initialState);
      setConsent(false);
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
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Имя"
        value={form.name}
        onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
        className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-4 text-sm outline-none transition focus:border-[var(--color-teal)]"
      />

      <input
        type="tel"
        placeholder="Телефон"
        value={form.phone}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, phone: e.target.value }))
        }
        className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-4 text-sm outline-none transition focus:border-[var(--color-teal)]"
      />

      <input
        type="text"
        placeholder="Удобный способ связи"
        value={form.contactMethod}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, contactMethod: e.target.value }))
        }
        className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-4 text-sm outline-none transition focus:border-[var(--color-teal)]"
      />

      <textarea
        placeholder="Кратко опишите ситуацию"
        rows={5}
        value={form.message}
        onChange={(e) =>
          setForm((prev) => ({ ...prev, message: e.target.value }))
        }
        className="w-full rounded-xl border border-[var(--color-gray-200)] bg-white px-4 py-4 text-sm outline-none transition focus:border-[var(--color-teal)]"
      />

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
        disabled={isSubmitting || !consent}
        className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--color-teal)] px-6 py-4 text-sm font-medium text-white transition-colors duration-200 hover:bg-[var(--color-teal-hover)] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Отправка..." : "Отправить запрос"}
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
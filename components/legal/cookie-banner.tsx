"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";

const STORAGE_KEY = "dentology-cookie-consent";

// Подписка на изменения хранилища (в т.ч. из другой вкладки).
function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// Клиентское значение согласия: "1" — согласие есть, "" — нет.
function getSnapshot(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "1";
  }
}

// На сервере считаем, что согласие есть → баннер не мелькает до гидратации.
function getServerSnapshot(): string {
  return "1";
}

export function CookieBanner() {
  const consent = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );
  const [dismissed, setDismissed] = useState(false);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // если хранилище недоступно — просто скрываем баннер
      void 0;
    }
    setDismissed(true);
  }

  if (consent || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[900] p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-[var(--color-gray-200)] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:flex-row sm:items-center sm:gap-4">
        <p className="flex-1 text-xs leading-5 text-[var(--color-gray-600)]">
          Мы используем файлы cookie для корректной работы сайта и анализа
          посещаемости. Продолжая пользоваться сайтом, вы соглашаетесь с их
          использованием. Подробнее — в{" "}
          <Link
            href="/legal/privacy"
            className="underline hover:text-[var(--color-navy)]"
          >
            Политике обработки персональных данных
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          style={{ color: "#ffffff" }}
          className="shrink-0 rounded-xl bg-[var(--color-teal)] px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          Принять
        </button>
      </div>
    </div>
  );
}
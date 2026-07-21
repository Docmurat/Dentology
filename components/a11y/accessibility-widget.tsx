"use client";

import { useState } from "react";
import { createPortal } from "react-dom";

const FONT_KEY = "dentology-a11y-font";
const CONTRAST_KEY = "dentology-a11y-contrast";

type Opt = { value: string; label: string };
const FONT_OPTS: Opt[] = [
  { value: "normal", label: "А" },
  { value: "large", label: "А+" },
  { value: "xlarge", label: "А++" },
];
const CONTRAST_OPTS: Opt[] = [
  { value: "normal", label: "Обычная" },
  { value: "high", label: "Высокая" },
];

function chip(active: boolean): string {
  return active
    ? "rounded-lg bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white"
    : "rounded-lg border border-[var(--color-gray-200)] px-4 py-2 text-sm font-medium text-[var(--color-navy)] hover:border-[var(--color-navy)]";
}

export function AccessibilityWidget({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [font, setFont] = useState("normal");
  const [contrast, setContrast] = useState("normal");

  function openPanel() {
    // Синхронизируем подсветку с уже применёнными настройками (из <html>).
    const el = document.documentElement;
    setFont(el.getAttribute("data-a11y-font") || "normal");
    setContrast(el.getAttribute("data-a11y-contrast") || "normal");
    setOpen(true);
  }

  function applyFont(v: string) {
    document.documentElement.setAttribute("data-a11y-font", v);
    try {
      localStorage.setItem(FONT_KEY, v);
    } catch {
      void 0;
    }
    setFont(v);
  }

  function applyContrast(v: string) {
    document.documentElement.setAttribute("data-a11y-contrast", v);
    try {
      localStorage.setItem(CONTRAST_KEY, v);
    } catch {
      void 0;
    }
    setContrast(v);
  }

  function reset() {
    const el = document.documentElement;
    el.removeAttribute("data-a11y-font");
    el.removeAttribute("data-a11y-contrast");
    try {
      localStorage.removeItem(FONT_KEY);
      localStorage.removeItem(CONTRAST_KEY);
    } catch {
      void 0;
    }
    setFont("normal");
    setContrast("normal");
  }

  const panel = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--color-navy)]">
            Версия для слабовидящих
          </h3>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть"
            className="text-xl leading-none text-[var(--color-gray-400)] hover:text-[var(--color-navy)]"
          >
            ×
          </button>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-[var(--color-navy)]">
            Размер шрифта
          </p>
          <div className="mt-2 flex gap-2">
            {FONT_OPTS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => applyFont(o.value)}
                className={chip(font === o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-medium text-[var(--color-navy)]">
            Контрастность
          </p>
          <div className="mt-2 flex gap-2">
            {CONTRAST_OPTS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => applyContrast(o.value)}
                className={chip(contrast === o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={reset}
          className="mt-6 w-full rounded-lg border border-[var(--color-gray-200)] px-4 py-2.5 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]"
        >
          Сбросить настройки
        </button>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={openPanel}
        className={className || "underline hover:opacity-80"}
      >
        Версия для слабовидящих
      </button>
      {open ? createPortal(panel, document.body) : null}
    </>
  );
}
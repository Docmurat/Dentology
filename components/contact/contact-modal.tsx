"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ContactForm } from "@/components/forms/contact-form";

type Variant = "teal" | "gold" | "gold-outline" | "ticket";

const base =
  "inline-flex items-center justify-center rounded-xl px-6 py-4 text-sm font-medium transition";

function triggerClass(variant: Variant, className: string): string {
  const map: Record<Variant, string> = {
    teal: "bg-[var(--color-teal)] text-white hover:opacity-90",
    gold: "bg-[var(--color-gold)] text-white hover:opacity-90",
    "gold-outline":
      "border border-[var(--color-gold)] text-[var(--color-gold)] hover:bg-[var(--color-gold)]/10",
    ticket:
      "relative overflow-hidden bg-[var(--color-gold)] text-white hover:opacity-90",
  };
  return `${base} ${map[variant]} ${className}`.trim();
}

export function ContactButton({
  label = "Записаться на консультацию",
  context,
  variant = "teal",
  className = "",
  title = "Запись на консультацию",
  intro = "Оставьте контакты — с вами свяжутся для уточнения деталей.",
}: {
  label?: string;
  context?: string;
  variant?: Variant;
  className?: string;
  // Заголовок и подзаголовок модального окна.
  title?: string;
  intro?: string;
}) {
  const [open, setOpen] = useState(false);

  // Блокируем прокрутку фона, пока открыта модалка.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal = (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold text-[var(--color-navy)]">
            {title}
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

        <p className="mt-2 text-sm leading-6 text-[var(--color-gray-600)]">
          {intro}
        </p>

        <ContactForm
          context={context}
          onSuccess={() => setTimeout(() => setOpen(false), 2500)}
        />
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={variant === "gold-outline" ? undefined : { color: "#ffffff" }}
        className={triggerClass(variant, className)}
      >
        <span className="relative z-10">{label}</span>
        {variant === "ticket" ? (
          <span
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "45%",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0) 100%)",
              transform: "translateX(-160%) skewX(-20deg)",
              animation: "gold-sheen 4.5s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        ) : null}
      </button>

      {open ? createPortal(modal, document.body) : null}
    </>
  );
}
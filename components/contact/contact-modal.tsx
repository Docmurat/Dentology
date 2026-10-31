// components/contact/contact-modal.tsx
"use client";

import { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ContactForm } from "@/components/forms/contact-form";
import { useModalA11y } from "@/lib/use-modal-a11y";
import { typography } from "@/lib/typography";
import {
  PRIMARY_CTA_LABEL,
  PRIMARY_CTA_MODAL_INTRO,
  PRIMARY_CTA_MODAL_TITLE,
} from "@/lib/constants";

type Variant = "teal" | "gold" | "gold-outline" | "ticket";

const base = `inline-flex items-center justify-center rounded-xl px-6 py-4 ${typography.bodySm} font-medium transition`;

function triggerClass(variant: Variant, className: string): string {
  // gold-strong вместо gold там, где цвет несёт текст: обычный золотой
  // даёт 2.9:1 на белом и под белым текстом — ниже нормы AA (4.5:1).
  const map: Record<Variant, string> = {
    teal: "bg-[var(--color-teal)] text-white hover:opacity-90",
    gold: "bg-[var(--color-gold-strong)] text-white hover:opacity-90",
    "gold-outline":
      "border border-[var(--color-gold-strong)] text-[var(--color-gold-strong)] hover:bg-[var(--color-gold-strong)]/10",
    ticket:
      "relative overflow-hidden bg-[var(--color-gold-strong)] text-white hover:opacity-90",
  };
  return `${base} ${map[variant]} ${className}`.trim();
}

/**
 * Само окно вынесено в отдельный компонент: хук доступности должен
 * монтироваться вместе с окном, а не жить в кнопке постоянно.
 */
function ContactModal({
  title,
  intro,
  context,
  onClose,
}: {
  title: string;
  intro: string;
  context?: string;
  onClose: () => void;
}) {
  // Пока форма отправляет заявку или грузит файлы, окно не закрывается:
  // ни крестиком, ни кликом мимо, ни клавишей Escape. Иначе загрузка
  // КЛКТ оборвалась бы молча.
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);
  const onBusyChange = useCallback((value: boolean) => {
    busyRef.current = value;
    setBusy(value);
  }, []);
  const safeClose = useCallback(() => {
    if (!busyRef.current) onClose();
  }, [onClose]);

  const ref = useModalA11y<HTMLDivElement>(safeClose);
  const titleId = useId();

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4"
      onClick={safeClose}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        // dvh вместо vh: на iOS при открытой клавиатуре vh считается
        // от полной высоты экрана, и низ формы уезжает под клавиатуру.
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 id={titleId} className={`${typography.h4} text-[var(--color-navy)]`}>
            {title}
          </h3>
          <button
            type="button"
            onClick={safeClose}
            disabled={busy}
            aria-label="Закрыть"
            className="text-xl leading-none text-[var(--color-gray-400)] hover:text-[var(--color-navy)] disabled:opacity-30"
          >
            ×
          </button>
        </div>

        <p className={`mt-2 ${typography.bodySm} text-[var(--color-gray-600)]`}>
          {intro}
        </p>

        <ContactForm
          context={context}
          onSuccess={() => setTimeout(onClose, 2500)}
          onBusyChange={onBusyChange}
        />
      </div>
    </div>
  );
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

      {open
        ? createPortal(
            <ContactModal
              title={title}
              intro={intro}
              context={context}
              onClose={() => setOpen(false)}
            />,
            document.body
          )
        : null}
    </>
  );
}

/**
 * Главная кнопка сайта: «Отправить снимок на оценку».
 *
 * Та же форма, что и у ContactButton, но окно сразу объясняет, что делать
 * со снимком. Подпись можно переопределить (её редактируют в админке
 * в блоке «Призыв к действию»).
 */
export function PrimaryCtaButton({
  label = PRIMARY_CTA_LABEL,
  context,
  variant = "teal",
  className = "",
}: {
  label?: string;
  context?: string;
  variant?: Variant;
  className?: string;
}) {
  return (
    <ContactButton
      label={label}
      context={context}
      variant={variant}
      className={className}
      title={PRIMARY_CTA_MODAL_TITLE}
      intro={PRIMARY_CTA_MODAL_INTRO}
    />
  );
}

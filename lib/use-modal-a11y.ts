// lib/use-modal-a11y.ts
"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Доступность модального окна. Вызывать в компоненте, который
 * монтируется только когда окно открыто.
 *
 * Делает четыре вещи:
 *   1. блокирует прокрутку фона;
 *   2. закрывает окно по Escape;
 *   3. держит фокус внутри окна (Tab не уводит на страницу под ним);
 *   4. возвращает фокус на элемент, с которого окно открыли.
 *
 * Возвращает ref, который нужно повесить на контейнер окна.
 *
 * Осознанный компромисс: Escape закрывает окно всегда, даже если форма
 * заполнена. Это стандартное поведение диалога и требование доступности;
 * если понадобится защита от потери текста, сюда добавится флаг «форма
 * тронута», а не отключение Escape целиком.
 */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>(
  onClose: () => void
) {
  const ref = useRef<T>(null);

  // Держим колбэк в ref: иначе стрелочная функция из родителя
  // пересоздавалась бы каждый рендер и эффект перезапускался.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const node = ref.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusables = (): HTMLElement[] => {
      if (!node) return [];
      return Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );
    };

    // Фокус на первый интерактивный элемент, иначе — на само окно.
    const first = focusables()[0];
    if (first) first.focus();
    else node?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const items = focusables();
      if (!items.length) return;

      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && active === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return ref;
}
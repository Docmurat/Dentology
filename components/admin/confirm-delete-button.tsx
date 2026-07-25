// components/admin/confirm-delete-button.tsx
"use client";

import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Кнопка удаления в две ступени: первый клик «взводит» её, второй отправляет
 * форму. Нативный confirm() не используем — он блокируется в части браузеров
 * и не стилизуется.
 *
 * Рендерится строго внутри <form action={серверный экшен}>: подтверждающая
 * кнопка имеет type="submit", а состояние отправки берётся из useFormStatus.
 */
export function ConfirmDeleteButton({
  title,
  label = "Удалить",
  confirmLabel = "Точно удалить?",
  resetAfterMs = 5000,
  className = "text-sm text-red-600 hover:text-red-700",
}: {
  title: string;
  label?: string;
  confirmLabel?: string;
  resetAfterMs?: number;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();

  // Взведённое состояние сбрасывается само — иначе кнопка останется
  // «заряженной» и сработает от следующего случайного клика.
  useEffect(() => {
    if (!armed || pending) return;
    const timer = setTimeout(() => setArmed(false), resetAfterMs);
    return () => clearTimeout(timer);
  }, [armed, pending, resetAfterMs]);

  if (pending) {
    return (
      <span className="text-sm text-[var(--color-gray-500)]">Удаляем…</span>
    );
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        aria-label={`Удалить «${title}»`}
        className={className}
      >
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="submit"
        aria-label={`Подтвердить удаление «${title}»`}
        className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-xs text-[var(--color-gray-500)] hover:text-[var(--color-navy)]"
      >
        Отмена
      </button>
    </span>
  );
}
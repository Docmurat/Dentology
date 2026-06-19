"use client";

import { useActionState } from "react";
import {
  setPatientPassword,
  deletePatientAccount,
} from "@/app/admin/patients/actions";

type State = { error?: string; ok?: boolean };

const inputCls =
  "rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function PatientRow({
  id,
  email,
  fullName,
}: {
  id: string;
  email: string;
  fullName: string | null;
}) {
  const [pwState, pwAction, pwPending] = useActionState<State, FormData>(
    setPatientPassword,
    {}
  );

  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-[var(--color-navy)]">
            {fullName || "Без имени"}
          </p>
          <p className="text-sm text-[var(--color-gray-500)]">{email}</p>
        </div>

        <form action={deletePatientAccount}>
          <input type="hidden" name="userId" value={id} />
          <button
            type="submit"
            onClick={(e) => {
              if (!confirm("Удалить аккаунт пациента? Вход пропадёт."))
                e.preventDefault();
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Удалить аккаунт
          </button>
        </form>
      </div>

      <form action={pwAction} className="mt-4 flex items-end gap-2">
        <input type="hidden" name="userId" value={id} />
        <div className="flex-1">
          <label className="text-xs font-medium text-[var(--color-gray-600)]">
            Новый пароль (от 8 символов)
          </label>
          <input
            name="password"
            type="text"
            minLength={8}
            placeholder="••••••••"
            className={`mt-1 w-full ${inputCls}`}
          />
        </div>
        <button
          type="submit"
          disabled={pwPending}
          className="rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-gray-50)] disabled:opacity-60"
        >
          {pwState.ok ? "✓" : "Сменить"}
        </button>
      </form>

      {pwState.error ? (
        <p className="mt-2 text-sm text-red-600">{pwState.error}</p>
      ) : null}
      {pwState.ok ? (
        <p className="mt-2 text-sm text-green-700">Пароль изменён.</p>
      ) : null}
    </div>
  );
}
"use client";

import { useActionState } from "react";
import { createPatientAccount } from "@/app/admin/patients/actions";

type State = { error?: string; ok?: boolean };

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function CreatePatientForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    createPatientAccount,
    {}
  );

  return (
    <form
      action={action}
      className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6"
    >
      <p className="text-sm font-semibold text-[var(--color-navy)]">
        Новый аккаунт пациента
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className={labelCls}>Логин *</label>
          <input name="login" type="text" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>ФИО</label>
          <input name="fullName" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Пароль * (от 8 символов)</label>
          <input
            name="password"
            type="text"
            required
            minLength={8}
            className={inputCls}
          />
        </div>
      </div>

      {state.error ? (
        <p className="mt-3 text-sm text-red-600">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="mt-3 text-sm text-green-700">Аккаунт создан.</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Создаём…" : "Создать аккаунт"}
      </button>
    </form>
  );
}
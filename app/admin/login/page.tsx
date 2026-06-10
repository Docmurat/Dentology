"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

const initialState: { error?: string } = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-gray-50)] px-6">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--color-gray-200)] bg-white p-8 shadow-[0_8px_28px_rgba(0,0,0,0.06)]">
        <p className="text-sm uppercase tracking-[0.18em] text-[var(--color-teal)]">
          Dentology
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-navy)]">
          Личный кабинет
        </h1>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-[var(--color-navy)]">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-[var(--color-navy)]">
              Пароль
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]"
            />
          </div>

          {state?.error ? (
            <p className="text-sm text-red-600">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[var(--color-navy)] px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Вход…" : "Войти"}
          </button>
        </form>
      </div>
    </main>
  );
}

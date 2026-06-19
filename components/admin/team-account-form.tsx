"use client";

import { useActionState } from "react";
import {
  linkTeamAccount,
  unlinkTeamAccount,
} from "@/app/admin/team/account-actions";

type State = { error?: string; ok?: boolean };

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-sm outline-none focus:border-[var(--color-teal)]";

export function TeamAccountForm({
  slug,
  name,
  currentLogin,
}: {
  slug: string;
  name: string;
  currentLogin: string | null;
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    linkTeamAccount,
    {}
  );

  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--color-navy)]">
          Аккаунт для входа
        </p>
        {currentLogin ? (
          <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            привязан
          </span>
        ) : (
          <span className="rounded-full bg-[var(--color-gray-100)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-gray-500)]">
            не привязан
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-[var(--color-gray-500)]">
        Логин и пароль для входа этого сотрудника как врача. Менять может только
        администратор.
      </p>

      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="name" value={name} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Логин</label>
            <input
              name="login"
              type="text"
              required
              defaultValue={currentLogin ?? ""}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>
              {currentLogin ? "Новый пароль" : "Пароль *"}
            </label>
            <input
              name="password"
              type="text"
              minLength={8}
              placeholder={
                currentLogin
                  ? "оставьте пустым, чтобы не менять"
                  : "от 8 символов"
              }
              className={inputCls}
            />
          </div>
        </div>

        {state.error ? (
          <p className="text-sm text-red-600">{state.error}</p>
        ) : null}
        {state.ok ? (
          <p className="text-sm text-green-700">Аккаунт сохранён.</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : "Сохранить аккаунт"}
        </button>
      </form>

      {currentLogin ? (
        <form action={unlinkTeamAccount} className="mt-3">
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            className="text-sm text-[var(--color-gray-600)] hover:text-red-600"
          >
            Отвязать аккаунт
          </button>
        </form>
      ) : null}
    </div>
  );
}
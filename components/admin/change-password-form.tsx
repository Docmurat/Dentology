"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  changeOwnPassword,
  type ChangePasswordState,
} from "@/app/admin/account/actions";

const labelCls = "text-sm font-medium text-[var(--color-navy)]";
const inputCls =
  "mt-1 w-full rounded-lg border border-[var(--color-gray-200)] px-3 py-2 text-base outline-none focus:border-[var(--color-teal)] sm:text-sm";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changeOwnPassword, {});
  const formRef = useRef<HTMLFormElement>(null);

  // После успешной смены очищаем поля, чтобы пароль не висел в форме.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={action}
      className="space-y-4 rounded-2xl border border-[var(--color-gray-200)] bg-white p-6"
    >
      <p className="text-sm font-semibold text-[var(--color-navy)]">
        Сменить пароль
      </p>

      <div>
        <label className={labelCls} htmlFor="current">
          Текущий пароль
        </label>
        <input
          id="current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls} htmlFor="next">
          Новый пароль
        </label>
        <input
          id="next"
          name="next"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className={inputCls}
        />
        <p className="mt-1 text-xs text-[var(--color-gray-500)]">
          Не короче 10 символов.
        </p>
      </div>
      <div>
        <label className={labelCls} htmlFor="repeat">
          Новый пароль ещё раз
        </label>
        <input
          id="repeat"
          name="repeat"
          type="password"
          autoComplete="new-password"
          minLength={10}
          required
          className={inputCls}
        />
      </div>

      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-green-700" role="status">
          Пароль изменён. В следующий раз входите с новым паролем.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        style={{ color: "#ffffff" }}
        className="rounded-lg bg-[var(--color-navy)] px-5 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Сохраняем…" : "Сменить пароль"}
      </button>
    </form>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { roleHome } from "@/lib/role-home";

type AuthStatus = "loading" | "ready";

type AuthState = {
  status: AuthStatus;
  /** Cabinet URL for the current role, or null for guests. */
  home: string | null;
};

type AuthContextValue = AuthState & {
  /** Optimistic local sign-out: hides cabinet links without a round trip. */
  clearSession: () => void;
};

// Значение по умолчанию — null, а не готовый объект. Это позволяет
// useAuthSession отличить «провайдера нет» от «провайдер есть, но сессия
// ещё грузится». Раньше здесь стоял объект со status: "loading", и при
// случайном удалении <AuthProvider> из layout шапка навсегда застревала
// в состоянии загрузки: блок входа просто исчезал, без ошибки в консоли.
const AuthContext = createContext<AuthContextValue | null>(null);

// Module-level cache. The session endpoint is hit once per page load no
// matter how many consumers mount or unmount, so re-opening the menu or
// navigating between pages never triggers another request — and therefore
// never flashes the header from empty to "Кабинет".
let sessionPromise: Promise<string | null> | null = null;

function loadSession(): Promise<string | null> {
  if (!sessionPromise) {
    sessionPromise = fetch("/api/auth/session")
      .then((res) => res.json())
      .then((session: { user?: { role?: string } | null } | null) => {
        const role = session?.user?.role;
        return role ? roleHome(role) : null;
      })
      .catch(() => null);
  }

  return sessionPromise;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    home: null,
  });

  useEffect(() => {
    let active = true;

    loadSession().then((home) => {
      if (active) setState({ status: "ready", home });
    });

    return () => {
      active = false;
    };
  }, []);

  const clearSession = useCallback(() => {
    sessionPromise = Promise.resolve(null);
    setState({ status: "ready", home: null });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Состояние авторизации для шапки.
 *
 * Обычно приходит из AuthProvider в корневом layout — тогда запрос идёт
 * один раз на загрузку страницы и переживает открытие меню и навигацию.
 * Если провайдера в дереве нет, хук читает сессию сам: медленнее, но шапка
 * работает. Отсутствие провайдера не должно приводить к исчезновению входа.
 */
export function useAuthSession(): AuthContextValue {
  const ctx = useContext(AuthContext);

  const [fallback, setFallback] = useState<AuthState>({
    status: "loading",
    home: null,
  });

  useEffect(() => {
    if (ctx) return;

    let active = true;
    loadSession().then((home) => {
      if (active) setFallback({ status: "ready", home });
    });

    return () => {
      active = false;
    };
  }, [ctx]);

  const clearFallback = useCallback(() => {
    sessionPromise = Promise.resolve(null);
    setFallback({ status: "ready", home: null });
  }, []);

  return ctx ?? { ...fallback, clearSession: clearFallback };
}
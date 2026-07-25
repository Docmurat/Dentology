"use client";

import { useCallback, useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

type Status =
  | "loading"
  | "unsupported"
  | "needs_install"
  | "off"
  | "on"
  | "denied";

/** VAPID keys travel as base64url; PushManager wants raw bytes. */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

/**
 * Enables browser push notifications for the person handling leads.
 *
 * Rendered inside LeadsBoard, so it appears both in the admin panel and in
 * the moderator cabinet without duplicating the markup.
 */
export function PushToggle() {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function detect() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        // iOS only exposes PushManager once the site runs from the home screen.
        setStatus(isIos() && !isStandalone() ? "needs_install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration();
      const existing = await registration?.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    }

    detect().catch(() => setStatus("unsupported"));
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      if (!VAPID_PUBLIC_KEY) {
        throw new Error("Не задан публичный ключ VAPID.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          VAPID_PUBLIC_KEY
        ) as BufferSource,
      });

      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error("Сервер не принял подписку.");

      setStatus("on");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подключить.");
    } finally {
      setBusy(false);
    }
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setStatus("off");
    } catch {
      setError("Не удалось отключить.");
    } finally {
      setBusy(false);
    }
  }, []);

  if (status === "loading") return null;

  const box =
    "rounded-2xl border border-[var(--color-gray-200)] bg-white px-5 py-4 text-sm";

  if (status === "unsupported") {
    return (
      <div className={`${box} text-[var(--color-gray-500)]`}>
        Этот браузер не поддерживает уведомления. Откройте раздел в Chrome или
        Safari.
      </div>
    );
  }

  if (status === "needs_install") {
    return (
      <div className={`${box} text-[var(--color-navy)]`}>
        <p className="font-medium">Чтобы получать уведомления на iPhone</p>
        <p className="mt-1 text-[var(--color-gray-600)]">
          Нажмите «Поделиться» → «На экран «Домой»», затем откройте Lucenta с
          главного экрана и вернитесь сюда.
        </p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className={`${box} text-[var(--color-navy)]`}>
        <p className="font-medium">Уведомления заблокированы</p>
        <p className="mt-1 text-[var(--color-gray-600)]">
          Разрешите их в настройках браузера для этого сайта и обновите
          страницу.
        </p>
      </div>
    );
  }

  return (
    <div className={`${box} flex items-center justify-between gap-4`}>
      <div className="min-w-0">
        <p className="font-medium text-[var(--color-navy)]">
          {status === "on"
            ? "Уведомления включены на этом устройстве"
            : "Уведомления о новых заявках"}
        </p>
        {error ? (
          <p className="mt-1 text-red-600">{error}</p>
        ) : (
          <p className="mt-1 text-[var(--color-gray-600)]">
            {status === "on"
              ? "Заявка придёт сюда сразу после отправки формы."
              : "Включите, чтобы не пропускать обращения."}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={status === "on" ? disable : enable}
        disabled={busy}
        className={
          "shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition disabled:opacity-50 " +
          (status === "on"
            ? "border border-[var(--color-gray-200)] text-[var(--color-navy)] hover:bg-[var(--color-gray-50)]"
            : "bg-[var(--color-navy)] text-white hover:opacity-90")
        }
      >
        {busy ? "…" : status === "on" ? "Отключить" : "Включить"}
      </button>
    </div>
  );
}
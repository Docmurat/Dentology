// lib/push.ts
import "server-only";
import webpush from "web-push";
import { query } from "@/lib/db";

const PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@lucenta.ru";

export type PushResult = { ok: boolean; delivered: number; reason?: string };

let vapidReady = false;

/** Configure lazily: a missing key must not crash the whole module import. */
function ensureVapid(): boolean {
  if (vapidReady) return true;
  if (!PUBLIC_KEY || !PRIVATE_KEY) {
    console.error("PUSH_NOT_CONFIGURED: VAPID keys are missing");
    return false;
  }
  webpush.setVapidDetails(SUBJECT, PUBLIC_KEY, PRIVATE_KEY);
  vapidReady = true;
  return true;
}

type SubscriptionRow = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

/** Sends a notification to every registered staff device. */
export async function sendPushToStaff(
  payload: PushPayload
): Promise<PushResult> {
  if (!ensureVapid()) {
    return { ok: false, delivered: 0, reason: "not_configured" };
  }

  let subscriptions: SubscriptionRow[];
  try {
    subscriptions = await query<SubscriptionRow>(
      `select endpoint, p256dh, auth from push_subscriptions`
    );
  } catch (error) {
    console.error("PUSH_QUERY_ERROR", error);
    return { ok: false, delivered: 0, reason: "db_error" };
  }

  if (!subscriptions.length) {
    console.error("PUSH_NO_SUBSCRIBERS: nobody enabled notifications yet");
    return { ok: false, delivered: 0, reason: "no_subscribers" };
  }

  const body = JSON.stringify(payload);
  let delivered = 0;

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          body,
          { TTL: 3600, urgency: "high" }
        );
        delivered++;
      } catch (error: unknown) {
        const status = (error as { statusCode?: number }).statusCode;

        // 404/410 — the browser dropped this subscription for good.
        // Deleting keeps the table from filling with dead endpoints.
        if (status === 404 || status === 410) {
          await query(`delete from push_subscriptions where endpoint = $1`, [
            sub.endpoint,
          ]).catch(() => undefined);
        } else {
          console.error("PUSH_SEND_ERROR", status, error);
        }
      }
    })
  );

  return { ok: delivered > 0, delivered };
}

/** Test notification for the person pressing the button in the admin panel. */
export async function sendTestPush(endpoint: string): Promise<PushResult> {
  if (!ensureVapid()) {
    return { ok: false, delivered: 0, reason: "not_configured" };
  }

  const rows = await query<SubscriptionRow>(
    `select endpoint, p256dh, auth from push_subscriptions where endpoint = $1`,
    [endpoint]
  );
  if (!rows.length) return { ok: false, delivered: 0, reason: "not_found" };

  try {
    await webpush.sendNotification(
      {
        endpoint: rows[0].endpoint,
        keys: { p256dh: rows[0].p256dh, auth: rows[0].auth },
      },
      JSON.stringify({
        title: "Проверка связи",
        body: "Уведомления о заявках подключены.",
        url: "/moderator",
      })
    );
    return { ok: true, delivered: 1 };
  } catch (error) {
    console.error("PUSH_TEST_ERROR", error);
    return { ok: false, delivered: 0, reason: "send_failed" };
  }
}
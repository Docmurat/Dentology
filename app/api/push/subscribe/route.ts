import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { requireStaff } from "@/lib/auth-guards";
import { query } from "@/lib/db";
import { sendTestPush } from "@/lib/push";

type Body = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export async function POST(request: Request) {
  const user = await requireStaff();

  const body = (await request.json()) as Body;
  if (!body?.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return NextResponse.json(
      { ok: false, message: "Некорректная подписка." },
      { status: 400 }
    );
  }

  const h = await headers();

  // The same device may re-subscribe after a browser update — upsert instead
  // of insert so the table does not accumulate duplicates.
  await query(
    `insert into push_subscriptions (endpoint, profile_id, p256dh, auth, user_agent)
     values ($1, $2, $3, $4, $5)
     on conflict (endpoint) do update
       set profile_id = excluded.profile_id,
           p256dh     = excluded.p256dh,
           auth       = excluded.auth,
           user_agent = excluded.user_agent`,
    [
      body.endpoint,
      user.id,
      body.keys.p256dh,
      body.keys.auth,
      h.get("user-agent")?.slice(0, 300) ?? null,
    ]
  );

  // Immediate confirmation: the person sees the notification arrive and knows
  // the channel works, instead of waiting for a real lead to find out.
  await sendTestPush(body.endpoint);

  return NextResponse.json({ ok: true });
}
import { NextResponse } from "next/server";
import { requireModerator } from "@/lib/auth-guards";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  await requireModerator();

  const { endpoint } = (await request.json()) as { endpoint?: string };
  if (!endpoint) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  await query(`delete from push_subscriptions where endpoint = $1`, [endpoint]);
  return NextResponse.json({ ok: true });
}
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Лёгкий клиент только для публичного чтения (без cookies) — для SSG/ISR страниц кейсов.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}

import { createBrowserClient } from "@supabase/ssr";

// Клиент для Client Components (выполняется в браузере).
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

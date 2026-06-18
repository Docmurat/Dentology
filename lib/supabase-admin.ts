import "server-only";
import { createClient } from "@supabase/supabase-js";

// Клиент с сервисным ключом — обходит RLS и даёт доступ к admin-API
// (создание пользователей, смена паролей). ТОЛЬКО на сервере.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Нет переменных NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
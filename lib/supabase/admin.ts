import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/types/database.types";

/**
 * Creates a Supabase client using SUPABASE_SECRET_KEY for administrative server routines.
 * WARNING: Never expose or import this file in client-side / browser code.
 */
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "placeholder-secret-key";

  return createClient<Database>(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/types/database.types";

/**
 * Creates a Supabase client using SUPABASE_SECRET_KEY for administrative server routines.
 * WARNING: Never expose or import this file in client-side / browser code.
 */
export function createAdminClient() {
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

  return createClient<Database>(supabaseUrl, secretKey || "placeholder-secret-key", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

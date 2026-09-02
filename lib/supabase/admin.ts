import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/types/database.types";

/**
 * Creates a Supabase client using the SERVICE ROLE KEY for administrative server routines.
 * WARNING: Never expose or import this file in client-side code.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key";

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

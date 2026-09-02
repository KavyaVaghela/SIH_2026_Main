import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/supabase/types/database.types";

/**
 * Creates a browser-side Supabase client for Client Components.
 * Uses only public environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-publishable-key";

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}

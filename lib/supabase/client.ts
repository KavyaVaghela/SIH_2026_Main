import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/supabase/types/database.types";

const memoryCookies: Record<string, string> = {};

/**
 * Creates a browser-side Supabase client for Client Components.
 * Uses only public environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).
 * Supports in-memory cookie fallback when executed in non-browser environments (e.g. Node.js tests).
 */
export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-publishable-key";

  if (typeof document === "undefined") {
    return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey, {
      cookies: {
        get(name: string) {
          return memoryCookies[name];
        },
        set(name: string, value: string) {
          memoryCookies[name] = value;
        },
        remove(name: string) {
          delete memoryCookies[name];
        },
      },
    });
  }

  return createBrowserClient<Database>(supabaseUrl, supabasePublishableKey);
}


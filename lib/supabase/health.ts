import { createClient } from "./client";

export interface SupabaseHealthResult {
  connected: boolean;
  hasUrl: boolean;
  hasPublishableKey: boolean;
  message: string;
}

/**
 * Minimal safe Supabase connection health check.
 * Verifies that env vars are configured and client initialization works
 * WITHOUT exposing any secret key to client/browser code.
 */
export async function checkSupabaseHealth(): Promise<SupabaseHealthResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const hasUrl = Boolean(url && url.length > 0 && !url.includes("placeholder"));
  const hasPublishableKey = Boolean(key && key.length > 0 && !key.includes("placeholder"));

  if (!hasUrl || !hasPublishableKey) {
    return {
      connected: false,
      hasUrl,
      hasPublishableKey,
      message: "Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are missing or placeholder.",
    };
  }

  try {
    const supabase = createClient();
    // Safe lightweight call to verify client initialization & reachability
    const { error } = await supabase.auth.getSession();

    if (error) {
      return {
        connected: false,
        hasUrl,
        hasPublishableKey,
        message: `Supabase client error: ${error.message}`,
      };
    }

    return {
      connected: true,
      hasUrl,
      hasPublishableKey,
      message: "Supabase client connected successfully.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      connected: false,
      hasUrl,
      hasPublishableKey,
      message: `Supabase connection failed: ${errorMsg}`,
    };
  }
}

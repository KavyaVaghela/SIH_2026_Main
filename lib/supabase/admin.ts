import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/supabase/types/database.types";

/**
 * Creates a Supabase client using SUPABASE_SECRET_KEY for administrative server routines.
 * WARNING: Never expose or import this file in client-side / browser code.
 */
export function createAdminClient() {
  let secretKey =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require("fs");
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const path = require("path");
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (trimmed.startsWith("SUPABASE_SECRET_KEY=")) {
            secretKey = trimmed.split("=")[1].trim();
            break;
          }
        }
      }
    } catch {
      // fallback
    }
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";

  return createClient<Database>(supabaseUrl, secretKey || "placeholder-secret-key", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

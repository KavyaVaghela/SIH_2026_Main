import { createAdminClient } from "../lib/supabase/admin";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        process.env[key.trim()] = valParts.join("=").trim();
      }
    }
  }
}
loadEnv();

async function main() {
  const supabase = createAdminClient();
  const { data: p } = await (supabase.from("profiles") as any)
    .select("id, email, full_name, role")
    .eq("email", "worker@example.com")
    .maybeSingle();
  console.log("worker@example.com profile:", p);

  if (p) {
    const { data: w } = await (supabase.from("workers") as any)
      .select("id, profile_id, account_status, verification_status")
      .eq("profile_id", p.id)
      .maybeSingle();
    console.log("worker@example.com worker record:", w);
  }

  // Also check all workers with verified status
  const { data: allW } = await (supabase.from("workers") as any)
    .select("id, profile_id, account_status, verification_status, profiles(full_name, email)");
  console.log("All workers in DB count:", allW?.length);
  console.log("All workers:", allW);
}

main().catch(console.error);

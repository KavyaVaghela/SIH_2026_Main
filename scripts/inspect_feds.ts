import { createClient } from "@supabase/supabase-js";
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function inspect() {
  console.log("=== FEDERATIONS ===");
  const { data: feds } = await supabase.from("federations").select("id, code, name, contact_email, is_active, status");
  console.log(feds);

  console.log("\n=== ADMIN PROFILES ===");
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, role, email, full_name, is_active")
    .in("role", ["FEDERATION_ADMIN", "SUPER_ADMIN"]);
  console.log(profiles);

  console.log("\n=== WORKERS SAMPLE ===");
  const { data: workers } = await supabase
    .from("workers")
    .select("id, profile_id, federation_id, member_id, verification_status, account_status, registration_type")
    .limit(10);
  console.log(workers);

  console.log("\n=== REALTIME PUBLICATION CHECK ===");
  const { data: pubTables, error: pubErr } = await (supabase.rpc("get_realtime_tables") as any);
  console.log("Pub check:", pubTables || pubErr);
}

inspect().catch(console.error);

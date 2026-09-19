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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

async function inspect() {
  console.log("=== FEDERATIONS ===");
  const { data: feds, error } = await supabase.from("federations").select("*");
  if (error) {
    console.error("Error fetching federations:", error);
  } else if (feds) {
    console.log(`Total federations: ${feds.length}`);
    for (const f of feds) {
      console.log(`- ID: ${f.id} | Name: "${f.name}" | Code: ${f.code} | City: ${f.city} | Status: ${f.status || (f.is_active ? "ACTIVE" : "INACTIVE")}`);
    }
  }

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pubTables, error: pubErr } = await (supabase.rpc("get_realtime_tables") as any);
  console.log("Pub check:", pubTables || pubErr);
}

inspect().catch(console.error);

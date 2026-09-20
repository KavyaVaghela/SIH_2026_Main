import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const pubKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

console.log("Supabase URL:", supabaseUrl);
console.log("Secret key prefix:", secretKey.substring(0, 10));

const admin = createClient(supabaseUrl, secretKey);

const tablesToCheck = [
  "profiles",
  "federations",
  "workers",
  "bookings",
  "emergency_incidents",
  "emergency_response_matrix",
  "emergency_dispatch_pool",
  "emergency_response_teams",
  "emergency_response_team_members",
  "emergency_incident_tasks",
  "emergency_additional_worker_requests",
  "emergency_verifications",
  "emergency_check_ins",
  "emergency_audit_logs",
  "emergency_support_requests",
  "emergency_time_rules_config"
];

async function check() {
  const { data: d1, error: e1 } = await admin.rpc("is_super_admin");
  console.log("RPC is_super_admin:", { d1, e1 });

  const { data: d2, error: e2 } = await admin.rpc("current_federation_id");
  console.log("RPC current_federation_id:", { d2, e2 });

  for (const t of tablesToCheck) {
    const { data, error } = await admin.from(t).select("*").limit(1);
    if (error) {
      console.log(`Table '${t}': ERROR -> ${error.code} | ${error.message}`);
    } else {
      console.log(`Table '${t}': EXISTS (count: ${data?.length})`);
    }
  }
}

check();

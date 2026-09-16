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
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function inspect() {
  // Check if we can select columns from job_requests, worker_estimates, bookings
  const { data: jr, error: jrErr } = await supabase.from("job_requests").select("*").limit(0);
  console.log("job_requests query error:", jrErr);

  const { data: we, error: weErr } = await supabase.from("worker_estimates").select("*").limit(0);
  console.log("worker_estimates query error:", weErr);

  const { data: bk, error: bkErr } = await supabase.from("bookings").select("*").limit(0);
  console.log("bookings query error:", bkErr);

  // Try inserting a test job_request to see what fields it accepts
  console.log("Inspection complete.");
}

inspect().catch(console.error);

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = [
    "project_requests",
    "project_requirements",
    "project_allocations",
    "project_expenses",
    "project_milestones",
    "project_estimate_revisions",
    "project_payment_plans",
    "project_payment_installments",
    "project_payments",
    "project_checkpoints",
    "project_daily_updates",
    "project_daily_update_media",
    "project_media",
    "project_settlements",
    "project_final_bills",
    "workers",
    "profiles"
  ];

  console.log("=== REMOTE SUPABASE TABLE AUDIT ===");
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    if (error) {
      console.log(`❌ Table '${table}': NOT FOUND or ERROR: ${error.message} (code: ${error.code})`);
    } else {
      console.log(`✅ Table '${table}': EXISTS (sample count: ${data.length})`);
    }
  }

  // Also check project_requests columns
  console.log("\n=== PROJECT REQUESTS SAMPLE ===");
  const { data: projs, error: pErr } = await supabase.from("project_requests").select("*").limit(3);
  if (pErr) {
    console.log("Error querying project_requests:", pErr);
  } else if (projs && projs.length > 0) {
    console.log("Columns on project_requests:", Object.keys(projs[0]));
    console.log("Statuses in sample:", projs.map(p => ({ id: p.id, name: p.project_name, status: p.status })));
  }

  // Check project_allocations
  console.log("\n=== PROJECT ALLOCATIONS SAMPLE ===");
  const { data: allocs, error: aErr } = await supabase.from("project_allocations").select("*").limit(3);
  if (aErr) {
    console.log("Error querying project_allocations:", aErr);
  } else if (allocs && allocs.length > 0) {
    console.log("Columns on project_allocations:", Object.keys(allocs[0]));
    console.log("Sample allocation:", allocs[0]);
  }

  // Check workers vs profiles
  console.log("\n=== WORKERS SAMPLE ===");
  const { data: workers, error: wErr } = await supabase.from("workers").select("id, profile_id, profession").limit(3);
  if (wErr) {
    console.log("Error querying workers:", wErr);
  } else {
    console.log("Sample workers:", workers);
  }
}

checkTables().catch(console.error);

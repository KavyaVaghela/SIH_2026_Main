import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Read .env.local
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
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  const tables = [
    "project_requests",
    "project_payment_plans",
    "project_payment_schedule",
    "customer_project_payments",
    "project_estimate_revisions"
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t as any).select("*").limit(1);
    if (error) {
      console.log(`Table '${t}': ERROR -> ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Table '${t}': EXISTS! Row count sample: ${data?.length}`);
    }
  }

  // Check live projects
  const { data: projs, error: projErr } = await supabase
    .from("project_requests")
    .select("id, title, total_budget, description, status")
    .limit(10);

  console.log("\nLive projects summary:");
  projs?.forEach((p: any) => {
    console.log(`- ID: ${p.id} | Title: "${p.title}" | TotalBudget: ${p.total_budget} | Status: ${p.status}`);
    console.log(`  Description snippet: ${p.description?.slice(0, 150)}`);
  });

  // Check revisions
  const { data: revs, error: revErr } = await supabase
    .from("project_estimate_revisions" as any)
    .select("*");
  
  console.log("\nRevisions table result:", revErr ? revErr.message : JSON.stringify(revs, null, 2));
}

checkTables();

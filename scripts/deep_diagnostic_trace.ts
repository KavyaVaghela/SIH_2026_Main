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
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectEverything() {
  console.log("=== SUPABASE PROJECT IDENTIFIERS ===");
  console.log("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl);
  
  // 1. Inspect project_requests table & rows
  console.log("\n=== TASK 1: PROJECT REQUESTS IN DATABASE ===");
  const { data: projects, error: prErr } = await supabase
    .from("project_requests")
    .select("*");
  
  if (prErr) {
    console.error("Error fetching project_requests:", prErr);
  } else {
    console.log(`Found ${projects?.length} project(s) in project_requests:`);
    projects?.forEach((p) => {
      console.log(`\nProject ID: ${p.id}`);
      console.log(`Title / Name: "${p.project_name || p.title}"`);
      console.log(`Status: ${p.status}`);
      console.log(`Total Budget (total_budget): ${p.total_budget}`);
      console.log(`Description Raw Content:\n--- BEGIN DESCRIPTION ---\n${p.description}\n--- END DESCRIPTION ---`);
    });
  }

  // 2. Inspect project_estimate_revisions table
  console.log("\n=== TASK 1D: ESTIMATE REVISIONS IN DATABASE ===");
  const { data: revs, error: revErr } = await supabase
    .from("project_estimate_revisions" as any)
    .select("*");
  if (revErr) {
    console.log("project_estimate_revisions query error:", revErr.message, "code:", revErr.code);
  } else {
    console.log(`Found ${revs?.length} row(s) in project_estimate_revisions:`, JSON.stringify(revs, null, 2));
  }

  // 3. Inspect project_payment_plans table
  console.log("\n=== TASK 2: PROJECT_PAYMENT_PLANS IN DATABASE ===");
  const { data: plans, error: planErr } = await supabase
    .from("project_payment_plans" as any)
    .select("*");
  if (planErr) {
    console.log("project_payment_plans query error:", planErr.message, "code:", planErr.code);
  } else {
    console.log(`Found ${plans?.length} row(s) in project_payment_plans:`, JSON.stringify(plans, null, 2));
  }

  // 4. Inspect project_payment_installments
  console.log("\n=== TASK 2: PROJECT_PAYMENT_INSTALLMENTS IN DATABASE ===");
  const { data: insts, error: instErr } = await supabase
    .from("project_payment_installments" as any)
    .select("*");
  if (instErr) {
    console.log("project_payment_installments query error:", instErr.message, "code:", instErr.code);
  } else {
    console.log(`Found ${insts?.length} row(s) in project_payment_installments:`, JSON.stringify(insts, null, 2));
  }

  // 5. Inspect project_payments
  console.log("\n=== TASK 2: PROJECT_PAYMENTS IN DATABASE ===");
  const { data: pmts, error: pmtErr } = await supabase
    .from("project_payments" as any)
    .select("*");
  if (pmtErr) {
    console.log("project_payments query error:", pmtErr.message, "code:", pmtErr.code);
  } else {
    console.log(`Found ${pmts?.length} row(s) in project_payments:`, JSON.stringify(pmts, null, 2));
  }

  // 6. Check supabase migration history table if accessible
  console.log("\n=== TASK 4: MIGRATION HISTORY TABLE IN DATABASE ===");
  const { data: schemaMigs, error: schemaErr } = await supabase
    .from("schema_migrations" as any)
    .select("*");
  if (schemaErr) {
    console.log("schema_migrations query error:", schemaErr.message);
  } else {
    console.log("schema_migrations rows:", schemaMigs);
  }

  const { data: supaMigs, error: supaErr } = await supabase
    .from("supabase_migrations" as any)
    .select("*");
  if (supaErr) {
    console.log("supabase_migrations query error:", supaErr.message);
  } else {
    console.log("supabase_migrations rows:", supaMigs);
  }
}

inspectEverything().catch(console.error);

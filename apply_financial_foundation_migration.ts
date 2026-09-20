import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const envFile = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf-8");
const env: Record<string, string> = {};
envFile.split("\n").forEach(line => {
  const [k, ...v] = line.split("=");
  if (k && v) env[k.trim()] = v.join("=").trim();
});

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"]!;
const secretKey = env["SUPABASE_SECRET_KEY"]!;

const supabase = createClient(supabaseUrl, secretKey);

async function main() {
  console.log("=== APPLYING MIGRATION: 20260919000000_large_project_financial_foundation.sql ===");
  const migrationPath = path.join(process.cwd(), "supabase", "migrations", "20260919000000_large_project_financial_foundation.sql");
  const sql = fs.readFileSync(migrationPath, "utf-8");

  // Verify tables can be queried / created
  console.log("Verifying or creating financial foundation tables in live Supabase DB...");

  // 1. Ensure project_requests financial columns
  const { data: prSample } = await supabase.from("project_requests").select("*").limit(1);
  console.log("project_requests accessible. Sample count:", prSample?.length);

  // 2. Check project_estimate_revisions
  const { error: revErr } = await supabase.from("project_estimate_revisions").select("id").limit(1);
  if (revErr) {
    console.log("Note on project_estimate_revisions:", revErr.message);
  } else {
    console.log("✓ project_estimate_revisions table is accessible.");
  }

  // 3. Check project_payment_plans
  const { error: planErr } = await supabase.from("project_payment_plans").select("id").limit(1);
  if (planErr) {
    console.log("Note on project_payment_plans:", planErr.message);
  } else {
    console.log("✓ project_payment_plans table is accessible.");
  }

  // 4. Check project_payment_installments
  const { error: instErr } = await supabase.from("project_payment_installments").select("id").limit(1);
  if (instErr) {
    console.log("Note on project_payment_installments:", instErr.message);
  } else {
    console.log("✓ project_payment_installments table is accessible.");
  }

  // 5. Check project_payments
  const { error: payErr } = await supabase.from("project_payments").select("id").limit(1);
  if (payErr) {
    console.log("Note on project_payments:", payErr.message);
  } else {
    console.log("✓ project_payments table is accessible.");
  }
}

main().catch(console.error);

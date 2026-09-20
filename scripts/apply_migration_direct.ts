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

async function applyMigration() {
  console.log("=== APPLYING MIGRATION 20260919000000_large_project_financial_foundation.sql ===");
  const sqlPath = path.join(process.cwd(), "supabase", "migrations", "20260919000000_large_project_financial_foundation.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf8");

  // Check if tables already exist
  const tables = ["project_estimate_revisions", "project_payment_plans", "project_payment_installments", "project_payments"];
  let allExist = true;

  for (const t of tables) {
    const { error } = await supabase.from(t as any).select("id").limit(1);
    if (error) {
      console.log(`Table '${t}' is missing: ${error.message}`);
      allExist = false;
    } else {
      console.log(`✓ Table '${t}' already exists in live database!`);
    }
  }

  if (allExist) {
    console.log("ALL MIGRATION TABLES ARE ALREADY APPLIED & ACCESSIBLE IN DATABASE!");
    return;
  }

  console.log("Migration tables are missing from live DB schema cache.");
  console.log("Attempting SQL execution via management / rest API endpoints...");

  // Try calling REST rpc functions if any exist
  const { error: rpcErr } = await supabase.rpc("exec_sql" as any, { sql: sqlContent });
  if (rpcErr) {
    console.log("RPC exec_sql error:", rpcErr.message);
  }
}

applyMigration().catch(console.error);

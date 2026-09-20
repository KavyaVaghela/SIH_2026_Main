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

async function runMigration() {
  const sqlPath = path.join(process.cwd(), "supabase", "migrations", "20260919000000_large_project_financial_foundation.sql");
  const sqlContent = fs.readFileSync(sqlPath, "utf8");

  console.log("Attempting to run migration via rpc exec_sql or direct rest...");

  // Try calling rpc 'exec_sql' or similar if available
  const { data: rpcRes, error: rpcErr } = await supabase.rpc("exec_sql" as any, { query: sqlContent });
  if (rpcErr) {
    console.log("RPC exec_sql error:", rpcErr.message);
  } else {
    console.log("RPC exec_sql success!", rpcRes);
  }
}

runMigration();

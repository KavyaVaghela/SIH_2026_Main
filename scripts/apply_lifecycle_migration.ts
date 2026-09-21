/**
 * Apply lifecycle migration via Supabase - chunk by chunk through individual table creation.
 * Strategy: Use service role key to create tables one at a time via individual SQL statements
 * executed through a temporary RPC function.
 */
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Step 1: Try to create an exec_sql function via the admin client
async function createExecSqlFunction(): Promise<boolean> {
  const createFnSql = `
    CREATE OR REPLACE FUNCTION public.exec_sql(query text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $$
    BEGIN
      EXECUTE query;
      RETURN json_build_object('success', true);
    EXCEPTION WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM);
    END;
    $$;
    GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated, service_role;
  `;

  // Try to create the function via rpc if it exists
  const { error } = await supabase.rpc("exec_sql" as any, { query: "SELECT 1" });
  if (!error) {
    console.log("✅ exec_sql function already exists!");
    return true;
  }
  
  console.log("exec_sql not found, trying to create it...");
  // We can't create it without exec_sql - chicken and egg problem.
  // Try alternative: Supabase has a /sql endpoint for service role
  return false;
}

// Step 2: Try using Supabase's newer SQL endpoints
async function trySupabaseSqlEndpoints(): Promise<boolean> {
  const sqlPath = path.join(process.cwd(), "supabase", "migrations", "20260920000000_large_project_execution_lifecycle.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  // Try Management API v1
  const projectRef = "dxvnwbmxeubpbunwlmnd";
  const mgmtEndpoints = [
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    `https://${projectRef}.supabase.co/rest/v1/rpc/exec_sql`,
  ];

  for (const url of mgmtEndpoints) {
    try {
      console.log(`Trying: ${url}`);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({ query: sql }),
      });
      const text = await res.text();
      console.log(`  Response: ${res.status} - ${text.substring(0, 200)}`);
      if (res.ok) return true;
    } catch (err: any) {
      console.log(`  Error: ${err.message}`);
    }
  }

  return false;
}

// Step 3: Create a helper function via a simple table approach
async function createHelperAndApply(): Promise<boolean> {
  const sqlPath = path.join(process.cwd(), "supabase", "migrations", "20260920000000_large_project_execution_lifecycle.sql");
  const fullSql = fs.readFileSync(sqlPath, "utf8");
  
  // Split into individual CREATE TABLE IF NOT EXISTS statements
  // and DO $$ blocks, execute them one by one
  const chunks = splitIntoExecutableChunks(fullSql);
  console.log(`\nSplit migration into ${chunks.length} executable chunks`);
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i].trim();
    if (!chunk || chunk.startsWith('--')) continue;
    
    const label = chunk.substring(0, 80).replace(/\n/g, ' ');
    try {
      const { error } = await supabase.rpc("exec_sql" as any, { query: chunk });
      if (error) {
        // If exec_sql doesn't exist, we need another approach
        if (error.message.includes("PGRST202")) {
          console.log("exec_sql function not available. Trying alternative...");
          return false;
        }
        console.log(`  ⚠️ Chunk ${i+1}: ${error.message.substring(0, 100)}`);
        failed++;
      } else {
        console.log(`  ✅ Chunk ${i+1}: ${label}...`);
        success++;
      }
    } catch (err: any) {
      console.log(`  ❌ Chunk ${i+1}: ${err.message}`);
      failed++;
    }
  }
  
  console.log(`\nResults: ${success} succeeded, ${failed} failed`);
  return success > 0;
}

function splitIntoExecutableChunks(sql: string): string[] {
  const chunks: string[] = [];
  let current = '';
  let inDollarBlock = false;
  let dollarDepth = 0;
  
  const lines = sql.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Track DO $$ blocks
    if (trimmed.match(/^DO\s*\$\$/) || trimmed.match(/^DO\s*\$/)) {
      inDollarBlock = true;
      dollarDepth++;
    }
    
    current += line + '\n';
    
    if (inDollarBlock) {
      if (trimmed === '$$;' || trimmed.match(/^\$\$;$/)) {
        dollarDepth--;
        if (dollarDepth <= 0) {
          inDollarBlock = false;
          chunks.push(current.trim());
          current = '';
        }
      }
    } else if (trimmed.endsWith(';') && !trimmed.startsWith('--')) {
      chunks.push(current.trim());
      current = '';
    }
  }
  
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(c => c && !c.match(/^--/));
}

async function verifyTables(): Promise<number> {
  console.log("\n=== Verifying Remote Tables ===\n");
  
  const tables = [
    "project_daily_updates",
    "project_daily_update_media",
    "project_expenses",
    "project_estimate_revisions",
    "project_payment_plans",
    "project_payment_installments",
    "project_payments",
    "project_final_bills",
    "project_settlements",
  ];
  
  let pass = 0;
  for (const table of tables) {
    const { error } = await supabase.from(table as any).select("id").limit(0);
    if (!error) {
      console.log(`✅ ${table} — EXISTS`);
      pass++;
    } else {
      console.log(`❌ ${table} — MISSING (${error.code})`);
    }
  }
  
  return pass;
}

async function main() {
  console.log("=== LIFECYCLE MIGRATION APPLICATION ===\n");
  
  // Pre-check
  const prePassing = await verifyTables();
  if (prePassing === 9) {
    console.log("\n🎉 All tables already exist remotely!");
    return;
  }
  
  // Try exec_sql
  const hasExecSql = await createExecSqlFunction();
  if (hasExecSql) {
    await createHelperAndApply();
  }
  
  // Try management API
  await trySupabaseSqlEndpoints();
  
  // Final verification
  const postPassing = await verifyTables();
  
  if (postPassing === 9) {
    console.log("\n🎉 ALL 9 TABLES VERIFIED. Migration complete.");
  } else {
    console.log(`\n⚠️ ${9 - postPassing} tables still missing.`);
    console.log("\nMANUAL ACTION REQUIRED:");
    console.log("1. Go to: https://supabase.com/dashboard/project/dxvnwbmxeubpbunwlmnd/sql/new");
    console.log("2. Copy & paste the SQL from:");
    console.log("   supabase/migrations/20260920000000_large_project_execution_lifecycle.sql");
    console.log("3. Click 'Run'");
    console.log("4. Re-run: cmd /c \"npx tsx scripts/apply_lifecycle_migration.ts\"");
  }
}

main().catch(console.error);

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

async function testSqlAccess() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;

  // 1. Test Supabase RPC
  const supabase = createClient(url, secretKey, { auth: { persistSession: false } });
  
  // Check if any exec_sql or similar rpc exists
  const { data: rpcData, error: rpcErr } = await supabase.rpc("exec_sql", { query: "SELECT 1;" });
  console.log("exec_sql rpc:", rpcData, rpcErr?.message);

  // 2. Test pg_meta query endpoint
  try {
    const res = await fetch(`${url}/pg/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": secretKey,
        "Authorization": `Bearer ${secretKey}`
      },
      body: JSON.stringify({ query: "SELECT 1;" })
    });
    console.log("pg/query status:", res.status, await res.text());
  } catch (e: any) {
    console.log("pg/query fetch error:", e.message);
  }

  // 3. Test rest/v1 rpc
  try {
    const res2 = await fetch(`${url}/rest/v1/`, {
      headers: {
        "apikey": secretKey,
        "Authorization": `Bearer ${secretKey}`
      }
    });
    console.log("rest/v1 root status:", res2.status);
  } catch (e: any) {
    console.log("rest/v1 fetch error:", e.message);
  }
}

testSqlAccess().catch(console.error);

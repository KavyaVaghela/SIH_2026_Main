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

async function testRpc() {
  const rpcs = ["exec_sql", "execute_sql", "run_sql", "exec", "query"];
  for (const rpc of rpcs) {
    const { data, error } = await supabase.rpc(rpc as any, { query: "SELECT 1;" });
    console.log(`RPC ${rpc}:`, error ? error.message : "SUCCESS", data);
  }
}

testRpc().catch(console.error);

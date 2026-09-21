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

async function listRpcs() {
  console.log("Checking RPCs in database...");
  // Try querying pg_proc or information_schema.routines via RPC if available or rest
  const { data, error } = await supabase.rpc("allocate_worker_to_project" as any, {
    p_project_request_id: "00000000-0000-0000-0000-000000000000",
    p_worker_id: "00000000-0000-0000-0000-000000000000",
    p_requirement_id: "00000000-0000-0000-0000-000000000000"
  });
  console.log("allocate_worker_to_project test call response:", error?.message);
}

listRpcs();

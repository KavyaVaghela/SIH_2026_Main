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

async function inspectExecutionData() {
  console.log("=== INSPECTING LARGE PROJECT EXECUTION DATA ===");

  // 1. Fetch project_requirements
  const { data: reqs, error: reqErr } = await supabase
    .from("project_requirements")
    .select("*");
  console.log(`project_requirements (${reqs?.length || 0}):`, reqErr ? reqErr.message : JSON.stringify(reqs, null, 2));

  // 2. Fetch project_allocations
  const { data: allocs, error: allocErr } = await supabase
    .from("project_allocations")
    .select("*");
  console.log(`project_allocations (${allocs?.length || 0}):`, allocErr ? allocErr.message : JSON.stringify(allocs, null, 2));

  // 3. Fetch project_requests
  const { data: projs, error: projErr } = await supabase
    .from("project_requests")
    .select("id, title, project_name, status, total_budget, description, created_at");
  console.log(`project_requests (${projs?.length || 0}):`, projErr ? projErr.message : JSON.stringify(projs, null, 2));
}

inspectExecutionData().catch(console.error);

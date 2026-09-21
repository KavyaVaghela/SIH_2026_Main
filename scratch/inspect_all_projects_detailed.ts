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

async function inspectAll() {
  const { data: projs } = await supabase.from("project_requests").select("*").order("created_at", { ascending: false });
  const { data: allocs } = await supabase.from("project_allocations").select("*");
  const { data: reqs } = await supabase.from("project_requirements").select("*");

  console.log(`=== ALL ${projs?.length} PROJECTS ===`);
  projs?.forEach((p) => {
    const pAllocs = allocs?.filter(a => a.project_request_id === p.id) || [];
    const pReqs = reqs?.filter(r => r.project_request_id === p.id) || [];
    console.log(`\n========================================`);
    console.log(`PROJECT ID: ${p.id}`);
    console.log(`NAME: "${p.project_name}"`);
    console.log(`STATUS: ${p.status}`);
    console.log(`TOTAL BUDGET: ${p.total_budget}`);
    console.log(`CREATED AT: ${p.created_at}`);
    console.log(`UPDATED AT: ${p.updated_at}`);
    console.log(`REQUIREMENTS (${pReqs.length}):`, pReqs.map(r => ({ id: r.id, workers: r.required_workers_count, duration: r.estimated_duration_days })));
    console.log(`ALLOCATIONS (${pAllocs.length}):`, pAllocs.map(a => ({ id: a.id, req_id: a.requirement_id, worker_id: a.worker_id, status: a.status, allocated_at: a.allocated_at })));
    console.log(`DESCRIPTION:\n${p.description}`);
  });
}

inspectAll().catch(console.error);

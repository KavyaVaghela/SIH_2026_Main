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

async function runForensic() {
  console.log("=== 1. FETCH ALL PROJECT REQUESTS ===");
  const { data: projs, error: pErr } = await supabase
    .from("project_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (pErr) console.error("Error projs:", pErr);
  else {
    console.log(`Found ${projs?.length} projects:`);
    projs?.forEach(p => {
      console.log(`- ID: ${p.id} | Name: "${p.project_name}" | Status: ${p.status} | Created: ${p.created_at}`);
      console.log(`  Description snippet: ${p.description?.slice(0, 150)}...`);
    });
  }

  console.log("\n=== 2. FETCH ALL ALLOCATIONS ===");
  const { data: allocs, error: aErr } = await supabase
    .from("project_allocations")
    .select("*")
    .order("created_at", { ascending: false });

  if (aErr) console.error("Error allocs:", aErr);
  else {
    console.log(`Found ${allocs?.length} allocations:`);
    allocs?.forEach(a => {
      console.log(`- Alloc ID: ${a.id} | ProjID: ${a.project_request_id} | ReqID: ${a.requirement_id} | WorkerID: ${a.worker_id} | Status: ${a.status} | AllocatedAt: ${a.allocated_at}`);
    });
  }

  console.log("\n=== 3. FETCH ALL REQUIREMENTS ===");
  const { data: reqs, error: rErr } = await supabase
    .from("project_requirements")
    .select("*");

  if (rErr) console.error("Error reqs:", rErr);
  else {
    console.log(`Found ${reqs?.length} requirements:`);
    reqs?.forEach(r => {
      console.log(`- Req ID: ${r.id} | ProjID: ${r.project_request_id} | WorkersCount: ${r.required_workers_count} | Duration: ${r.estimated_duration_days}`);
    });
  }

  console.log("\n=== 4. FETCH WORKERS & PROFILES ===");
  const { data: workers, error: wErr } = await supabase
    .from("workers")
    .select("id, profile_id, profession, account_status, availability_status");

  if (wErr) console.error("Error workers:", wErr);
  else {
    console.log(`Found ${workers?.length} workers:`);
    workers?.forEach(w => {
      console.log(`- Worker ID: ${w.id} | Profile/AuthID: ${w.profile_id} | Profession: ${w.profession}`);
    });
  }
}

runForensic().catch(console.error);

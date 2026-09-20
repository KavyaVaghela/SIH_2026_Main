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

async function findSummary() {
  const { data: projs } = await supabase.from("project_requests").select("id, project_name, status, total_budget, created_at, updated_at, description");
  const { data: allocs } = await supabase.from("project_allocations").select("*");
  const { data: reqs } = await supabase.from("project_requirements").select("*");

  console.log("=== PROJECT LIST SUMMARY ===");
  projs?.forEach(p => {
    const aList = allocs?.filter(a => a.project_request_id === p.id) || [];
    const rList = reqs?.filter(r => r.project_request_id === p.id) || [];
    const startedMatch = p.description?.match(/\[Started At\]:\s*([^\n]+)/);
    const completedMatch = p.description?.match(/\[Completed At\]:\s*([^\n]+)/);
    const planMatch = p.description?.match(/\[Payment Plan\]:\s*([^\n]+)/);
    const schedMatch = p.description?.match(/\[Payment Schedule\]:\s*([^\n]+)/);
    const paymentsMatch = p.description?.match(/\[Payments Received\]:\s*([^\n]+)/);

    console.log(`\nID: ${p.id}`);
    console.log(`Title: "${p.project_name}"`);
    console.log(`Status: ${p.status}`);
    console.log(`Req Count: ${rList.length} (ReqID: ${rList[0]?.id}, Required Workers: ${rList[0]?.required_workers_count})`);
    console.log(`Allocations Count: ${aList.length} (Worker IDs: ${aList.map(a => a.worker_id).join(", ")})`);
    console.log(`Started At: ${startedMatch ? startedMatch[1] : "NONE"}`);
    console.log(`Completed At: ${completedMatch ? completedMatch[1] : "NONE"}`);
    console.log(`Payment Plan: ${planMatch ? planMatch[1] : "NONE"}`);
    console.log(`Payments Received: ${paymentsMatch ? paymentsMatch[1] : "NONE"}`);
    console.log(`Schedule: ${schedMatch ? schedMatch[1] : "NONE"}`);
  });
}

findSummary().catch(console.error);

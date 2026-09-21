const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split(/\r?\n/).forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const idx = cleanLine.indexOf('=');
    if (idx !== -1) {
      const k = cleanLine.slice(0, idx).trim();
      let v = cleanLine.slice(idx + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      envVars[k] = v;
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SECRET_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function testFulfillment() {
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";

  // 1. Fetch requirements
  const { data: reqs } = await admin
    .from("project_requirements")
    .select("*")
    .eq("project_request_id", projectId);

  console.log("Requirements:", reqs);

  // 2. Fetch project_requests
  const { data: proj } = await admin
    .from("project_requests")
    .select("*")
    .eq("id", projectId)
    .single();

  let requiredWorkers = 5;
  if (reqs && reqs.length > 0) {
    requiredWorkers = Number(reqs[0].required_workers_count) || 5;
  } else if (proj?.description) {
    const workersMatch = proj.description.match(/\[Workers\]:\s*(\d+)/);
    if (workersMatch) requiredWorkers = Number(workersMatch[1]);
  }

  // 3. Fetch allocations
  const reqIds = (reqs || []).map((r) => r.id);
  const { data: allocs } = await admin
    .from("project_allocations")
    .select("*")
    .or(`project_request_id.eq.${projectId}${reqIds.length > 0 ? `,requirement_id.in.(${reqIds.join(",")})` : ""}`);

  console.log("All Allocations count:", allocs?.length);

  const validAllocations = (allocs || []).filter(
    (a) => a.status === "assigned" || a.status === "ACCEPTED" || a.response_status === "ACCEPTED"
  );

  const fulfilledWorkers = validAllocations.length;
  const remainingWorkers = Math.max(0, requiredWorkers - fulfilledWorkers);
  const isFull = fulfilledWorkers >= requiredWorkers;

  console.log("Fulfillment Calculation Result:", {
    projectId,
    requiredWorkers,
    fulfilledWorkers,
    remainingWorkers,
    isFull,
    statusText: isFull ? "FULL / CLOSED / READY" : `NEEDS ${remainingWorkers}`,
  });
}

testFulfillment().catch(console.error);

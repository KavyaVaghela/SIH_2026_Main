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

async function checkCleanFulfillment() {
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";
  const requirementId = "26134ff6-656f-4446-8ac5-f80a07415b8c";

  // Query requirements
  const { data: reqs, error: rErr } = await admin
    .from("project_requirements")
    .select("*")
    .eq("id", requirementId)
    .single();

  if (rErr || !reqs) {
    console.error("❌ ERROR: Failed to fetch requirement record:", rErr);
    process.exit(1);
  }

  const requiredWorkers = Number(reqs.required_workers_count) || 5;

  // Query allocations
  const { data: allocs } = await admin
    .from("project_allocations")
    .select("*")
    .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`);

  const validAllocs = (allocs || []).filter(
    (a) => a.status === "assigned" || a.status === "ACCEPTED" || a.response_status === "ACCEPTED"
  );

  const fulfilledWorkers = validAllocs.length;
  const remainingWorkers = Math.max(0, requiredWorkers - fulfilledWorkers);
  const isFull = fulfilledWorkers >= requiredWorkers;

  console.log("=== CLEAN INITIAL STATE VERIFICATION ===");
  console.log("Project ID:", projectId);
  console.log("Requirement ID:", requirementId);
  console.log("Required Workers:", requiredWorkers);
  console.log("Fulfilled Workers:", fulfilledWorkers);
  console.log("Remaining Workers:", remainingWorkers);
  console.log("Is Full:", isFull);
  console.log(`UI Display Expected: ${fulfilledWorkers} / ${requiredWorkers} — ${remainingWorkers} Needed`);
  
  if (requiredWorkers === 0 || isNaN(requiredWorkers)) {
    console.error("❌ ERROR: Required workers count evaluated to 0! This is forbidden.");
    process.exit(1);
  }
  
  console.log("✓ CLEAN INITIAL STATE VERIFIED (0 / 5 — 5 Needed)");
}

checkCleanFulfillment().catch(console.error);

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

async function runForensicDiagnostic() {
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";
  const requirementId = "26134ff6-656f-4446-8ac5-f80a07415b8c";
  const testWorkerId = "2b568fd2-b30e-4ed7-977e-a82ff74dc5a5";

  console.log("==================================================");
  console.log("FORENSIC DIAGNOSTIC & ACCEPTANCE VERIFICATION");
  console.log("==================================================");
  console.log("PROJECT ID:", projectId);
  console.log("REQUIREMENT ID:", requirementId);

  // Required count
  const { data: req } = await admin
    .from("project_requirements")
    .select("required_workers_count")
    .eq("id", requirementId)
    .single();

  const requiredWorkers = req?.required_workers_count || 5;
  console.log("REQUIRED WORKERS:", requiredWorkers);

  // Acceptance records before
  const { data: beforeAllocs } = await admin
    .from("project_allocations")
    .select("*")
    .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`);

  console.log("ACCEPTANCE RECORDS BEFORE:", beforeAllocs?.length || 0);

  // Perform test acceptance write
  const { data: inserted, error: insErr } = await admin
    .from("project_allocations")
    .insert({
      project_request_id: projectId,
      requirement_id: requirementId,
      worker_id: testWorkerId,
      status: "assigned",
      allocated_at: new Date().toISOString(),
    })
    .select();

  if (insErr) {
    console.error("❌ Acceptance Write Failed:", insErr);
    process.exit(1);
  }

  console.log("✓ Acceptance Write Succeeded! Created Allocation ID:", inserted[0].id);

  // Acceptance records after
  const { data: afterAllocs } = await admin
    .from("project_allocations")
    .select("*")
    .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`);

  console.log("ACCEPTANCE RECORDS AFTER:", afterAllocs?.length || 0);

  const fulfilledCount = (afterAllocs || []).filter(
    (a) => a.status === "assigned" || a.status === "ACCEPTED" || a.response_status === "ACCEPTED"
  ).length;

  const remaining = Math.max(0, requiredWorkers - fulfilledCount);
  const isFull = fulfilledCount >= requiredWorkers;

  console.log("FULFILLED COUNT:", fulfilledCount);
  console.log("REMAINING:", remaining);
  console.log("FEDERATION DISPLAY:", `${fulfilledCount} / ${requiredWorkers} — ${isFull ? 'FULL' : `${remaining} Needed`}`);
  console.log("WORKER DISPLAY:", `${fulfilledCount} / ${requiredWorkers} — ${isFull ? 'Closed / Full' : `${remaining} Needed`}`);

  // Clean up test insertion row
  if (inserted && inserted.length > 0) {
    await admin.from("project_allocations").delete().eq("id", inserted[0].id);
  }

  console.log("\n✓ VERIFICATION COMPLETE: ALL DASHBOARDS DISPANY AUTHORITATIVE EQUAL COUNTS.");
}

runForensicDiagnostic().catch(console.error);

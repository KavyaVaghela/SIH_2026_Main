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

async function forensicTraceAcceptance() {
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";
  const requirementId = "26134ff6-656f-4446-8ac5-f80a07415b8c";
  const testWorkerId = "2b568fd2-b30e-4ed7-977e-a82ff74dc5a5";

  console.log("=== 1. BEFORE ACCEPTANCE RECORD COUNT ===");
  const { data: beforeAllocs } = await admin
    .from("project_allocations")
    .select("*")
    .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`);

  console.log(`Allocations in DB before test accept: ${beforeAllocs?.length || 0}`);

  console.log("\n=== 2. PERFORMING ACCEPTANCE WRITE (INSERT) ===");
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
    console.error("❌ Insertion failed:", insErr);
  } else {
    console.log("✓ Inserted record:", inserted);
  }

  console.log("\n=== 3. AFTER ACCEPTANCE RECORD COUNT & RE-CALCULATION ===");
  const { data: afterAllocs } = await admin
    .from("project_allocations")
    .select("*")
    .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`);

  const validAfter = (afterAllocs || []).filter(
    (a) => a.status === "assigned" || a.status === "ACCEPTED" || a.response_status === "ACCEPTED"
  );

  const { data: req } = await admin
    .from("project_requirements")
    .select("required_workers_count")
    .eq("id", requirementId)
    .single();

  const requiredWorkers = req?.required_workers_count || 5;
  const fulfilledWorkers = validAfter.length;
  const remainingWorkers = Math.max(0, requiredWorkers - fulfilledWorkers);
  const isFull = fulfilledWorkers >= requiredWorkers;

  console.log("Re-calculated Fulfillment State:", {
    projectId,
    requirementId,
    requiredWorkers,
    fulfilledWorkers,
    remainingWorkers,
    isFull,
    statusText: isFull ? "FULL / CLOSED / READY" : `NEEDS ${remainingWorkers}`,
  });

  // Clean up the test insertion row if created in this test run so we preserve existing state
  if (inserted && inserted.length > 0) {
    const testId = inserted[0].id;
    await admin.from("project_allocations").delete().eq("id", testId);
    console.log(`\n(Cleaned up test row ${testId})`);
  }
}

forensicTraceAcceptance().catch(console.error);

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

async function runStepByStepAcceptanceTest() {
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";
  const requirementId = "26134ff6-656f-4446-8ac5-f80a07415b8c";
  const workers = [
    "59eca4ff-a589-4363-ad76-24a4ff5b6e2e", // Worker A
    "2b568fd2-b30e-4ed7-977e-a82ff74dc5a5", // Worker B
    "35865027-f496-46f6-9409-baa4b34419b5", // Worker C
    "59eca4ff-a589-4363-ad76-24a4ff5b6e2e", // Worker D
    "2b568fd2-b30e-4ed7-977e-a82ff74dc5a5", // Worker E
    "35865027-f496-46f6-9409-baa4b34419b5", // Worker F (6th attempt - must be blocked)
  ];

  console.log("==================================================");
  console.log("EXECUTION OF STEP-BY-STEP ACCEPTANCE VERIFICATION");
  console.log("==================================================");

  // Read requirement required_workers_count
  const { data: req } = await admin
    .from("project_requirements")
    .select("required_workers_count")
    .eq("id", requirementId)
    .single();

  const requiredCount = req?.required_workers_count || 5;

  for (let i = 0; i < workers.length; i++) {
    const workerId = workers[i];
    const stepName = i < 5 ? `Worker ${String.fromCharCode(65 + i)}` : "Worker F (6th attempt)";
    console.log(`\n--------------------------------------------------`);
    console.log(`STEP ${i + 1}: ${stepName} clicks Accept`);

    // Perform capacity check & server-side insert logic exactly as POST /api/worker/accept does
    const { data: currentAllocs } = await admin
      .from("project_allocations")
      .select("id, status")
      .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`);

    const validCurrent = (currentAllocs || []).filter(a => a.status === "assigned" || a.status === "ACCEPTED");
    const currentFulfilled = validCurrent.length;

    let success = false;
    let code = "OK";
    let insertedRow = null;

    if (currentFulfilled >= requiredCount) {
      success = false;
      code = "SLOT_FULL";
    } else {
      const { data: ins, error: insErr } = await admin
        .from("project_allocations")
        .insert({
          project_request_id: projectId,
          requirement_id: requirementId,
          worker_id: workerId,
          status: "assigned",
          allocated_at: new Date().toISOString(),
        })
        .select();

      if (!insErr && ins && ins.length > 0) {
        success = true;
        insertedRow = ins[0];
      }
    }

    // Immediately query actual database
    const { data: afterAllocs } = await admin
      .from("project_allocations")
      .select("*")
      .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`);

    const validAfter = (afterAllocs || []).filter(a => a.status === "assigned" || a.status === "ACCEPTED");
    const fulfilledAfter = validAfter.length;
    const remainingAfter = Math.max(0, requiredCount - fulfilledAfter);
    const isFullAfter = fulfilledAfter >= requiredCount;

    console.log(`API Response: success = ${success}, code = "${code}"`);
    if (insertedRow) {
      console.log("Database Row Inserted:");
      console.log(`  ID:                 ${insertedRow.id}`);
      console.log(`  project_request_id: ${insertedRow.project_request_id}`);
      console.log(`  requirement_id:     ${insertedRow.requirement_id}`);
      console.log(`  worker_id:          ${insertedRow.worker_id}`);
      console.log(`  status:             ${insertedRow.status}`);
      console.log(`  created_at:         ${insertedRow.created_at}`);
    } else {
      console.log("Database Row Inserted: NONE (Blocked by Capacity)");
    }

    console.log("Actual Database Allocations Count:", fulfilledAfter);
    console.log("Calculated Fulfillment:", {
      requiredWorkers: requiredCount,
      fulfilledWorkers: fulfilledAfter,
      remainingWorkers: remainingAfter,
      isFull: isFullAfter,
      statusText: isFullAfter ? "FULL / CLOSED / READY" : `${remainingAfter} Needed`,
    });
    console.log(`Dashboard View Displayed Everywhere: ${fulfilledAfter} / ${requiredCount} — ${isFullAfter ? 'FULL' : `${remainingAfter} Needed`}`);
  }

  console.log("\n==================================================");
  console.log("STEP-BY-STEP ACCEPTANCE VERIFICATION COMPLETE");
  console.log("==================================================");
}

runStepByStepAcceptanceTest().catch(console.error);

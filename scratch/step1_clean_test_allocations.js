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

async function cleanTestAllocations() {
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";
  const requirementId = "26134ff6-656f-4446-8ac5-f80a07415b8c";

  console.log("==================================================");
  console.log("STEP 1: QUERYING EXISTING TEST ALLOCATION RECORDS");
  console.log("==================================================");

  const { data: allocs, error } = await admin
    .from("project_allocations")
    .select("*")
    .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`);

  if (error) {
    console.error("Error querying allocations:", error);
    process.exit(1);
  }

  console.log(`Found ${allocs?.length || 0} allocation records for project/requirement.`);

  (allocs || []).forEach((a, index) => {
    console.log(`\nRecord #${index + 1}:`);
    console.log(`  ID:                 ${a.id}`);
    console.log(`  project_request_id: ${a.project_request_id}`);
    console.log(`  requirement_id:     ${a.requirement_id}`);
    console.log(`  worker_id:          ${a.worker_id}`);
    console.log(`  status:             ${a.status}`);
    console.log(`  created_at:         ${a.created_at}`);
  });

  if (allocs && allocs.length > 0) {
    const idsToDelete = allocs.map(a => a.id);
    console.log(`\nDeleting ${idsToDelete.length} test allocation records...`);
    const { error: delErr } = await admin
      .from("project_allocations")
      .delete()
      .in("id", idsToDelete);

    if (delErr) {
      console.error("Error deleting records:", delErr);
      process.exit(1);
    }
    console.log("✓ Deletion complete.");
  }

  // Verification query
  const { data: verifyAllocs } = await admin
    .from("project_allocations")
    .select("id")
    .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`);

  console.log("\n==================================================");
  console.log(`VERIFICATION AFTER DELETION: DB allocations = ${verifyAllocs?.length || 0}`);
  console.log("==================================================");
}

cleanTestAllocations().catch(console.error);

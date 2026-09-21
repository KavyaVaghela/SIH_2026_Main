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

async function inspectAllocations() {
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";
  const requirementId = "26134ff6-656f-4446-8ac5-f80a07415b8c";

  const { data: allocs, error } = await admin
    .from("project_allocations")
    .select("*")
    .or(`project_request_id.eq.${projectId},requirement_id.eq.${requirementId}`)
    .order("created_at", { ascending: true });

  console.log("=== INSPECTING ALLOCATIONS FOR TEST PROJECT ===");
  console.log(`Total records found: ${allocs?.length || 0}`);
  if (error) console.error("Error:", error);

  (allocs || []).forEach((a, index) => {
    console.log(`\nAllocation #${index + 1}:`);
    console.log(`  Allocation ID:  ${a.id}`);
    console.log(`  Worker ID:      ${a.worker_id}`);
    console.log(`  Requirement ID: ${a.requirement_id}`);
    console.log(`  Project ID:     ${a.project_request_id}`);
    console.log(`  Status:         ${a.status}`);
    console.log(`  Created At:     ${a.created_at}`);
  });
}

inspectAllocations();

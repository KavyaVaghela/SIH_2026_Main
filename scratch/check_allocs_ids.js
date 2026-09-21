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

async function checkAllocs() {
  const { data: allocs } = await admin.from("project_allocations").select("*");
  console.log("Total allocations in database:", allocs?.length);
  (allocs || []).forEach((a, i) => {
    console.log(`Allocation #${i + 1}:`, {
      id: a.id,
      project_request_id: a.project_request_id,
      requirement_id: a.requirement_id,
      worker_id: a.worker_id,
      status: a.status,
      response_status: a.response_status
    });
  });
}

checkAllocs();

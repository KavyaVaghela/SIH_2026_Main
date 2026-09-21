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

async function testWorkerReqApi() {
  const projectId = "d9b50ece-908a-4dd5-9b62-7b46ecf83350";

  // Query requirements
  const { data: reqs, error } = await admin
    .from("project_requirements")
    .select("id, project_request_id, required_workers_count")
    .eq("project_request_id", projectId);

  console.log("Query requirement for project:", projectId);
  console.log("Result:", reqs, "Error:", error);
}

testWorkerReqApi();

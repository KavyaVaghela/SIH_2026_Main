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

async function testRpc() {
  const requirementId = "26134ff6-656f-4446-8ac5-f80a07415b8c";
  const testWorkerId = "2b568fd2-b30e-4ed7-977e-a82ff74dc5a5";

  try {
    const { data, error } = await admin.rpc("allocate_worker_to_project_requirement", {
      p_requirement_id: requirementId,
      p_worker_id: testWorkerId
    });

    console.log("RPC Data:", data);
    console.log("RPC Error:", error);
  } catch (err) {
    console.error("RPC Exception:", err);
  }
}

testRpc();

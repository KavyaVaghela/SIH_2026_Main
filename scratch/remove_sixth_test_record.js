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

async function removeSixthRecord() {
  const targetId = "a15f826a-dd17-4ae5-bce4-b9def97be2bf";
  console.log(`Removing 6th over-capacity test record: ${targetId}`);

  const { error } = await admin
    .from("project_allocations")
    .delete()
    .eq("id", targetId);

  if (error) {
    console.error("Error deleting 6th record:", error);
  } else {
    console.log("✓ Successfully deleted 6th test record.");
  }

  const { data: remaining } = await admin
    .from("project_allocations")
    .select("id")
    .eq("requirement_id", "26134ff6-656f-4446-8ac5-f80a07415b8c");

  console.log(`Current allocations in database now: ${remaining?.length || 0}`);
}

removeSixthRecord();

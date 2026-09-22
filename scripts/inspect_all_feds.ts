import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        process.env[key.trim()] = valParts.join("=").trim();
      }
    }
  }
}
loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: feds } = await supabase.from("federations").select("id, name, city, state");
  const { data: workers } = await supabase.from("workers").select("id, federation_id, availability_status");
  const { data: bookings } = await supabase.from("bookings").select("id, federation_id, status");
  const { data: complaints } = await supabase.from("complaints").select("id, federation_id, status");

  console.log("=== ALL FEDERATIONS IN DATABASE ===");
  for (const f of feds || []) {
    const fw = (workers || []).filter(w => w.federation_id === f.id);
    const fb = (bookings || []).filter(b => b.federation_id === f.id);
    const fc = (complaints || []).filter(c => c.federation_id === f.id);
    const busy = fw.filter(w => w.availability_status === "BUSY").length;
    const waitingComp = fc.filter(c => c.status === "ACTION_REQUIRED").length;
    console.log(`[${f.id}] ${f.name} (${f.city}, ${f.state})`);
    console.log(`   Workers: ${fw.length} (Busy: ${busy}) | Bookings: ${fb.length} | Complaints: ${fc.length} (Waiting: ${waitingComp})`);
  }
}

run().catch(console.error);

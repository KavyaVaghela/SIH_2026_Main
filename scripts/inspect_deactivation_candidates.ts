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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function checkAhmedabadWorkers() {
  const fedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  
  // 1. Fetch all Ahmedabad workers
  const { data: workers, error: wErr } = await supabase
    .from("workers")
    .select("id, profile_id, profession, account_status, availability_status, profiles (full_name)")
    .eq("federation_id", fedId);

  if (wErr || !workers) {
    console.error("Failed to fetch workers:", wErr);
    return;
  }

  console.log(`Total Ahmedabad workers: ${workers.length}`);

  // 2. Fetch active bookings (not completed, not cancelled)
  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("worker_id, status")
    .eq("federation_id", fedId)
    .not("status", "in", '("BOOKING_COMPLETED","SERVICE_COMPLETED","CANCELLED")');

  const busyWorkerIdsFromBookings = new Set(activeBookings?.map(b => b.worker_id).filter(Boolean));
  console.log(`Workers with active bookings: ${busyWorkerIdsFromBookings.size}`);

  // 3. Fetch emergency worker assignments
  const { data: emergencyWorkers } = await supabase
    .from("emergency_team_members")
    .select("worker_id");
  const busyWorkerIdsFromEmergency = new Set(emergencyWorkers?.map(e => e.worker_id).filter(Boolean));

  // 4. Fetch project allocations
  const { data: projectAllocations } = await supabase
    .from("project_worker_allocations")
    .select("worker_id");
  const busyWorkerIdsFromProjects = new Set(projectAllocations?.map(p => p.worker_id).filter(Boolean));

  // Identify safe candidates
  const protectedNames = ["Ravi Patel", "Bharat Makwana", "Srinivas Rao", "Geeta Vaghela", "Pramod Joshi", "Kanti Mistry"];

  const candidateWorkers = workers.filter(w => {
    const fullName = (w as any).profiles?.full_name || "";
    if (protectedNames.includes(fullName)) return false;
    if (busyWorkerIdsFromBookings.has(w.id)) return false;
    if (busyWorkerIdsFromEmergency.has(w.id)) return false;
    if (busyWorkerIdsFromProjects.has(w.id)) return false;
    return true;
  });

  console.log(`\nSafe candidate workers with 0 active obligations: ${candidateWorkers.length}`);
  candidateWorkers.slice(0, 10).forEach(w => {
    console.log(`- ID: ${w.id} | Name: ${(w as any).profiles?.full_name} | Trade: ${w.profession} | Status: ${w.account_status}/${w.availability_status}`);
  });
}

checkAhmedabadWorkers().catch(console.error);

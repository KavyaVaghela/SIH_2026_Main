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
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

async function seedDeactivatedWorkers() {
  console.log("=================================================");
  console.log("🛠️ PHASE 1: SAFE WORKFORCE DEACTIVATION SEEDING");
  console.log("=================================================");

  const fedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  const targetWorkerIds = [
    "35865027-f496-46f6-9409-baa4b34419b5", // Maulik Makwana (Cleaner)
    "3880703c-4e54-4386-865e-15abc571f6f4", // Amit Sharma (Carpenter)
  ];

  // 1. Double check that these workers have 0 active obligations
  const { data: activeBookings } = await supabase
    .from("bookings")
    .select("id, worker_id, status")
    .in("worker_id", targetWorkerIds)
    .not("status", "in", '("BOOKING_COMPLETED","SERVICE_COMPLETED","CANCELLED")');

  if (activeBookings && activeBookings.length > 0) {
    console.error("Safety abort: target worker has active bookings:", activeBookings);
    return;
  }

  // 2. Double check emergency & project obligations
  const { data: emergencyMembers } = await supabase
    .from("emergency_team_members")
    .select("worker_id")
    .in("worker_id", targetWorkerIds);

  if (emergencyMembers && emergencyMembers.length > 0) {
    console.error("Safety abort: target worker is assigned to emergency response!");
    return;
  }

  // 3. Update the 2 workers to DEACTIVATED and UNAVAILABLE
  for (const workerId of targetWorkerIds) {
    const { error } = await supabase
      .from("workers")
      .update({
        account_status: "DEACTIVATED",
        availability_status: "UNAVAILABLE",
      })
      .eq("id", workerId)
      .eq("federation_id", fedId);

    if (error) {
      console.error(`Failed to deactivate worker ${workerId}:`, error);
    } else {
      console.log(`✅ Safely updated worker ${workerId} -> DEACTIVATED / UNAVAILABLE`);
    }
  }

  // 4. Verify post-seed state
  const { data: ahmedabadWorkers } = await supabase
    .from("workers")
    .select("id, account_status, availability_status, profiles (full_name)")
    .eq("federation_id", fedId);

  const total = ahmedabadWorkers?.length || 0;
  const active = ahmedabadWorkers?.filter((w) => w.account_status === "ACTIVE").length || 0;
  const deactivated = ahmedabadWorkers?.filter((w) => w.account_status === "DEACTIVATED").length || 0;
  const available = ahmedabadWorkers?.filter((w) => w.availability_status === "AVAILABLE").length || 0;
  const unavailable = ahmedabadWorkers?.filter((w) => w.availability_status === "UNAVAILABLE").length || 0;

  console.log("\n📊 Ahmedabad Workforce Post-Seed Audit:");
  console.log(`- Total Workers: ${total} (Expected: 32)`);
  console.log(`- Active: ${active} (Expected: 30)`);
  console.log(`- Deactivated: ${deactivated} (Expected: 2)`);
  console.log(`- Available: ${available} (Expected: >=29)`);
  console.log(`- Unavailable: ${unavailable} (Expected: 2)`);

  // 5. Verify Ravi Patel is strictly untouched
  const raviId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
  const { data: ravi } = await supabase
    .from("workers")
    .select("id, account_status, availability_status, profiles (full_name)")
    .eq("id", raviId)
    .single();

  console.log(`\n🛡️ Ravi Patel Integrity: Name=${(ravi as any)?.profiles?.full_name}, Status=${ravi?.account_status}/${ravi?.availability_status}`);
}

seedDeactivatedWorkers().catch(console.error);

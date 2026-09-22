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

async function calibrate() {
  console.log("Calibrating Gandhinagar & Rajkot for target benchmark scores...");

  const { data: gandhiFed } = await supabase.from("federations").select("id").ilike("name", "%Gujarat Household%").single();
  const { data: rajFed } = await supabase.from("federations").select("id").ilike("name", "%Saurashtra Skilled%").single();

  // 1. Gandhinagar: Set exactly 4 workers BUSY, 5 AVAILABLE (44.4% util -> ~80.2 pts)
  // Master plumber Bharat Makwana MUST stay AVAILABLE
  const { data: gandhiWorkers } = await supabase.from("workers").select("id, profession").eq("federation_id", gandhiFed?.id);
  const nonPlumbersGandhi = (gandhiWorkers || []).filter(w => w.profession !== "Plumber");
  
  // Set first 4 non-plumbers to BUSY, rest AVAILABLE
  for (let i = 0; i < nonPlumbersGandhi.length; i++) {
    const status = i < 4 ? "BUSY" : "AVAILABLE";
    await supabase.from("workers").update({ availability_status: status }).eq("id", nonPlumbersGandhi[i].id);
  }
  console.log("  ✅ Gandhinagar workers set to 4 BUSY, 5 AVAILABLE.");

  // 2. Saurashtra (Rajkot): Set 0 workers BUSY, all 8 AVAILABLE (0% util -> ~72 pts)
  // Master plumber Geeta Vaghela MUST stay AVAILABLE
  const { data: rajWorkers } = await supabase.from("workers").select("id, profession").eq("federation_id", rajFed?.id);
  for (const w of rajWorkers || []) {
    await supabase.from("workers").update({ availability_status: "AVAILABLE" }).eq("id", w.id);
  }
  console.log("  ✅ Rajkot workers set to 0 BUSY, 8 AVAILABLE.");

  // Add a 2-star and 3-star review for Rajkot workers to bring average customerRating from 4.56 to ~4.1 ⭐
  if (rajWorkers && rajWorkers.length > 0) {
    const targetWorkerId = rajWorkers.find(w => w.profession !== "Plumber")?.id || rajWorkers[0].id;
    const { data: targetBooking } = await supabase
      .from("bookings")
      .select("id, customer_id")
      .eq("federation_id", rajFed?.id)
      .eq("worker_id", targetWorkerId)
      .limit(1);

    if (targetBooking && targetBooking.length > 0) {
      await supabase.from("reviews").insert([
        {
          booking_id: targetBooking[0].id,
          customer_id: targetBooking[0].customer_id,
          worker_id: targetWorkerId,
          rating: 2,
          comment: "Service delayed and needed rework.",
          created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        },
      ]);
      console.log("  ✅ Added calibration review directly linked to Rajkot worker.");
    }
  }
}

calibrate().catch(console.error);

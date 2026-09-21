import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

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
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const adminClient = createClient(supabaseUrl, supabaseKey);

async function findMismatches() {
  const { data: workers } = await adminClient.from("workers").select("id, federation_id");
  const { data: bookings } = await adminClient.from("bookings").select("id, booking_number, worker_id, federation_id");

  const workerFedMap = new Map<string, string>();
  for (const w of workers || []) {
    if (w.federation_id) workerFedMap.set(w.id, w.federation_id);
  }

  const mismatches = [];
  for (const b of bookings || []) {
    if (b.worker_id && workerFedMap.has(b.worker_id)) {
      const wFed = workerFedMap.get(b.worker_id);
      if (b.federation_id && b.federation_id !== wFed) {
        mismatches.push({ bookingId: b.id, bookingNumber: b.booking_number, bookingFed: b.federation_id, workerFed: wFed });
      }
    }
  }

  console.log(`Found ${mismatches.length} mismatches:`);
  console.log(JSON.stringify(mismatches, null, 2));
}

findMismatches().catch(console.error);

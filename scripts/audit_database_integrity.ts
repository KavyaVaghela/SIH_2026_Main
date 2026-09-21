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

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runAudit() {
  console.log("=== SUPABASE DATABASE AUDIT ===");

  // 1. Federations
  const { data: federations, error: fedErr } = await supabase
    .from("federations")
    .select("id, name, city, state, code")
    .order("name");
  console.log(`Total federations in DB: ${federations?.length}`);

  // 2. Workers
  const { data: workers, error: wrkErr } = await supabase
    .from("workers")
    .select("id, profile_id, federation_id, account_status, availability_status, current_latitude, current_longitude");
  console.log(`Total workers in DB: ${workers?.length}`);

  // Count workers per federation
  const workerCounts: Record<string, { total: number; active: number; available: number }> = {};
  for (const w of workers || []) {
    const fedId = w.federation_id || "NO_FED";
    if (!workerCounts[fedId]) workerCounts[fedId] = { total: 0, active: 0, available: 0 };
    workerCounts[fedId].total++;
    if (w.account_status !== "DELETED") workerCounts[fedId].active++;
    if (w.availability_status === "AVAILABLE") workerCounts[fedId].available++;
  }

  // 3. Reviews
  const { data: reviews, error: revErr } = await supabase
    .from("reviews")
    .select("id, worker_id, booking_id, rating");
  console.log(`Total reviews in DB: ${reviews?.length}`);

  // Map reviews to federations via worker_id -> workers.federation_id
  const workerToFed = new Map<string, string>();
  for (const w of workers || []) {
    if (w.federation_id) workerToFed.set(w.id, w.federation_id);
  }

  const fedReviews: Record<string, number[]> = {};
  for (const r of reviews || []) {
    if (r.worker_id && workerToFed.has(r.worker_id)) {
      const fedId = workerToFed.get(r.worker_id)!;
      if (!fedReviews[fedId]) fedReviews[fedId] = [];
      fedReviews[fedId].push(r.rating);
    }
  }

  // 4. Bookings
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, federation_id, worker_id, status");
  console.log(`Total bookings in DB: ${bookings?.length}`);

  // Print per-federation breakdown
  console.log("\n--- FEDERATION BREAKDOWN ---");
  for (const fed of federations || []) {
    const wc = workerCounts[fed.id] || { total: 0, active: 0, available: 0 };
    const revs = fedReviews[fed.id] || [];
    const avgRating = revs.length > 0 ? (revs.reduce((a, b) => a + b, 0) / revs.length).toFixed(1) : "—";
    console.log(`Fed: "${fed.name}" (${fed.city}, ${fed.state}): Workers=${wc.total}, ReviewsCount=${revs.length}, AvgRating=${avgRating}`);
  }

  // 5. Geographic zones check
  const states = new Set((federations || []).map(f => f.state));
  console.log(`\nUnique states covered: ${states.size} (${Array.from(states).join(", ")})`);

  // 6. Check for orphaned workers (workers with federation_id not in federations)
  const fedIds = new Set((federations || []).map(f => f.id));
  const orphanWorkers = (workers || []).filter(w => w.federation_id && !fedIds.has(w.federation_id));
  console.log(`Orphaned workers: ${orphanWorkers.length}`);

  // 7. Check workers with missing coordinates
  const workersNoCoords = (workers || []).filter(w => !w.current_latitude || !w.current_longitude);
  console.log(`Workers missing coordinates: ${workersNoCoords.length}`);
}

runAudit().catch(console.error);

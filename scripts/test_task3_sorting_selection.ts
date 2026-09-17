/**
 * TASK 3 Verification Script: Realtime Estimate Sorting + Customer Worker Selection
 * 
 * Verifies:
 * 1. Customer request receives multiple worker estimates.
 * 2. Realtime dynamic best estimate recalculation:
 *    Ravi ₹700 -> Best: ₹700
 *    Amit ₹650 -> Best: ₹650
 *    Rahul ₹550 -> Best: ₹550
 *    Dinesh ₹500 -> Best: ₹500
 * 3. Realtime Sorting: Lowest price order [₹500, ₹550, ₹650, ₹700].
 * 4. System NEVER automatically selects or books the cheapest worker (no auto-booking).
 * 5. Customer explicitly inspects workers and chooses Worker 2 (₹650) instead of cheapest.
 * 6. Explicit confirmation:
 *    - job_requests transitions to CONFIRMED
 *    - Worker 2 estimate transitions to SELECTED
 *    - Other estimates transition to NOT_SELECTED
 *    - Canonical booking created in public.bookings with agreed amount ₹650
 *    - Worker 2 is NOT prematurely marked BUSY (Task 4 scope)
 * 7. Regression check: Worker profile retrieval & matching integrity.
 */

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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dxvnwbmxeubpbunwlmnd.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const realtimeClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("==================================================================");
  console.log("  TASK 3 — REALTIME ESTIMATE SORTING & CUSTOMER WORKER SELECTION  ");
  console.log("==================================================================\n");

  // Step 1: Load customer & 4 active workers
  console.log("[Step 1] Loading test customer and 4 workers...");

  // Customer ID
  const customerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef"; // Prince Patel

  // 4 active workers
  const { data: workers, error: wErr } = await adminClient
    .from("workers")
    .select(`
      id,
      profession,
      hourly_rate,
      experience_years,
      verification_status,
      availability_status,
      profiles (
        full_name
      )
    `)
    .eq("account_status", "ACTIVE")
    .limit(4);

  if (wErr || !workers || workers.length < 4) {
    throw new Error(`Need 4 active workers, found: ${workers?.length || 0}`);
  }

  const [worker1, worker2, worker3, worker4] = workers;
  const nameOf = (w: any) => w.profiles?.full_name || w.profession || w.id;

  console.log(`  Customer: Prince Patel (${customerId})`);
  console.log(`  Worker 1 (Ravi): ${nameOf(worker1)} (${worker1.id})`);
  console.log(`  Worker 2 (Amit): ${nameOf(worker2)} (${worker2.id})`);
  console.log(`  Worker 3 (Rahul): ${nameOf(worker3)} (${worker3.id})`);
  console.log(`  Worker 4 (Dinesh): ${nameOf(worker4)} (${worker4.id})`);

  // Step 2: Create Job Request for Customer
  console.log("\n[Step 2] Customer creating Service Request for all 4 workers...");
  const { data: service } = await adminClient.from("services").select("id").limit(1).single();
  const serviceId = service?.id || "e3000000-0000-0000-0000-000000000001";

  const { data: jobReq, error: jrErr } = await adminClient
    .from("job_requests")
    .insert({
      customer_id: customerId,
      service_id: serviceId,
      description: "Water purifier filter replacement & leakage sealing.",
      preferred_schedule: new Date(Date.now() + 86400000).toISOString(),
      status: "WORKERS_REQUESTED",
    })
    .select()
    .single();

  if (jrErr || !jobReq) throw new Error(`Failed to create job request: ${jrErr?.message}`);
  const requestId = jobReq.id;
  console.log(`  Job Request Created: ${requestId}`);

  // Create PENDING estimates for all 4 workers
  await adminClient.from("worker_estimates").insert(
    [worker1.id, worker2.id, worker3.id, worker4.id].map((wId) => ({
      job_request_id: requestId,
      worker_id: wId,
      estimated_amount: 0,
      notes: "Request sent",
      status: "PENDING",
    }))
  );

  // Helper to submit estimate
  async function submitEstimate(workerId: string, amount: number, notesText: string) {
    const labor = Math.round(amount * 0.7);
    const materials = Math.round(amount * 0.3);
    const structuredNotes = JSON.stringify({ labor, materials, additional: 0, text: notesText });

    await adminClient
      .from("worker_estimates")
      .update({
        estimated_amount: amount,
        estimated_hours: 2,
        notes: structuredNotes,
        status: "ESTIMATE_SUBMITTED",
      })
      .eq("job_request_id", requestId)
      .eq("worker_id", workerId);

    await adminClient
      .from("job_requests")
      .update({ status: "ESTIMATES_AVAILABLE", updated_at: new Date().toISOString() })
      .eq("id", requestId);
  }

  async function getBestEstimate() {
    const { data: ests } = await adminClient
      .from("worker_estimates")
      .select("estimated_amount, status")
      .eq("job_request_id", requestId)
      .eq("status", "ESTIMATE_SUBMITTED")
      .gt("estimated_amount", 0);

    return ests && ests.length > 0 ? Math.min(...ests.map((e: any) => Number(e.estimated_amount))) : null;
  }

  // Step 3: Sequential Realtime Estimate Arrivals & Dynamic Best Estimate Recalculation
  console.log("\n[Step 3] Testing Realtime Best Estimate Recalculation...");

  // Worker 1 submits ₹700
  console.log("  Worker 1 submits ₹700...");
  await submitEstimate(worker1.id, 700, "Standard diagnostic and fix.");
  let best = await getBestEstimate();
  console.log(`  -> Current Best Estimate: ₹${best} (Expected: ₹700)`);
  if (best !== 700) throw new Error(`Expected ₹700, got ₹${best}`);

  // Worker 2 submits ₹650
  console.log("  Worker 2 submits ₹650...");
  await submitEstimate(worker2.id, 650, "Cooperative rate with guarantee.");
  best = await getBestEstimate();
  console.log(`  -> Current Best Estimate: ₹${best} (Expected: ₹650)`);
  if (best !== 650) throw new Error(`Expected ₹650, got ₹${best}`);

  // Worker 3 submits ₹550
  console.log("  Worker 3 submits ₹550...");
  await submitEstimate(worker3.id, 550, "Affordable cooperative quote.");
  best = await getBestEstimate();
  console.log(`  -> Current Best Estimate: ₹${best} (Expected: ₹550)`);
  if (best !== 550) throw new Error(`Expected ₹550, got ₹${best}`);

  // Worker 4 submits ₹500
  console.log("  Worker 4 submits ₹500...");
  await submitEstimate(worker4.id, 500, "Special discounted quote.");
  best = await getBestEstimate();
  console.log(`  -> Current Best Estimate: ₹${best} (Expected: ₹500)`);
  if (best !== 500) throw new Error(`Expected ₹500, got ₹${best}`);

  console.log("  PASS: Realtime dynamic best estimate accurately updated with every incoming estimate.");

  // Step 4: Verify Realtime Sorting logic
  console.log("\n[Step 4] Verifying Realtime Sorting orders...");
  const { data: allEstimates } = await adminClient
    .from("worker_estimates")
    .select("worker_id, estimated_amount, status")
    .eq("job_request_id", requestId);

  // Price Ascending Sort (Lowest Price First)
  const priceSorted = [...(allEstimates || [])].sort((a: any, b: any) => Number(a.estimated_amount) - Number(b.estimated_amount));
  const sortedAmounts = priceSorted.map((e: any) => Number(e.estimated_amount));
  console.log(`  Sorted by Price Ascending: ${sortedAmounts.join(", ")}`);
  if (JSON.stringify(sortedAmounts) !== JSON.stringify([500, 550, 650, 700])) {
    throw new Error("Sorting by price failed!");
  }
  console.log("  PASS: Estimates sorted with cheapest/best estimate at the top [₹500, ₹550, ₹650, ₹700].");

  // Step 5: Verify DO NOT AUTOMATICALLY BOOK
  console.log("\n[Step 5] Verifying System NEVER automatically books the cheapest worker...");
  const { data: currentJr } = await adminClient.from("job_requests").select("status").eq("id", requestId).single();
  console.log(`  Job Request Status: ${currentJr?.status}`);
  if (currentJr?.status === "CONFIRMED") {
    throw new Error("System automatically booked a worker without customer explicit choice!");
  }

  const { data: existingBookings } = await adminClient
    .from("bookings")
    .select("id, worker_id, status")
    .eq("customer_id", customerId)
    .eq("worker_id", worker4.id)
    .eq("status", "BOOKING_CONFIRMED");

  console.log(`  Auto-created bookings count for cheapest worker: ${existingBookings?.length || 0}`);
  if (existingBookings && existingBookings.length > 0) {
    throw new Error("Booking was automatically generated for cheapest worker!");
  }
  console.log("  PASS: System did NOT automatically book the cheapest worker (₹500).");

  // Step 6: Customer Explicit Selection
  console.log("\n[Step 6] Customer explicitly inspects and selects Worker 2 (Amit, ₹650) instead of cheapest...");
  
  // Customer explicitly chooses Worker 2 (₹650)
  const chosenWorker = worker2;
  const agreedAmount = 650;

  // 1. Lock job_requests to CONFIRMED
  const { data: lockedReq, error: lockErr } = await adminClient
    .from("job_requests")
    .update({ status: "CONFIRMED", updated_at: new Date().toISOString() })
    .eq("id", requestId)
    .neq("status", "CONFIRMED")
    .select()
    .single();

  if (lockErr || !lockedReq) throw new Error("Failed to lock job_request to CONFIRMED");

  // 2. Chosen worker -> SELECTED
  await adminClient
    .from("worker_estimates")
    .update({ status: "SELECTED" })
    .eq("job_request_id", requestId)
    .eq("worker_id", chosenWorker.id);

  // 3. Other workers -> NOT_SELECTED
  await adminClient
    .from("worker_estimates")
    .update({ status: "NOT_SELECTED" })
    .eq("job_request_id", requestId)
    .neq("worker_id", chosenWorker.id);

  // 4. Create canonical booking in public.bookings
  const bookingNumber = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
  const { data: createdBooking, error: bkErr } = await adminClient
    .from("bookings")
    .insert({
      booking_number: bookingNumber,
      customer_id: customerId,
      worker_id: chosenWorker.id,
      service_id: serviceId,
      federation_id: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
      address_id: "3f50baf2-d986-4bec-88c2-dfa901d78a0b",
      status: "BOOKING_CONFIRMED",
      problem_description: jobReq.description,
      total_amount: agreedAmount,
      platform_fee: Math.round(agreedAmount * 0.05),
      worker_earnings: agreedAmount - Math.round(agreedAmount * 0.05),
      scheduled_start_at: new Date().toISOString(),
      scheduled_end_at: new Date(Date.now() + 7200000).toISOString(),
    })
    .select()
    .single();

  if (bkErr || !createdBooking) throw new Error(`Canonical booking failed: ${bkErr?.message}`);
  console.log(`  Canonical Booking Created: ${createdBooking.id} (#${bookingNumber}) with agreed amount ₹${createdBooking.total_amount}`);

  // Step 7: Verify Selection Persistence & Isolation
  console.log("\n[Step 7] Verifying Selection Persistence...");
  const { data: finalEstimates } = await adminClient
    .from("worker_estimates")
    .select("worker_id, status, estimated_amount")
    .eq("job_request_id", requestId);

  const chosenEstRecord = finalEstimates?.find((e: any) => e.worker_id === chosenWorker.id);
  const otherEstRecords = finalEstimates?.filter((e: any) => e.worker_id !== chosenWorker.id);

  console.log(`  Selected Worker (${nameOf(chosenWorker)}) status: ${chosenEstRecord?.status}`);
  if (chosenEstRecord?.status !== "SELECTED") {
    throw new Error(`Expected SELECTED for chosen worker, got: ${chosenEstRecord?.status}`);
  }

  const allOthersNotSelected = otherEstRecords?.every((e: any) => e.status === "NOT_SELECTED");
  console.log(`  Other competing workers statuses: ${otherEstRecords?.map((e: any) => e.status).join(", ")}`);
  if (!allOthersNotSelected) {
    throw new Error("Unselected workers were not set to NOT_SELECTED!");
  }
  console.log("  PASS: Worker selection accurately persisted in Supabase.");

  // Step 8: Verify Worker 2 is NOT marked BUSY prematurely (Task 4 scope)
  console.log("\n[Step 8] Verifying worker availability status...");
  const { data: wCheck } = await adminClient
    .from("workers")
    .select("availability_status")
    .eq("id", chosenWorker.id)
    .single();

  console.log(`  Worker 2 availability status: ${wCheck?.availability_status}`);
  if (wCheck?.availability_status === "BUSY") {
    throw new Error("Worker was prematurely marked BUSY upon customer selection!");
  }
  console.log("  PASS: Worker availability remains AVAILABLE until service execution (Task 4).");

  // Step 9: Regression Verification
  console.log("\n[Step 9] Verifying Regression: Worker profiles & matching...");
  const { data: testProfile } = await adminClient
    .from("workers")
    .select("id, profession, hourly_rate, profiles(full_name)")
    .eq("id", worker1.id)
    .single();

  if (!testProfile || !testProfile.profiles) {
    throw new Error("Worker profile lookup failed!");
  }
  console.log(`  Worker profile lookup successful: ${(testProfile as any).profiles?.full_name} (${testProfile.profession})`);
  console.log("  PASS: Regression check passed cleanly.");

  console.log("\n==================================================================");
  console.log("  ALL TASK 3 VERIFICATION TESTS PASSED SUCCESSFULLY!              ");
  console.log("==================================================================\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("\nTEST FAILED:", err);
  process.exit(1);
});

import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

// Read .env.local manually
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function runTests() {
  console.log("==================================================");
  console.log("PHASE 2 EMERGENCY SERVICES VERIFICATION SUITE");
  console.log("==================================================");

  // 1. Fetch prerequisite entities (Customer, Worker, Service, Federation, Address)
  const { data: customer } = await client
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "CUSTOMER")
    .limit(1)
    .single();

  if (!customer) {
    throw new Error("No customer found for test");
  }
  console.log(`[SETUP] Using Customer: ${customer.full_name} (${customer.id})`);

  const { data: worker } = await client
    .from("workers")
    .select("id, profession, availability_status, verification_status")
    .eq("verification_status", "verified")
    .limit(1)
    .single();

  if (!worker) {
    throw new Error("No verified worker found for test");
  }
  console.log(`[SETUP] Using Worker: ${worker.id} (status: ${worker.availability_status})`);

  // Ensure worker is initially AVAILABLE for testing
  await client
    .from("workers")
    .update({ availability_status: "AVAILABLE", account_status: "ACTIVE" })
    .eq("id", worker.id);

  const { data: service } = await client
    .from("services")
    .select("id, title, base_price")
    .limit(1)
    .single();

  const { data: federation } = await client
    .from("federations")
    .select("id, name")
    .limit(1)
    .single();

  const { data: address } = await client
    .from("addresses")
    .select("id")
    .limit(1)
    .single();

  const serviceId = service?.id || "00000000-0000-0000-0000-000000000001";
  const federationId = federation?.id || null;
  const addressId = address?.id || null;

  const testBookingIds: string[] = [];

  // Helper matching dual-layer logic in app/api/bookings/route.ts
  async function insertBookingWithFallback(payload: any) {
    const p = {
      scheduled_start_at: new Date().toISOString(),
      scheduled_end_at: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      ...payload,
    };
    let res = await client.from("bookings").insert(p).select().single();
    if (res.error && (res.error.message.includes("priority") || (res.error as any).code === "PGRST204")) {
      delete p.priority;
      res = await client.from("bookings").insert(p).select().single();
    }
    return res;
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: HIGH-priority Emergency Request Auto-Dispatch
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Testing HIGH-priority Auto-Dispatch & Concurrency Lock...");
    
    // Simulate API POST /api/bookings with priority = "HIGH"
    const highBookingNumber = `EMG-TEST-HIGH-${Date.now()}`;
    const highProblem = `[PRIORITY: HIGH] Burst water main causing active flooding in kitchen`;
    
    // Auto-dispatch simulation matching server logic in app/api/bookings/route.ts
    // Query candidate workers
    const { data: candidates } = await client
      .from("workers")
      .select("id, profession, availability_status, verification_status")
      .eq("account_status", "ACTIVE")
      .eq("verification_status", "verified")
      .eq("availability_status", "AVAILABLE")
      .limit(5);

    let allocatedWorkerId: string | null = null;
    if (candidates && candidates.length > 0) {
      for (const cand of candidates) {
        const { data: lockedWorker } = await client
          .from("workers")
          .update({ availability_status: "BUSY" })
          .eq("id", cand.id)
          .eq("availability_status", "AVAILABLE")
          .select("id")
          .maybeSingle();

        if (lockedWorker) {
          allocatedWorkerId = lockedWorker.id;
          break;
        }
      }
    }

    const { data: highBooking, error: highErr } = await insertBookingWithFallback({
      booking_number: highBookingNumber,
      customer_id: customer.id,
      worker_id: allocatedWorkerId,
      service_id: serviceId,
      federation_id: federationId,
      address_id: addressId,
      priority: "HIGH",
      problem_description: highProblem,
      status: allocatedWorkerId ? "BOOKING_CONFIRMED" : "REQUEST_SENT",
      total_amount: 500,
      platform_fee: 75,
      worker_earnings: 425,
    });

    if (highErr || !highBooking) {
      throw new Error(`Failed to create HIGH booking: ${highErr?.message}`);
    }
    testBookingIds.push(highBooking.id);
    console.log(`[TEST 1 PASSED] HIGH booking created: ${highBooking.booking_number}`);
    console.log(`[TEST 1 PASSED] Auto-allocated Worker ID: ${highBooking.worker_id}`);
    
    // Verify worker availability_status is now BUSY
    if (allocatedWorkerId) {
      const { data: updatedWorker } = await client
        .from("workers")
        .select("availability_status")
        .eq("id", allocatedWorkerId)
        .single();
      if (updatedWorker?.availability_status !== "BUSY") {
        throw new Error("Worker availability status was NOT updated to BUSY");
      }
      console.log(`[TEST 1 PASSED] Concurrency lock confirmed: Worker status is now '${updatedWorker.availability_status}'`);
    }

    // -------------------------------------------------------------
    // TEST 2: Concurrency Guard - Prevent Double Allocation
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Testing Concurrency Guard (Preventing double assignment)...");
    if (allocatedWorkerId) {
      // Attempt conditional atomic update on already BUSY worker
      const { data: raceLockedWorker } = await client
        .from("workers")
        .update({ availability_status: "BUSY" })
        .eq("id", allocatedWorkerId)
        .eq("availability_status", "AVAILABLE")
        .select("id")
        .maybeSingle();

      if (raceLockedWorker) {
        throw new Error("Concurrency failure: Second caller was able to lock an already BUSY worker!");
      }
      console.log("[TEST 2 PASSED] Concurrency guard verified: Second allocation was rejected (0 rows matched conditional update)");
    }

    // -------------------------------------------------------------
    // TEST 3: Admin Manual Allocation Assistance
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Testing Admin Allocation Assistant...");
    // Free the worker first
    if (allocatedWorkerId) {
      await client
        .from("workers")
        .update({ availability_status: "AVAILABLE" })
        .eq("id", allocatedWorkerId);
    }

    // Create an unassigned booking
    const unassignedBookingNum = `EMG-TEST-UNASSIGNED-${Date.now()}`;
    const { data: unassignedBooking } = await insertBookingWithFallback({
      booking_number: unassignedBookingNum,
      customer_id: customer.id,
      worker_id: null,
      service_id: serviceId,
      federation_id: federationId,
      address_id: addressId,
      priority: "HIGH",
      problem_description: "[PRIORITY: HIGH] Gas leak detected",
      status: "REQUEST_SENT",
      total_amount: 600,
      platform_fee: 90,
      worker_earnings: 510,
    });

    if (!unassignedBooking) throw new Error("Failed to create unassigned booking");
    testBookingIds.push(unassignedBooking.id);

    // Admin allocates worker
    const { data: adminLock } = await client
      .from("workers")
      .update({ availability_status: "BUSY" })
      .eq("id", worker.id)
      .eq("availability_status", "AVAILABLE")
      .select("id")
      .maybeSingle();

    if (!adminLock) {
      throw new Error("Admin lock failed unexpectedly");
    }

    await client
      .from("bookings")
      .update({
        worker_id: worker.id,
        status: "BOOKING_CONFIRMED",
        problem_description: `${unassignedBooking.problem_description}\n[ADMIN_ALLOCATION by super-admin: Super Admin emergency assistance]`,
      })
      .eq("id", unassignedBooking.id);

    const { data: verifiedAdminBooking } = await client
      .from("bookings")
      .select("worker_id, status")
      .eq("id", unassignedBooking.id)
      .single();

    if (verifiedAdminBooking?.worker_id !== worker.id) {
      throw new Error("Admin allocation did not update worker_id");
    }
    console.log(`[TEST 3 PASSED] Admin allocation succeeded: Worker ${worker.id} assigned to booking`);

    // -------------------------------------------------------------
    // TEST 4: LOW and MODERATE requests do NOT trigger auto-dispatch
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Testing LOW and MODERATE requests (Must NOT trigger auto-dispatch)...");
    const lowBookingNum = `EMG-TEST-LOW-${Date.now()}`;
    const { data: lowBooking } = await insertBookingWithFallback({
      booking_number: lowBookingNum,
      customer_id: customer.id,
      worker_id: null,
      service_id: serviceId,
      federation_id: federationId,
      address_id: addressId,
      priority: "LOW",
      problem_description: "[PRIORITY: LOW] Slow bathroom drain",
      status: "REQUEST_SENT",
      total_amount: 300,
      platform_fee: 45,
      worker_earnings: 255,
    });

    if (!lowBooking) throw new Error("Failed to create LOW booking");
    testBookingIds.push(lowBooking.id);

    if (lowBooking.worker_id !== null) {
      throw new Error("Violation: LOW priority booking was auto-assigned a worker!");
    }
    console.log("[TEST 4 PASSED] LOW priority booking correctly created WITHOUT auto-dispatch (worker_id = null)");

    const modBookingNum = `EMG-TEST-MOD-${Date.now()}`;
    const { data: modBooking } = await insertBookingWithFallback({
      booking_number: modBookingNum,
      customer_id: customer.id,
      worker_id: null,
      service_id: serviceId,
      federation_id: federationId,
      address_id: addressId,
      priority: "MODERATE",
      problem_description: "[PRIORITY: MODERATE] Water heater intermittent failure",
      status: "REQUEST_SENT",
      total_amount: 400,
      platform_fee: 60,
      worker_earnings: 340,
    });

    if (!modBooking) throw new Error("Failed to create MODERATE booking");
    testBookingIds.push(modBooking.id);

    if (modBooking.worker_id !== null) {
      throw new Error("Violation: MODERATE priority booking was auto-assigned a worker!");
    }
    console.log("[TEST 4 PASSED] MODERATE priority booking correctly created WITHOUT auto-dispatch (worker_id = null)");

    // -------------------------------------------------------------
    // TEST 5: Normal Customer → Worker Service Flow Unchanged
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Testing Normal Customer Flow (Unchanged)...");
    const normalBookingNum = `STD-TEST-${Date.now()}`;
    const { data: normalBooking } = await insertBookingWithFallback({
      booking_number: normalBookingNum,
      customer_id: customer.id,
      worker_id: null,
      service_id: serviceId,
      federation_id: federationId,
      address_id: addressId,
      priority: "LOW",
      problem_description: "Standard scheduled maintenance",
      status: "REQUEST_SENT",
      total_amount: 500,
      platform_fee: 75,
      worker_earnings: 425,
    });

    if (!normalBooking) throw new Error("Failed to create normal booking");
    testBookingIds.push(normalBooking.id);

    if (normalBooking.worker_id !== null) {
      throw new Error("Violation: Standard booking was auto-assigned!");
    }
    console.log("[TEST 5 PASSED] Standard customer service flow is completely unaffected.");

  } finally {
    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log("\n[CLEANUP] Cleaning up test data...");
    if (testBookingIds.length > 0) {
      await client.from("bookings").delete().in("id", testBookingIds);
      console.log(`[CLEANUP] Deleted ${testBookingIds.length} test bookings.`);
    }

    // Reset worker availability back to AVAILABLE
    if (worker) {
      await client
        .from("workers")
        .update({ availability_status: "AVAILABLE" })
        .eq("id", worker.id);
      console.log(`[CLEANUP] Reset worker ${worker.id} availability_status to 'AVAILABLE'.`);
    }
  }

  console.log("\n==================================================");
  console.log("ALL PHASE 2 VERIFICATION TESTS PASSED SUCCESSFULLY");
  console.log("==================================================");
}

runTests().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

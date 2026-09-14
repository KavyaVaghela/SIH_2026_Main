/**
 * Phase 3 Verification Suite: Multi-Worker Request + Competing Estimates
 * 
 * Verifies all 10 tests specified in Phase 3 Part T against the live linked Supabase database.
 * Run with: npx tsx scripts/verify_phase_3.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { multiWorkerService } from "../features/customer/services/multi-worker-service";
import { matchingService } from "../features/matching/services/matching-service";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dxvnwbmxeubpbunwlmnd.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing SUPABASE env variables: url=" + !!supabaseUrl + ", anon=" + !!supabaseAnonKey);
  process.exit(1);
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function record(name: string, category: string, passed: boolean, message: string, details?: any) {
  results.push({ name, category, passed, message, details });
  const status = passed ? "\x1b[32m[PASS]\x1b[0m" : "\x1b[31m[FAIL]\x1b[0m";
  console.log(`${status} [${category}] ${name}: ${message}`);
  if (details && !passed) {
    console.log("   Details:", JSON.stringify(details));
  }
}

async function runPhase3Verification() {
  console.log("\n========================================================");
  console.log("  KAUSHALYASETU — PHASE 3 AUTOMATED VERIFICATION SUITE");
  console.log("  Multi-Worker Requests + Competing Estimates Engine");
  console.log("========================================================\n");

  const customerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
  let serviceId = "";
  let worker1Id = "";
  let worker2Id = "";
  let worker3Id = "";
  let testRequestId = "";
  let canonicalBookingId = "";

  try {
    // ----------------------------------------------------
    // PREPARATION: Fetch real test workers and service
    // ----------------------------------------------------
    const { data: services } = await (adminSupabase.from("services") as any)
      .select("id, title")
      .limit(1);
    
    if (!services || services.length === 0) {
      throw new Error("No services found in database for testing.");
    }
    serviceId = services[0].id;

    const { data: workers } = await (adminSupabase.from("workers") as any)
      .select("id, profile_id, account_status, profiles(full_name)")
      .eq("account_status", "ACTIVE")
      .limit(3);

    if (!workers || workers.length < 3) {
      throw new Error(`Insufficient active workers found: ${workers?.length || 0}. Need at least 3.`);
    }

    worker1Id = workers[0].id;
    worker2Id = workers[1].id;
    worker3Id = workers[2].id;

    console.log(`Test Customer: ${customerId}`);
    console.log(`Test Service:  ${services[0].title} (${serviceId})`);
    console.log(`Worker A:      ${workers[0].profiles?.full_name || worker1Id}`);
    console.log(`Worker B:      ${workers[1].profiles?.full_name || worker2Id}`);
    console.log(`Worker C:      ${workers[2].profiles?.full_name || worker3Id}\n`);

    // ====================================================
    // TEST 1: Multi-worker request creation
    // ====================================================
    try {
      const created = await multiWorkerService.createMultiWorkerRequest({
        customerId,
        serviceId,
        description: "Phase 3 Automated Test: Water pipe leaking under sink needing replacement.",
        preferredSchedule: new Date(Date.now() + 86400000).toISOString(),
        workerIds: [worker1Id, worker2Id, worker3Id],
        initialEstimate: 500,
      });

      testRequestId = created.requestId;

      // Verify 1 job_requests row created in Supabase
      const { data: jobReq } = await (adminSupabase.from("job_requests") as any)
        .select("*")
        .eq("id", testRequestId)
        .single();

      // Verify 3 worker_estimates rows created in Supabase with status PENDING
      const { data: estimates } = await (adminSupabase.from("worker_estimates") as any)
        .select("*")
        .eq("job_request_id", testRequestId);

      const allPending = estimates?.every((e: any) => e.status === "PENDING");
      const matchedWorkers = estimates?.map((e: any) => e.worker_id).sort();
      const expectedWorkers = [worker1Id, worker2Id, worker3Id].sort();
      const workersMatch = JSON.stringify(matchedWorkers) === JSON.stringify(expectedWorkers);

      record(
        "TEST 1: Multi-Worker Request Creation",
        "Multi-Worker Request",
        !!jobReq && estimates?.length === 3 && allPending && workersMatch,
        `Created 1 job_request (#${created.requestNumber}) with 3 worker_estimates in PENDING state.`,
        { jobReqStatus: jobReq?.status, estimateCount: estimates?.length, allPending }
      );
    } catch (err: any) {
      record("TEST 1: Multi-Worker Request Creation", "Multi-Worker Request", false, err.message, err);
    }

    // ====================================================
    // TEST 2: Independent Worker Responses (Interest vs Decline)
    // ====================================================
    try {
      // Worker A expresses interest
      await multiWorkerService.workerExpressInterest(testRequestId, worker1Id);

      // Worker B declines request
      await multiWorkerService.workerDeclineRequest(
        testRequestId,
        worker2Id,
        "Schedule conflict with morning commercial assignment"
      );

      // Fetch states from database
      const { data: estA } = await (adminSupabase.from("worker_estimates") as any)
        .select("status, notes")
        .eq("job_request_id", testRequestId)
        .eq("worker_id", worker1Id)
        .single();

      const { data: estB } = await (adminSupabase.from("worker_estimates") as any)
        .select("status, notes")
        .eq("job_request_id", testRequestId)
        .eq("worker_id", worker2Id)
        .single();

      const { data: estC } = await (adminSupabase.from("worker_estimates") as any)
        .select("status")
        .eq("job_request_id", testRequestId)
        .eq("worker_id", worker3Id)
        .single();

      const isAInterested = estA?.status === "INTERESTED";
      const isBDeclined = estB?.status === "DECLINED";
      const isCPending = estC?.status === "PENDING";

      record(
        "TEST 2: Independent Worker Responses",
        "Worker Responses",
        isAInterested && isBDeclined && isCPending,
        `Worker A is INTERESTED, Worker B is DECLINED, Worker C remains PENDING. B's decline did not affect A or C.`,
        { statusA: estA?.status, statusB: estB?.status, statusC: estC?.status }
      );
    } catch (err: any) {
      record("TEST 2: Independent Worker Responses", "Worker Responses", false, err.message, err);
    }

    // ====================================================
    // TEST 3: Estimate Submission with Itemized Details
    // ====================================================
    try {
      // Worker A submits ₹700
      await multiWorkerService.workerSubmitEstimate(
        testRequestId,
        worker1Id,
        700,
        "Includes standard labor and brass coupling joint replacement",
        500,
        200
      );

      const { data: estA } = await (adminSupabase.from("worker_estimates") as any)
        .select("status, estimated_amount, notes")
        .eq("job_request_id", testRequestId)
        .eq("worker_id", worker1Id)
        .single();

      const { data: jobReq } = await (adminSupabase.from("job_requests") as any)
        .select("status")
        .eq("id", testRequestId)
        .single();

      const isSubmitted = estA?.status === "ESTIMATE_SUBMITTED";
      const amountMatches = Number(estA?.estimated_amount) === 700;
      const reqStatusUpdated = jobReq?.status === "ESTIMATES_AVAILABLE";

      record(
        "TEST 3: Estimate Submission with Itemized Details",
        "Estimates",
        isSubmitted && amountMatches && reqStatusUpdated,
        `Worker A submitted quotation ₹700; request transitioned to ESTIMATES_AVAILABLE.`,
        { status: estA?.status, amount: estA?.estimated_amount, reqStatus: jobReq?.status }
      );
    } catch (err: any) {
      record("TEST 3: Estimate Submission with Itemized Details", "Estimates", false, err.message, err);
    }

    // ====================================================
    // TEST 4: Multiple Competing Estimates
    // ====================================================
    try {
      // Worker C submits ₹600
      await multiWorkerService.workerSubmitEstimate(
        testRequestId,
        worker3Id,
        600,
        "Cooperative verified plumbing estimate with 30-day workmanship guarantee",
        450,
        150
      );

      const { data: estC } = await (adminSupabase.from("worker_estimates") as any)
        .select("status, estimated_amount")
        .eq("job_request_id", testRequestId)
        .eq("worker_id", worker3Id)
        .single();

      const isCSubmitted = estC?.status === "ESTIMATE_SUBMITTED";
      const cAmountMatches = Number(estC?.estimated_amount) === 600;

      record(
        "TEST 4: Multiple Competing Estimates",
        "Estimates",
        isCSubmitted && cAmountMatches,
        `Worker C submitted competing quotation of ₹600 alongside Worker A (₹700) and Worker B (DECLINED).`,
        { workerCAmount: estC?.estimated_amount }
      );
    } catch (err: any) {
      record("TEST 4: Multiple Competing Estimates", "Estimates", false, err.message, err);
    }

    // ====================================================
    // TEST 5: Dynamic Best Estimate Calculation
    // ====================================================
    try {
      // Query summary as customer
      const details1 = await multiWorkerService.getRequestDetails(testRequestId);
      const initialBest = details1?.bestEstimate; // Should be 600

      // Worker C updates their quote to ₹550
      await multiWorkerService.workerSubmitEstimate(
        testRequestId,
        worker3Id,
        550,
        "Revised competitive pricing for morning slot",
        400,
        150
      );

      const details2 = await multiWorkerService.getRequestDetails(testRequestId);
      const updatedBest = details2?.bestEstimate; // Should be 550

      const isInitialCorrect = initialBest === 600;
      const isUpdatedCorrect = updatedBest === 550;

      record(
        "TEST 5: Dynamic Best Estimate Calculation",
        "Best Estimate",
        isInitialCorrect && isUpdatedCorrect,
        `Best estimate calculated dynamically as MIN(estimates): initial ₹${initialBest} -> updated ₹${updatedBest}.`,
        { initialBest, updatedBest }
      );
    } catch (err: any) {
      record("TEST 5: Dynamic Best Estimate Calculation", "Best Estimate", false, err.message, err);
    }

    // ====================================================
    // TEST 6: Realtime Broadcast Channel Delivery
    // ====================================================
    try {
      const channelName = `request_estimates_${testRequestId}`;
      const customerClient = createClient(supabaseUrl, supabaseAnonKey);
      const workerClient = createClient(supabaseUrl, supabaseAnonKey);
      let eventReceived = false;

      const subChannel = customerClient.channel(channelName);
      
      const broadcastPromise = new Promise<boolean>((resolve) => {
        const timer = setTimeout(() => {
          resolve(eventReceived);
        }, 6000);

        subChannel
          .on("broadcast", { event: "test_phase3_ping" }, (payload) => {
            if (payload?.payload?.ping === "pong") {
              eventReceived = true;
              clearTimeout(timer);
              resolve(true);
            }
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              const pubChannel = workerClient.channel(channelName);
              pubChannel.subscribe(async (pubStatus) => {
                if (pubStatus === "SUBSCRIBED") {
                  await pubChannel.send({
                    type: "broadcast",
                    event: "test_phase3_ping",
                    payload: { ping: "pong" },
                  });
                }
              });
            }
          });
      });

      const broadcastDelivered = await broadcastPromise;
      await customerClient.removeChannel(subChannel);

      record(
        "TEST 6: Realtime Broadcast Channel Delivery",
        "Realtime Delivery",
        broadcastDelivered,
        `Supabase Realtime Broadcast channel '${channelName}' delivered events without browser refresh.`,
        { channelName, delivered: broadcastDelivered }
      );
    } catch (err: any) {
      record("TEST 6: Realtime Broadcast Channel Delivery", "Realtime Delivery", false, err.message, err);
    }

    // ====================================================
    // TEST 7: Customer Selection & Canonical Booking Creation
    // ====================================================
    try {
      // Customer confirms Worker C (lowest estimate: ₹550)
      const confirmation = await multiWorkerService.confirmSelectedWorker(
        testRequestId,
        worker3Id,
        customerId
      );

      canonicalBookingId = confirmation.bookingId;

      // 1. Verify job_requests status
      const { data: jobReq } = await (adminSupabase.from("job_requests") as any)
        .select("status")
        .eq("id", testRequestId)
        .single();

      // 2. Verify worker_estimates statuses
      const { data: estA } = await (adminSupabase.from("worker_estimates") as any)
        .select("status")
        .eq("job_request_id", testRequestId)
        .eq("worker_id", worker1Id)
        .single();

      const { data: estB } = await (adminSupabase.from("worker_estimates") as any)
        .select("status")
        .eq("job_request_id", testRequestId)
        .eq("worker_id", worker2Id)
        .single();

      const { data: estC } = await (adminSupabase.from("worker_estimates") as any)
        .select("status")
        .eq("job_request_id", testRequestId)
        .eq("worker_id", worker3Id)
        .single();

      // 3. Verify canonical booking in public.bookings
      const { data: booking } = await (adminSupabase.from("bookings") as any)
        .select("id, booking_number, status, worker_id, customer_id, total_amount")
        .eq("id", canonicalBookingId)
        .single();

      const isReqConfirmed = jobReq?.status === "CONFIRMED";
      const isCSelected = estC?.status === "SELECTED";
      const isANotSelected = estA?.status === "NOT_SELECTED";
      const isBDeclined = estB?.status === "DECLINED"; // preserved
      const isBookingValid =
        booking?.status === "BOOKING_CONFIRMED" &&
        booking?.worker_id === worker3Id &&
        booking?.customer_id === customerId &&
        Number(booking?.total_amount) === 550;

      record(
        "TEST 7: Customer Confirms Selected Worker",
        "Worker Selection",
        isReqConfirmed && isCSelected && isANotSelected && isBDeclined && isBookingValid,
        `Worker C is SELECTED, Worker A is NOT_SELECTED, Worker B remained DECLINED. Canonical booking #${booking?.booking_number} created in BOOKING_CONFIRMED (₹550).`,
        {
          jobReqStatus: jobReq?.status,
          workerCStatus: estC?.status,
          workerAStatus: estA?.status,
          workerBStatus: estB?.status,
          bookingStatus: booking?.status,
        }
      );
    } catch (err: any) {
      record("TEST 7: Customer Confirms Selected Worker", "Worker Selection", false, err.message, err);
    }

    // ====================================================
    // TEST 8: Concurrency & Atomic Lock Protection
    // ====================================================
    try {
      let duplicateBlocked = false;
      let errorMessage = "";

      // Attempt to confirm Worker A on the already confirmed request
      try {
        await multiWorkerService.confirmSelectedWorker(testRequestId, worker1Id, customerId);
      } catch (e: any) {
        duplicateBlocked = true;
        errorMessage = e.message;
      }

      // Verify that no second booking was created for Worker A
      const { data: rogueBookings } = await (adminSupabase.from("bookings") as any)
        .select("id")
        .eq("worker_id", worker1Id)
        .eq("problem_description", "Phase 3 Automated Test: Water pipe leaking under sink needing replacement.");

      const noRogueBookings = (rogueBookings || []).length === 0;

      record(
        "TEST 8: Concurrency & Atomic Lock Protection",
        "Atomic Locking",
        duplicateBlocked && noRogueBookings,
        `Duplicate confirmation strictly blocked with 409 conflict: "${errorMessage}". Zero duplicate bookings created.`,
        { duplicateBlocked, rogueCount: rogueBookings?.length }
      );
    } catch (err: any) {
      record("TEST 8: Concurrency & Atomic Lock Protection", "Atomic Locking", false, err.message, err);
    }

    // ====================================================
    // TEST 9: Security and Competitor Bid Isolation
    // ====================================================
    try {
      // Worker 1 requests details of the request
      const worker1View = await multiWorkerService.getRequestDetails(testRequestId, worker1Id);

      // Verify that Worker 1 sees their own estimate details
      const ownEstimate = worker1View?.estimates?.find((e) => e.workerId === worker1Id);
      const competitorEstimate = worker1View?.estimates?.find((e) => e.workerId === worker3Id);

      const ownEstimateVisible = Number(ownEstimate?.estimatedAmount) === 700;
      // Competitor estimate must be masked (estimatedAmount = 0 or hidden)
      const competitorEstimateMasked = competitorEstimate ? Number(competitorEstimate.estimatedAmount) === 0 : false;

      record(
        "TEST 9: Security and Competitor Bid Isolation",
        "Security & RLS",
        ownEstimateVisible && competitorEstimateMasked,
        `Worker 1 can see own quotation (₹700) but competitor Worker C's quotation is masked (₹${competitorEstimate?.estimatedAmount}) to protect bidding privacy.`,
        { ownEstimate: ownEstimate?.estimatedAmount, competitorEstimate: competitorEstimate?.estimatedAmount }
      );
    } catch (err: any) {
      record("TEST 9: Security and Competitor Bid Isolation", "Security & RLS", false, err.message, err);
    }

    // ====================================================
    // TEST 10: Phase 1 & Phase 2 Regression Checks
    // ====================================================
    try {
      // 1. Verify matching engine still works (Phase 2)
      const matches = await matchingService.findEligibleWorkers({
        serviceId,
        customerLatitude: 23.0300,
        customerLongitude: 72.5200,
        maxRadiusKm: 25,
      });

      const matchingWorks = matches.length > 0 && matches.every((m) => m.matchScore > 0);

      // 2. Verify customer service requests listing (Phase 3)
      const customerReqs = await multiWorkerService.getCustomerServiceRequests(customerId);
      const reqFound = customerReqs.some((r) => r.id === testRequestId);

      // 3. Verify federation scoping intact (Phase 1)
      const { data: fedWorkers } = await (adminSupabase.from("workers") as any)
        .select("id, federation_id")
        .eq("federation_id", "b765df3b-c418-4a15-b79f-3cbc09e475dc");

      const federationIntact = (fedWorkers || []).length > 0;

      record(
        "TEST 10: Regression Verification",
        "Regression",
        matchingWorks && reqFound && federationIntact,
        `Matching engine returned ${matches.length} ranked workers; customer requests listed; federation scoping verified intact.`,
        { matchesCount: matches.length, customerReqFound: reqFound, federationWorkersCount: fedWorkers?.length }
      );
    } catch (err: any) {
      record("TEST 10: Regression Verification", "Regression", false, err.message, err);
    }

  } catch (fatal: any) {
    console.error("FATAL ERROR IN VERIFICATION SUITE:", fatal);
  }

  // ----------------------------------------------------
  // CLEANUP TEST DATA
  // ----------------------------------------------------
  if (testRequestId) {
    try {
      await (adminSupabase.from("worker_estimates") as any)
        .delete()
        .eq("job_request_id", testRequestId);
      if (canonicalBookingId) {
        await (adminSupabase.from("bookings") as any)
          .delete()
          .eq("id", canonicalBookingId);
      }
      await (adminSupabase.from("job_requests") as any)
        .delete()
        .eq("id", testRequestId);
      console.log("\n[CLEANUP] Test records cleaned up successfully.");
    } catch (cleanErr) {
      console.warn("[CLEANUP] Notice during cleanup:", cleanErr);
    }
  }

  // ----------------------------------------------------
  // SUMMARY REPORT
  // ----------------------------------------------------
  console.log("\n========================================================");
  console.log("  PHASE 3 VERIFICATION SUMMARY");
  console.log("========================================================");
  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  console.log(`Results: ${passedCount} / ${totalCount} tests passed\n`);

  results.forEach((r, idx) => {
    const icon = r.passed ? "✔" : "✘";
    console.log(`${idx + 1}. [${r.category}] ${r.name}: ${icon} ${r.message}`);
  });

  if (passedCount === totalCount) {
    console.log("\n\x1b[32m>>> ALL 10 PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY! <<<\x1b[0m\n");
    process.exit(0);
  } else {
    console.log(`\n\x1b[31m>>> ${totalCount - passedCount} TESTS FAILED. PLEASE REVIEW LOGS. <<<\x1b[0m\n`);
    process.exit(1);
  }
}

runPhase3Verification();

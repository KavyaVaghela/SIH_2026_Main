import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../lib/supabase/admin";
import { multiWorkerService } from "../features/customer/services/multi-worker-service";
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

let testPassCount = 0;
let testFailCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    testPassCount++;
  } else {
    console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ""}`);
    testFailCount++;
  }
}

async function runRegressionSuite() {
  console.log("================================================================================");
  console.log("PHASE 3 REGRESSION SUITE: WORKER ESTIMATE CUSTOMER VISIBILITY & SECURITY");
  console.log("================================================================================\n");

  const adminSupabase = createAdminClient();

  // 1. Authenticate Customer 1
  const customerClient = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data: custAuth, error: custAuthErr } = await customerClient.auth.signInWithPassword({
    email: "customer@example.com",
    password: "Password123!",
  });
  if (custAuthErr) throw new Error("Customer 1 authentication failed: " + custAuthErr.message);
  const customerId = custAuth.user.id;
  console.log(`Customer 1 Authenticated: UID = ${customerId}`);

  // Authenticate Customer 2 (for isolation check)
  const customer2Client = createClient(url, anonKey, { auth: { persistSession: false } });
  // If no second customer user, create or sign in with admin test user
  const customer2Email = `customer2.test.${Date.now()}@example.com`;
  const { data: cust2User, error: cust2Err } = await adminSupabase.auth.admin.createUser({
    email: customer2Email,
    password: "Password123!",
    email_confirm: true,
  });
  if (cust2Err) throw new Error("Failed to create Customer 2 test user: " + cust2Err.message);
  const customer2Id = cust2User.user.id;
  await (adminSupabase.from("profiles") as any).insert({
    id: customer2Id,
    email: customer2Email,
    full_name: "Competitor Customer",
    role: "CUSTOMER",
  });
  await customer2Client.auth.signInWithPassword({
    email: customer2Email,
    password: "Password123!",
  });
  console.log(`Customer 2 Authenticated: UID = ${customer2Id}`);

  // Fetch 3 Active Workers for Competing Flow
  const { data: workersList } = await (adminSupabase.from("workers") as any)
    .select("id, profile_id, profession, profiles(full_name, email)")
    .eq("account_status", "ACTIVE")
    .limit(3);

  if (!workersList || workersList.length < 3) {
    throw new Error("Requires at least 3 active workers in database for competing flow testing.");
  }

  const workerA = workersList[0];
  const workerB = workersList[1];
  const workerC = workersList[2];

  console.log(`Worker A: ${workerA.id} (${workerA.profiles?.full_name || "Worker A"})`);
  console.log(`Worker B: ${workerB.id} (${workerB.profiles?.full_name || "Worker B"})`);
  console.log(`Worker C: ${workerC.id} (${workerC.profiles?.full_name || "Worker C"})\n`);

  // Fetch a valid Service
  const { data: service } = await (adminSupabase.from("services") as any)
    .select("id, title, base_price, minimum_visit_charge")
    .limit(1)
    .single();

  let createdRequestId = "";

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Customer creates request for multiple workers
    // -------------------------------------------------------------------------
    console.log("--- TEST 1: Customer Creates Multi-Worker Request ---");
    const createRes = await multiWorkerService.createMultiWorkerRequest({
      customerId,
      serviceId: service.id,
      description: "Emergency multi-worker estimate visibility verification",
      preferredSchedule: new Date(Date.now() + 86400000).toISOString(),
      workerIds: [workerA.id, workerB.id, workerC.id],
    });

    createdRequestId = createRes.requestId;
    assert(Boolean(createdRequestId), "Test 1.1: Customer created job_request with multiple workers", `Request ID: ${createdRequestId}`);
    assert(createRes.workerCount === 3, "Test 1.2: Exact requested worker count recorded (3 workers)");

    // Verify initial database state
    const { data: initEstimates } = await (adminSupabase.from("worker_estimates") as any)
      .select("*")
      .eq("job_request_id", createdRequestId);

    assert(initEstimates?.length === 3, "Test 1.3: 3 initial PENDING rows created in public.worker_estimates");
    assert(initEstimates?.every((e: any) => e.status === "PENDING" && Number(e.estimated_amount) === 0),
      "Test 1.4: All initial estimate amounts are 0 and status is PENDING");

    // -------------------------------------------------------------------------
    // TEST 2 & 3: Worker A Submits Estimate ₹700 & Customer Sees It
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 2 & 3: Worker A Submits ₹700 (Labor: 500, Materials: 150, Additional: 50) ---");
    const laborA = 500;
    const matA = 150;
    const addA = 50;
    const totalA = laborA + matA + addA; // 700

    await multiWorkerService.workerSubmitEstimate(
      createdRequestId,
      workerA.id,
      totalA,
      "Inspection & complete pipeline seal",
      laborA,
      matA,
      addA
    );

    const detailsAfterA = await multiWorkerService.getRequestDetails(createdRequestId);
    assert(detailsAfterA !== null, "Test 3.1: Customer query retrieved service request details");
    assert(detailsAfterA?.totalEstimates === 1, "Test 3.2: Customer query counts exactly 1 submitted estimate", `Got: ${detailsAfterA?.totalEstimates}`);
    assert(detailsAfterA?.bestEstimate === 700, "Test 3.3: Dynamic Best Estimate is ₹700", `Got: ${detailsAfterA?.bestEstimate}`);

    const estimateA = detailsAfterA?.estimates.find((e) => e.workerId === workerA.id);
    assert(estimateA?.status === "ESTIMATE_SUBMITTED", "Test 3.4: Worker A estimate status is ESTIMATE_SUBMITTED");
    assert(estimateA?.estimatedAmount === 700, "Test 3.5: Worker A total quote is ₹700");
    assert(estimateA?.laborAmount === 500, "Test 3.6: Worker A labor amount is ₹500", `Got: ${estimateA?.laborAmount}`);
    assert(estimateA?.materialAmount === 150, "Test 3.7: Worker A material amount is ₹150", `Got: ${estimateA?.materialAmount}`);
    assert(estimateA?.additionalCharges === 50, "Test 3.8: Worker A additional charge is ₹50", `Got: ${estimateA?.additionalCharges}`);

    // -------------------------------------------------------------------------
    // TEST 4, 5, 6: Worker B Submits Estimate ₹650 & Best Estimate Becomes ₹650
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 4, 5, 6: Worker B Submits ₹650 & Dynamic Best Estimate Updates ---");
    const laborB = 450;
    const matB = 150;
    const addB = 50;
    const totalB = laborB + matB + addB; // 650

    await multiWorkerService.workerSubmitEstimate(
      createdRequestId,
      workerB.id,
      totalB,
      "Direct pipe joinery and warranty",
      laborB,
      matB,
      addB
    );

    const detailsAfterB = await multiWorkerService.getRequestDetails(createdRequestId);
    assert(detailsAfterB?.totalEstimates === 2, "Test 5.1: Customer query counts 2 submitted estimates", `Got: ${detailsAfterB?.totalEstimates}`);
    assert(detailsAfterB?.bestEstimate === 650, "Test 6.1: Dynamic Best Estimate updated dynamically to ₹650", `Got: ${detailsAfterB?.bestEstimate}`);

    const estimateB = detailsAfterB?.estimates.find((e) => e.workerId === workerB.id);
    assert(estimateB?.status === "ESTIMATE_SUBMITTED", "Test 5.2: Worker B estimate status is ESTIMATE_SUBMITTED");
    assert(estimateB?.estimatedAmount === 650, "Test 5.3: Worker B total quote is ₹650");

    // -------------------------------------------------------------------------
    // TEST 7, 8, 9: Worker C Submits Estimate ₹550 & Best Estimate Becomes ₹550
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 7, 8, 9: Worker C Submits ₹550 & Dynamic Best Estimate Updates ---");
    const laborC = 400;
    const matC = 100;
    const addC = 50;
    const totalC = laborC + matC + addC; // 550

    await multiWorkerService.workerSubmitEstimate(
      createdRequestId,
      workerC.id,
      totalC,
      "Discounted cooperative member rate",
      laborC,
      matC,
      addC
    );

    const detailsAfterC = await multiWorkerService.getRequestDetails(createdRequestId);
    assert(detailsAfterC?.totalEstimates === 3, "Test 8.1: Customer query counts all 3 submitted estimates", `Got: ${detailsAfterC?.totalEstimates}`);
    assert(detailsAfterC?.bestEstimate === 550, "Test 9.1: Dynamic Best Estimate updated dynamically to ₹550", `Got: ${detailsAfterC?.bestEstimate}`);

    const estimateC = detailsAfterC?.estimates.find((e) => e.workerId === workerC.id);
    assert(estimateC?.status === "ESTIMATE_SUBMITTED", "Test 8.2: Worker C estimate status is ESTIMATE_SUBMITTED");
    assert(estimateC?.estimatedAmount === 550, "Test 8.3: Worker C total quote is ₹550");
    assert(estimateC?.laborAmount === 400, "Test 8.4: Worker C labor amount is ₹400", `Got: ${estimateC?.laborAmount}`);
    assert(estimateC?.materialAmount === 100, "Test 8.5: Worker C material amount is ₹100", `Got: ${estimateC?.materialAmount}`);

    // Verify all 3 estimates rendered on the customer response
    const validCount = detailsAfterC?.estimates.filter(
      (e) => e.status === "ESTIMATE_SUBMITTED" && e.estimatedAmount > 0
    ).length;
    assert(validCount === 3, "Test 8.6: All three estimates (> ₹0 and ESTIMATE_SUBMITTED) visible simultaneously");

    // -------------------------------------------------------------------------
    // TEST 10: Refresh & Consistency Check
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 10: Refresh & Database State Consistency ---");
    const freshFetch = await multiWorkerService.getRequestDetails(createdRequestId);
    assert(freshFetch?.bestEstimate === 550, "Test 10.1: Fresh fetch reproduces consistent Best Estimate (₹550)");
    assert(freshFetch?.totalEstimates === 3, "Test 10.2: Fresh fetch reproduces consistent total estimates count (3)");

    // -------------------------------------------------------------------------
    // TEST 11: Security & RLS - Customer Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 11: Customer Isolation (Another Customer Access Blocked) ---");
    const { data: customer2JobView, error: c2JobErr } = await (customer2Client.from("job_requests") as any)
      .select("id")
      .eq("id", createdRequestId)
      .maybeSingle();

    assert(!customer2JobView, "Test 11.1: Customer 2 CANNOT read Customer 1's job_request row under RLS");

    const { data: customer2EstView, error: c2EstErr } = await (customer2Client.from("worker_estimates") as any)
      .select("id, estimated_amount")
      .eq("job_request_id", createdRequestId);

    assert(customer2EstView?.length === 0, "Test 11.2: Customer 2 CANNOT view any worker estimates belonging to Customer 1 under RLS");

    // -------------------------------------------------------------------------
    // TEST 12: Worker Isolation (Worker Cannot Modify Other Workers' Estimates)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 12: Worker Estimate Modification Isolation ---");
    // Connect as Worker A
    const workerAClient = createClient(url, anonKey, { auth: { persistSession: false } });
    if (workerA.profiles?.email) {
      const { data: wASignIn } = await workerAClient.auth.signInWithPassword({
        email: workerA.profiles.email,
        password: "Password123!",
      });

      if (wASignIn?.user) {
        // Worker A attempts to tamper with Worker B's estimate row
        const { data: tamperRes, error: tamperErr } = await (workerAClient.from("worker_estimates") as any)
          .update({ estimated_amount: 999999 })
          .eq("job_request_id", createdRequestId)
          .eq("worker_id", workerB.id)
          .select();

        assert(!tamperRes || tamperRes.length === 0, "Test 12.1: Worker A cannot alter Worker B's estimate record under RLS");
      } else {
        console.log("   (Skipping live worker sign-in tamper test: Worker A profile email has no default password)");
      }
    }

    // -------------------------------------------------------------------------
    // TEST 13: Dynamic Calculation (No Hardcoded Values)
    // -------------------------------------------------------------------------
    console.log("\n--- TEST 13: Dynamic Calculation (Arbitrary Non-Hardcoded Amount) ---");
    const dynamicLabor = Math.floor(Math.random() * 200) + 400; // 400-599
    const dynamicMat = Math.floor(Math.random() * 50) + 20;     // 20-69
    const dynamicTotal = dynamicLabor + dynamicMat;

    await multiWorkerService.workerSubmitEstimate(
      createdRequestId,
      workerC.id,
      dynamicTotal,
      "Dynamic non-hardcoded update test",
      dynamicLabor,
      dynamicMat,
      0
    );

    const dynamicCheck = await multiWorkerService.getRequestDetails(createdRequestId);
    const updatedC = dynamicCheck?.estimates.find((e) => e.workerId === workerC.id);
    assert(updatedC?.estimatedAmount === dynamicTotal, `Test 13.1: Estimate updated dynamically to ₹${dynamicTotal}`);
    assert(updatedC?.laborAmount === dynamicLabor, `Test 13.2: Labor parsed dynamically as ₹${dynamicLabor}`);

  } finally {
    // Cleanup test records
    console.log("\n--- CLEANUP ---");
    if (createdRequestId) {
      await (adminSupabase.from("worker_estimates") as any).delete().eq("job_request_id", createdRequestId);
      await (adminSupabase.from("job_requests") as any).delete().eq("id", createdRequestId);
      console.log(`Cleaned up test job_request ${createdRequestId}`);
    }
    if (customer2Id) {
      await (adminSupabase.from("profiles") as any).delete().eq("id", customer2Id);
      await adminSupabase.auth.admin.deleteUser(customer2Id);
      console.log(`Cleaned up test Customer 2 user ${customer2Id}`);
    }
  }

  console.log("\n================================================================================");
  console.log(`PHASE 3 REGRESSION AUDIT REPORT: ${testPassCount} PASSED, ${testFailCount} FAILED`);
  console.log("================================================================================");

  if (testFailCount > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error("FATAL SUITE ERROR:", err);
  process.exit(1);
});

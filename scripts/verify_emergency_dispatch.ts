import * as fs from "fs";
import * as path from "path";
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 1. Load environment from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

// 2. Import handlers and repositories
import { POST as createIncidentHandler } from "../app/api/emergency/incidents/route";
import { GET as getIncidentDetailHandler } from "../app/api/emergency/incidents/[id]/route";
import { GET as getDispatchHandler, POST as postDispatchHandler } from "../app/api/emergency/dispatch/route";
import { POST as createBookingHandler } from "../app/api/bookings/route";
import { EmergencyDispatchRepository } from "../lib/emergency/dispatch-store";
import { EmergencyResponseMatrixRepository } from "../lib/emergency/response-matrix-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || "";
const dbClient = createClient(supabaseUrl, supabaseSecret);

async function runTask3Verification() {
  console.log("==================================================");
  console.log("KAUSHALYA SETU EMERGENCY SERVICES — TASK 3");
  console.log("WORKER ELIGIBILITY + AUTOMATED DISPATCH POOL VERIFICATION");
  console.log("==================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failedTests++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  // -------------------------------------------------------------
  // SETUP: Authenticate real test actors
  // -------------------------------------------------------------
  console.log("[SETUP] Authenticating test actors...");
  const anonClient = createClient(supabaseUrl, supabaseAnon);

  // 1. Customer
  const { data: authCustomer, error: errCust } = await anonClient.auth.signInWithPassword({
    email: "customer@example.com",
    password: "Password123!",
  });
  if (errCust || !authCustomer.session) {
    throw new Error("Failed to authenticate test customer: " + errCust?.message);
  }
  const customerToken = authCustomer.session.access_token;
  const customerId = authCustomer.user.id;
  console.log(`  Authenticated Customer: ${customerId} (${authCustomer.user.email})`);

  // 2. Worker Ravi Patel
  const { data: authWorker, error: errWrk } = await anonClient.auth.signInWithPassword({
    email: "worker@example.com",
    password: "Password123!",
  });
  if (errWrk || !authWorker.session) {
    throw new Error("Failed to authenticate test worker: " + errWrk?.message);
  }
  const workerToken = authWorker.session.access_token;
  const workerUserId = authWorker.user.id;

  // Retrieve Ravi Patel worker table record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raviWorkerRec } = await (dbClient.from("workers") as any)
    .select("id, federation_id, verification_status, account_status, availability_status, profession")
    .eq("profile_id", workerUserId)
    .single();

  const raviWorkerId = raviWorkerRec.id;
  console.log(`  Authenticated Worker Ravi Patel: worker_id=${raviWorkerId}, profile_id=${workerUserId}`);

  // 3. Federation Admin
  const { data: authFedAdmin, error: errFed } = await anonClient.auth.signInWithPassword({
    email: "federation@example.com",
    password: "Password123!",
  });
  if (errFed || !authFedAdmin.session) {
    throw new Error("Failed to authenticate federation admin: " + errFed?.message);
  }
  const fedAdminToken = authFedAdmin.session.access_token;
  const fedAdminId = authFedAdmin.user.id;
  console.log(`  Authenticated Federation Admin: ${fedAdminId} (${authFedAdmin.user.email})\n`);

  let createdIncidentId = "";
  let createdEmergencyId = "";

  // -------------------------------------------------------------
  // A. RESPONSE MATRIX CONSUMPTION & DISPATCH POOL GENERATION
  // -------------------------------------------------------------
  console.log("--------------------------------------------------");
  console.log("A. RESPONSE MATRIX CONSUMPTION & DISPATCH TRIGGER");
  console.log("--------------------------------------------------");
  {
    const req = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        categoryName: "Water Infrastructure",
        emergencyType: "Society Water Tank Burst",
        location: "Block C, Satellite Apartments, Ahmedabad",
        description: "5000L rooftop water tank cracked open, flooding residential terraces and stairwells.",
        approxPeopleAffected: 30,
        immediateDanger: true,
        dangerDetails: "Water pouring into main power electrical conduits.",
        autoDispatch: true,
      }),
    });

    const res = await createIncidentHandler(req);
    const body = await res.json();

    assert(res.status === 201, `Incident created with 201 Created (got ${res.status})`);
    assert(Boolean(body.incident?.id), "Incident UUID generated");
    assert(body.incident.responseMatrixCode === "wat-tank-burst", `Incident references matrix code: ${body.incident.responseMatrixCode}`);
    assert(body.responseMatrix.recommended_worker_count === 6, "Response matrix specifies 6 recommended workers");
    assert(Array.isArray(body.responseMatrix.required_skills), "Response matrix contains required skills list");
    assert(body.responseMatrix.required_skills.includes("Plumbing"), "Plumbing is required skill for Water Tank Burst");

    createdIncidentId = body.incident.id;
    createdEmergencyId = body.incident.emergencyId;

    // Automated dispatch result verification
    assert(Array.isArray(body.dispatchPool), "Automated dispatch pool returned in incident response");
    assert(body.dispatchPool.length > 0, `Dispatch pool contains dispatched workers (found ${body.dispatchPool.length})`);
    assert(body.dispatchSummary !== null, "Dispatch summary metadata returned");
    assert(body.dispatchSummary.requiredCount === 6, "Dispatch summary acknowledges requiredCount: 6");
    console.log(`  ℹ️ Dispatched ${body.dispatchPool.length} candidate workers towards requirement of 6.`);
  }

  // -------------------------------------------------------------
  // B. WORKER ELIGIBILITY ENGINE DETERMINISM & EXCLUSIONS
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("B. DETERMINISTIC WORKER ELIGIBILITY RULES");
  console.log("--------------------------------------------------");
  {
    const matrix = await EmergencyResponseMatrixRepository.findByCode("wat-tank-burst");
    assert(matrix !== null, "Matrix loaded for evaluation");

    const mockIncident: any = {
      id: createdIncidentId,
      emergency_id: createdEmergencyId,
      address_details: { latitude: 23.0300, longitude: 72.5178 },
      category_name: "Water Infrastructure",
      emergency_type: "Society Water Tank Burst",
    };

    // 1. Eligible Worker with Plumbing skill (Ravi Patel)
    const raviWorkerData: any = {
      id: raviWorkerId,
      verification_status: "verified",
      account_status: "ACTIVE",
      availability_status: "AVAILABLE",
      profession: "Plumber",
      service_radius_km: 25.0,
      current_latitude: 23.0305,
      current_longitude: 72.5180,
      worker_skills: [
        { skills: { name: "Plumbing" } },
        { skills: { name: "Pipe Leakage" } },
      ],
      profiles: { full_name: "Ravi Patel" },
      experience_years: 8,
    };
    const evalRavi = await EmergencyDispatchRepository.evaluateWorkerEligibility(raviWorkerData, mockIncident, matrix!);
    assert(evalRavi.isEligible === true, "Verified, available plumber within radius is ELIGIBLE");
    assert(evalRavi.matchedSkills.includes("Plumbing"), "Plumbing skill is matched");
    assert(evalRavi.exclusionReasons.length === 0, "Zero exclusion reasons for eligible worker");

    // 2. Ineligible: Worker without required skill (e.g. Painter / Carpenter only)
    const unqualifiedWorker: any = {
      id: "00000000-0000-0000-0000-000000000002",
      verification_status: "verified",
      account_status: "ACTIVE",
      availability_status: "AVAILABLE",
      profession: "Painter",
      service_radius_km: 25.0,
      current_latitude: 23.0300,
      current_longitude: 72.5178,
      worker_skills: [{ skills: { name: "Wall Painting" } }],
      profiles: { full_name: "Painter Bob" },
      experience_years: 4,
    };
    const evalUnqualified = await EmergencyDispatchRepository.evaluateWorkerEligibility(unqualifiedWorker, mockIncident, matrix!);
    assert(evalUnqualified.isEligible === false, "Worker lacking emergency skills is EXCLUDED");
    assert(
      evalUnqualified.exclusionReasons.some((r) => r.includes("does not possess any required emergency skills")),
      "Exclusion reason explicitly documents lack of required skills"
    );

    // 3. Ineligible: Unavailable Worker
    const unavailableWorker: any = {
      ...raviWorkerData,
      id: "00000000-0000-0000-0000-000000000003",
      availability_status: "UNAVAILABLE",
    };
    const evalUnavailable = await EmergencyDispatchRepository.evaluateWorkerEligibility(unavailableWorker, mockIncident, matrix!);
    assert(evalUnavailable.isEligible === false, "Unavailable worker is EXCLUDED");
    assert(
      evalUnavailable.exclusionReasons.some((r) => r.includes("availability status is not AVAILABLE")),
      "Exclusion reason documents unavailable status"
    );

    // 4. Ineligible: Unverified Worker
    const unverifiedWorker: any = {
      ...raviWorkerData,
      id: "00000000-0000-0000-0000-000000000004",
      verification_status: "pending_verification",
    };
    const evalUnverified = await EmergencyDispatchRepository.evaluateWorkerEligibility(unverifiedWorker, mockIncident, matrix!);
    assert(evalUnverified.isEligible === false, "Unverified worker is EXCLUDED");
    assert(
      evalUnverified.exclusionReasons.some((r) => r.includes("not verified")),
      "Exclusion reason documents lack of verification"
    );

    // 5. Ineligible: Outside Service Radius (> service_radius_km)
    const outOfRadiusWorker: any = {
      ...raviWorkerData,
      id: "00000000-0000-0000-0000-000000000005",
      current_latitude: 21.1702, // Surat (~250km away from Ahmedabad)
      current_longitude: 72.8311,
      service_radius_km: 15.0,
    };
    const evalOutRadius = await EmergencyDispatchRepository.evaluateWorkerEligibility(outOfRadiusWorker, mockIncident, matrix!);
    assert(evalOutRadius.isEligible === false, "Worker outside service radius is EXCLUDED");
    assert(
      evalOutRadius.exclusionReasons.some((r) => r.includes("outside service radius")),
      "Exclusion reason documents distance exceeding radius"
    );

    // 6. Ineligible: Active Emergency Assignment / Capacity
    // Ravi already has an active emergency dispatch for createdIncidentId.
    // Evaluating him for a DIFFERENT incident should exclude him due to active capacity.
    const anotherIncident: any = {
      ...mockIncident,
      id: "99999999-9999-9999-9999-999999999999",
      emergency_id: "EMG-2026-99999",
    };
    const evalCapacity = await EmergencyDispatchRepository.evaluateWorkerEligibility(raviWorkerData, anotherIncident, matrix!);
    assert(evalCapacity.isEligible === false, "Worker with active emergency dispatch is EXCLUDED from another emergency");
    assert(
      evalCapacity.exclusionReasons.some((r) => r.includes("active emergency dispatch")),
      "Exclusion reason documents active emergency capacity limit"
    );
  }

  // -------------------------------------------------------------
  // C. DISPATCH POOL PERSISTENCE & SHORTAGE HANDLING
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("C. DISPATCH POOL PROPERTIES & SHORTAGE DETECTION");
  console.log("--------------------------------------------------");
  {
    const dispatches = await EmergencyDispatchRepository.listDispatchesForIncident(createdIncidentId);
    assert(dispatches.length > 0, `Dispatches found for incident: ${dispatches.length}`);

    // Verify properties of each dispatch record
    for (const d of dispatches) {
      assert(d.incident_id === createdIncidentId, "dispatch.incident_id matches target incident");
      assert(Boolean(d.worker_id), "dispatch.worker_id is present");
      assert(d.status === "DISPATCHED", `dispatch.status is DISPATCHED (got ${d.status})`);
      assert(Boolean(d.required_role), `dispatch.required_role is recorded: ${d.required_role}`);
      assert(Boolean(d.offered_at), "dispatch.offered_at timestamp exists");
    }

    // Duplicate Prevention Check
    const firstDispatchedWorker = dispatches[0].worker_id;
    const initialCount = dispatches.length;
    // Attempt duplicate generation for the same incident
    const reDispatched = await EmergencyDispatchRepository.generateDispatchPool(createdIncidentId);
    const afterCount = (await EmergencyDispatchRepository.listDispatchesForIncident(createdIncidentId)).length;
    assert(initialCount === afterCount, `Duplicate dispatch prevented: count before (${initialCount}) === count after (${afterCount})`);

    // Check shortage handling:
    // If the pool found fewer than 6 workers in DB, verify incident status is STAFFING_SHORTAGE
    const detailReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${createdIncidentId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const detailRes = await getIncidentDetailHandler(detailReq, { params: { id: createdIncidentId } });
    const detailBody = await detailRes.json();

    if (dispatches.length < 6) {
      assert(
        detailBody.incident.status === "STAFFING_SHORTAGE",
        `Shortage detected deterministically: incident status updated to STAFFING_SHORTAGE (${detailBody.incident.status})`
      );
    } else {
      assert(
        detailBody.incident.status === "DISPATCHING",
        `Full roster dispatched: incident status is DISPATCHING (${detailBody.incident.status})`
      );
    }
  }

  // -------------------------------------------------------------
  // D. SECURITY & ROLE-BASED ACCESS CONTROL
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("D. SECURITY & ROLE-BASED ACCESS CONTROL");
  console.log("--------------------------------------------------");
  {
    // 1. Customer CANNOT trigger dispatch directly via POST
    const custPostReq = new NextRequest("http://localhost:3000/api/emergency/dispatch", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ incidentId: createdIncidentId }),
    });
    const custPostRes = await postDispatchHandler(custPostReq);
    assert(custPostRes.status === 403, `Customer POST to /api/emergency/dispatch rejected with 403 Forbidden (got ${custPostRes.status})`);

    // 2. Customer CANNOT view arbitrary worker dispatch queues via GET
    const custWorkerGetReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch?workerId=${raviWorkerId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const custWorkerGetRes = await getDispatchHandler(custWorkerGetReq);
    assert(custWorkerGetRes.status === 403, `Customer GET for worker dispatch rejected with 403 Forbidden (got ${custWorkerGetRes.status})`);

    // 3. Worker CAN view their own dispatched opportunities
    const workerOwnGetReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch?workerId=${raviWorkerId}`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const workerOwnGetRes = await getDispatchHandler(workerOwnGetReq);
    assert(workerOwnGetRes.status === 200, `Worker can view their own dispatch queue (got ${workerOwnGetRes.status})`);

    // 4. Worker CANNOT view another worker's dispatch queue
    const fakeOtherWorkerId = "00000000-0000-0000-0000-999999999999";
    const workerTrespassReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch?workerId=${fakeOtherWorkerId}`, {
      headers: { Authorization: `Bearer ${workerToken}` },
    });
    const workerTrespassRes = await getDispatchHandler(workerTrespassReq);
    assert(workerTrespassRes.status === 403, `Worker blocked from viewing another worker's dispatch queue with 403 Forbidden (got ${workerTrespassRes.status})`);
  }

  // -------------------------------------------------------------
  // E. REGRESSION TESTS (NORMAL BOOKINGS & TASK 1/2)
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("E. REGRESSION: NORMAL BOOKINGS REMAIN UNTOUCHED");
  console.log("--------------------------------------------------");
  {
    const normalReq = new NextRequest("http://localhost:3000/api/bookings", {
      method: "POST",
      body: JSON.stringify({
        action: "create",
        customerId: customerId,
        workerId: raviWorkerId,
        serviceId: "a510e2c8-5ee9-4b01-abfc-a2a101ea729e",
        federationId: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
        addressId: "3f50baf2-d986-4bec-88c2-dfa901d78a0b",
        totalAmount: 450,
        problemDescription: "Routine home pipeline repair",
      }),
    });

    const bookingRes = await createBookingHandler(normalReq);
    const bookingBody = await bookingRes.json();

    assert(bookingRes.status === 200, `Normal booking creation returned 200 OK (got ${bookingRes.status})`);
    assert(Boolean(bookingBody.booking?.id), "Normal booking ID created");
    assert(bookingBody.booking?.status === "REQUEST_SENT", `Normal booking initial status is REQUEST_SENT (got ${bookingBody.booking?.status})`);
    assert(bookingBody.booking?.bookingNumber.startsWith("BK-"), `Normal booking number has BK- prefix: ${bookingBody.booking?.bookingNumber}`);
    console.log(`  ℹ️ Confirmed: Normal booking ${bookingBody.booking?.bookingNumber} operates independently.`);
  }

  console.log("\n==================================================");
  console.log(`TASK 3 VERIFICATION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTask3Verification().catch((err) => {
  console.error("\n💥 FATAL VERIFICATION ERROR:", err);
  process.exit(1);
});

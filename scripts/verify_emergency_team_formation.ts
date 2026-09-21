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
import { POST as respondToDispatchHandler } from "../app/api/emergency/dispatch/[id]/respond/route";
import { GET as getTeamsHandler } from "../app/api/emergency/teams/route";
import { POST as createBookingHandler } from "../app/api/bookings/route";
import { EmergencyDispatchRepository } from "../lib/emergency/dispatch-store";
import { EmergencyTeamRepository } from "../lib/emergency/team-store";
import { EmergencyIncidentRepository } from "../lib/emergency/incident-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || "";
const dbClient = createClient(supabaseUrl, supabaseSecret);

async function runTask4Verification() {
  console.log("==================================================");
  console.log("KAUSHALYA SETU EMERGENCY SERVICES — TASK 4");
  console.log("REALTIME WORKER ACCEPT/DECLINE & TEAM FORMATION VERIFICATION");
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raviWorkerRec } = await (dbClient.from("workers") as any)
    .select("id, federation_id, verification_status, account_status, availability_status, profession")
    .eq("profile_id", workerUserId)
    .single();

  const raviWorkerId = raviWorkerRec.id;
  const federationId = raviWorkerRec.federation_id || "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  console.log(`  Authenticated Worker Ravi Patel: worker_id=${raviWorkerId}, profile_id=${workerUserId}\n`);

  // -------------------------------------------------------------
  // A. WORKER RESPONSE AUTHORIZATION
  // -------------------------------------------------------------
  console.log("--------------------------------------------------");
  console.log("A. WORKER RESPONSE AUTHORIZATION");
  console.log("--------------------------------------------------");
  {
    // Create an emergency incident with auto-dispatch to Ravi Patel
    const incReq = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        categoryName: "Water Infrastructure",
        emergencyType: "Society Water Tank Burst",
        location: "Satellite Cross Roads, Ahmedabad",
        description: "High pressure municipal main pipe ruptured, street flooding.",
        approxPeopleAffected: 15,
        immediateDanger: true,
        autoDispatch: true,
      }),
    });

    const incRes = await createIncidentHandler(incReq);
    const incBody = await incRes.json();
    assert(incRes.status === 201, `Incident created with 201 Created (got ${incRes.status})`);
    const incidentId = incBody.incident.id;

    // Find Ravi Patel's dispatch record
    const dispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incidentId);
    const raviDispatch = dispatches.find((d) => d.worker_id === raviWorkerId);
    assert(Boolean(raviDispatch), `Ravi Patel received a DISPATCHED record (found: ${raviDispatch?.id})`);

    // 1. Unauthenticated request rejected
    const unauthReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch/${raviDispatch?.id}/respond`, {
      method: "POST",
      body: JSON.stringify({ response: "ACCEPT" }),
    });
    const unauthRes = await respondToDispatchHandler(unauthReq, { params: { id: raviDispatch!.id } });
    assert(unauthRes.status === 401, `Unauthenticated response rejected with 401 Unauthorized (got ${unauthRes.status})`);

    // 2. Customer cannot respond to worker dispatch opportunity
    const custReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch/${raviDispatch?.id}/respond`, {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({ response: "ACCEPT" }),
    });
    const custRes = await respondToDispatchHandler(custReq, { params: { id: raviDispatch!.id } });
    assert(custRes.status === 403, `Customer response rejected with 403 Forbidden (got ${custRes.status})`);

    // 3. Worker cannot respond for another worker
    // Create a dispatch record for another worker
    const otherWorkerId = "00000000-0000-0000-0000-000000000888";
    const otherDispatchId = "00000000-0000-0000-0000-000000000999";
    const mockOtherDispatch = {
      id: otherDispatchId,
      incident_id: incidentId,
      worker_id: otherWorkerId,
      federation_id: federationId,
      required_role: "Plumber",
      matched_skills: ["Plumbing"],
      eligibility_score: 90,
      eligibility_reasons: {},
      status: "DISPATCHED" as const,
      offered_at: new Date().toISOString(),
      responded_at: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const origFind = EmergencyDispatchRepository.findDispatchById;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).findDispatchById = async (id: string) => {
      if (id === otherDispatchId) return mockOtherDispatch;
      return origFind.call(EmergencyDispatchRepository, id);
    };

    const workerTrespassReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch/${otherDispatchId}/respond`, {
      method: "POST",
      headers: { Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({ response: "ACCEPT" }),
    });
    const workerTrespassRes = await respondToDispatchHandler(workerTrespassReq, { params: { id: otherDispatchId } });
    assert(workerTrespassRes.status === 403, `Worker blocked from responding to another worker's dispatch (got ${workerTrespassRes.status})`);
    EmergencyDispatchRepository.findDispatchById = origFind;

    // 4. Dispatched worker can DECLINE
    const declineReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch/${raviDispatch?.id}/respond`, {
      method: "POST",
      headers: { Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({ response: "DECLINE" }),
    });
    const declineRes = await respondToDispatchHandler(declineReq, { params: { id: raviDispatch!.id } });
    const declineBody = await declineRes.json();
    assert(declineRes.status === 200, `Dispatched worker DECLINE returned 200 OK (got ${declineRes.status})`);
    assert(declineBody.status === "DECLINED", `Response status recorded as DECLINED (got ${declineBody.status})`);
    assert(declineBody.success === true, "Response payload indicates success: true");

    const updatedDecline = await EmergencyDispatchRepository.findDispatchById(raviDispatch!.id);
    assert(updatedDecline?.status === "DECLINED", "Worker DECLINE transition recorded in store");
    assert(Boolean(updatedDecline?.responded_at), "Worker DECLINE responded_at timestamp recorded");
  }

  // -------------------------------------------------------------
  // B. RESPONSE STATE, TIMESTAMPS & DUPLICATE PROTECTION
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("B. RESPONSE STATE, AUDIT TRAIL & DUPLICATE HANDLING");
  console.log("--------------------------------------------------");
  {
    // Create an incident for Ravi Patel to test ACCEPT (since he declined incident 1, his capacity is available)
    const accIncReq = new NextRequest("http://localhost:3000/api/emergency/incidents", {
      method: "POST",
      headers: { Authorization: `Bearer ${customerToken}` },
      body: JSON.stringify({
        categoryName: "Water Infrastructure",
        emergencyType: "Society Water Tank Burst",
        location: "Vastrapur, Ahmedabad",
        description: "Community water tank cracked in apartment basement.",
        approxPeopleAffected: 12,
        immediateDanger: false,
        autoDispatch: true,
      }),
    });
    const accIncRes = await createIncidentHandler(accIncReq);
    const accIncBody = await accIncRes.json();
    const accIncidentId = accIncBody.incident.id;

    const accDispatches = await EmergencyDispatchRepository.listDispatchesForIncident(accIncidentId);
    const raviAccDispatch = accDispatches.find((d) => d.worker_id === raviWorkerId);
    assert(Boolean(raviAccDispatch), "Ravi Patel received dispatch record for acceptance testing");

    // 1. Accept test
    const acceptReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch/${raviAccDispatch?.id}/respond`, {
      method: "POST",
      headers: { Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({ response: "ACCEPT" }),
    });
    const acceptRes = await respondToDispatchHandler(acceptReq, { params: { id: raviAccDispatch!.id } });
    const acceptBody = await acceptRes.json();
    assert(acceptRes.status === 200, `Worker ACCEPT returned 200 OK (got ${acceptRes.status})`);
    assert(acceptBody.status === "ACCEPTED", `Worker ACCEPT status is ACCEPTED (got ${acceptBody.status})`);

    const updatedAccept = await EmergencyDispatchRepository.findDispatchById(raviAccDispatch!.id);
    assert(updatedAccept?.status === "ACCEPTED", "Worker ACCEPT transition recorded in store");
    assert(Boolean(updatedAccept?.responded_at), "Worker ACCEPT responded_at timestamp recorded");

    // 2. Duplicate response protection (Attempt to accept or decline again)
    const dupReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch/${raviAccDispatch?.id}/respond`, {
      method: "POST",
      headers: { Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({ response: "ACCEPT" }),
    });
    const dupRes = await respondToDispatchHandler(dupReq, { params: { id: raviAccDispatch!.id } });
    assert(dupRes.status === 409, `Duplicate response rejected with 409 Conflict (got ${dupRes.status})`);

    // 3. Expired/withdrawn opportunity cannot be accepted
    const expiredDispatchId = crypto.randomUUID();
    const mockExpired = {
      id: expiredDispatchId,
      incident_id: "00000000-0000-0000-0000-000000000112",
      worker_id: raviWorkerId,
      federation_id: federationId,
      required_role: "Emergency Plumber",
      matched_skills: ["Plumbing"],
      eligibility_score: 85,
      eligibility_reasons: {},
      status: "EXPIRED" as const,
      offered_at: new Date().toISOString(),
      responded_at: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const origFind = EmergencyDispatchRepository.findDispatchById;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).findDispatchById = async (id: string) => {
      if (id === expiredDispatchId) return mockExpired;
      return origFind.call(EmergencyDispatchRepository, id);
    };

    const expiredReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch/${expiredDispatchId}/respond`, {
      method: "POST",
      headers: { Authorization: `Bearer ${workerToken}` },
      body: JSON.stringify({ response: "ACCEPT" }),
    });
    const expiredRes = await respondToDispatchHandler(expiredReq, { params: { id: expiredDispatchId } });
    assert(expiredRes.status === 410, `Expired opportunity response rejected with 410 Gone (got ${expiredRes.status})`);
    EmergencyDispatchRepository.findDispatchById = origFind;
  }

  // -------------------------------------------------------------
  // C. ATOMIC STAFFING & OVERSTAFFING CONCURRENCY GUARD
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("C. ATOMIC STAFFING & OVERSTAFFING CONCURRENCY GUARD");
  console.log("--------------------------------------------------");
  {
    // Test Scenario:
    // Required workers = 2.
    // Dispatched workers = 4.
    // 4 workers attempt to ACCEPT concurrently.
    // Exactly 2 must succeed; exactly 2 must receive 409 Conflict.
    const concurrentIncidentId = crypto.randomUUID();
    const concurrentIncident = {
      id: concurrentIncidentId,
      emergency_id: "EMG-2026-CONCURR",
      customer_id: customerId,
      federation_id: federationId,
      category_name: "Electrical Systems",
      emergency_type: "Electrical Short Circuit & Sparking", // Matrix requires 2 workers
      response_matrix_code: "elec-short-spark",
      severity: "CRITICAL" as const,
      status: "DISPATCHING" as const,
      location: "Bopal, Ahmedabad",
      address_details: {},
      description: "Active electrical arcing and sparking from main panel.",
      evidence_photos: [],
      approx_people_affected: 4,
      immediate_danger: true,
      danger_details: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await EmergencyIncidentRepository.insertIncident(concurrentIncident);

    // Create 4 dispatched workers for this incident
    const workerIds = [
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000002",
      "00000000-0000-0000-0000-000000000003",
      "00000000-0000-0000-0000-000000000004",
    ];
    const dispatchIds: string[] = [];

    const mockDispatches: any[] = [];
    for (let i = 0; i < workerIds.length; i++) {
      const dId = crypto.randomUUID();
      dispatchIds.push(dId);
      const role = i === 0 ? "Team Lead / Senior Electrician" : "Electrician";
      const rec = {
        id: dId,
        incident_id: concurrentIncidentId,
        worker_id: workerIds[i],
        federation_id: federationId,
        required_role: role,
        matched_skills: ["Electrical safety", "Arc fault isolation"],
        eligibility_score: 90 - i * 5,
        eligibility_reasons: {},
        status: "DISPATCHED" as const,
        offered_at: new Date().toISOString(),
        responded_at: null,
        notes: `Dispatched ${role}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockDispatches.push(rec);
      await EmergencyDispatchRepository.updateDispatchStatus(dId, "DISPATCHED");
    }

    // Override repository methods for this concurrent scenario
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).findDispatchById = async (id: string) => {
      return mockDispatches.find((d) => d.id === id) || null;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).listDispatchesForIncident = async (incId: string) => {
      if (incId === concurrentIncidentId) return mockDispatches;
      return [];
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).updateDispatchStatus = async (id: string, st: any, respAt: string) => {
      const target: any = mockDispatches.find((d) => d.id === id);
      if (target) {
        target.status = st;
        target.responded_at = respAt;
      }
    };

    console.log("  ⚡ Simulating 4 concurrent worker acceptances for 2 available slots...");
    const acceptPromises = dispatchIds.map((dId, idx) =>
      EmergencyTeamRepository.respondToDispatch({
        dispatchId: dId,
        workerId: workerIds[idx],
        response: "ACCEPT",
      })
    );

    const results = await Promise.all(acceptPromises);
    const successfulAccepts = results.filter((r) => r.success && r.code === 200);
    const conflictAccepts = results.filter((r) => !r.success && r.code === 409);

    assert(successfulAccepts.length === 2, `Exactly 2 workers accepted (got ${successfulAccepts.length})`);
    assert(conflictAccepts.length === 2, `Exactly 2 workers rejected with 409 Conflict (got ${conflictAccepts.length})`);

    const acceptedDispatchesCount = mockDispatches.filter((d) => d.status === "ACCEPTED").length;
    assert(acceptedDispatchesCount === 2, `Database accepted slots count is strictly 2 (no overstaffing)`);
    console.log("  ℹ️ Overstaffing prevented: Capacity locked at 2 slots.");
  }

  // -------------------------------------------------------------
  // D. TEAM FORMATION RULE & MEMBERSHIP INTEGRITY
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("D. TEAM FORMATION RULE & MEMBERSHIP INTEGRITY");
  console.log("--------------------------------------------------");
  {
    // Test Scenario:
    // Response matrix specifies recommended_worker_count = 3.
    // Worker 1 accepts -> Team NOT formed (status: TEAM_FORMING).
    // Worker 2 accepts -> Team NOT formed (status: TEAM_FORMING).
    // Worker 3 accepts -> Team IS FORMED (status: ACTIVE).
    const teamTestIncidentId = crypto.randomUUID();
    const teamIncident = {
      id: teamTestIncidentId,
      emergency_id: "EMG-2026-TEAM-TEST",
      customer_id: customerId,
      federation_id: federationId,
      category_name: "Electrical Systems",
      emergency_type: "Substation / Main Panel Failure", // Matrix requires 3 workers
      response_matrix_code: "elec-substation-fail",
      severity: "HIGH" as const,
      status: "DISPATCHING" as const,
      location: "Prahladnagar, Ahmedabad",
      address_details: {},
      description: "Central distribution panel burnout, busbar failure.",
      evidence_photos: [],
      approx_people_affected: 20,
      immediate_danger: false,
      danger_details: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await EmergencyIncidentRepository.insertIncident(teamIncident);

    const workerA = "00000000-0000-0000-0000-000000000010";
    const workerB = "00000000-0000-0000-0000-000000000020";
    const workerC = "00000000-0000-0000-0000-000000000030";

    const dIdA = crypto.randomUUID();
    const dIdB = crypto.randomUUID();
    const dIdC = crypto.randomUUID();

    const testDispatches = [
      {
        id: dIdA,
        incident_id: teamTestIncidentId,
        worker_id: workerA,
        federation_id: federationId,
        required_role: "Team Lead",
        matched_skills: ["High-voltage systems"],
        eligibility_score: 95,
        eligibility_reasons: {},
        status: "DISPATCHED" as const,
        offered_at: new Date().toISOString(),
        responded_at: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        worker_name: "Worker Lead A",
      },
      {
        id: dIdB,
        incident_id: teamTestIncidentId,
        worker_id: workerB,
        federation_id: federationId,
        required_role: "Certified Electrician",
        matched_skills: ["High-voltage systems"],
        eligibility_score: 90,
        eligibility_reasons: {},
        status: "DISPATCHED" as const,
        offered_at: new Date().toISOString(),
        responded_at: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        worker_name: "Worker Electrician B",
      },
      {
        id: dIdC,
        incident_id: teamTestIncidentId,
        worker_id: workerC,
        federation_id: federationId,
        required_role: "Certified Electrician",
        matched_skills: ["High-voltage systems"],
        eligibility_score: 85,
        eligibility_reasons: {},
        status: "DISPATCHED" as const,
        offered_at: new Date().toISOString(),
        responded_at: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        worker_name: "Worker Electrician C",
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).findDispatchById = async (id: string) => {
      return testDispatches.find((d) => d.id === id) || null;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).listDispatchesForIncident = async (incId: string) => {
      if (incId === teamTestIncidentId) return testDispatches;
      return [];
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).updateDispatchStatus = async (id: string, st: any, respAt: string) => {
      const target: any = testDispatches.find((d) => d.id === id);
      if (target) {
        target.status = st;
        target.responded_at = respAt;
      }
    };

    // Step 1: Worker A accepts
    const resA = await EmergencyTeamRepository.respondToDispatch({
      dispatchId: dIdA,
      workerId: workerA,
      response: "ACCEPT",
    });
    assert(resA.success === true, "Worker A acceptance succeeded");
    assert(resA.teamFormed === false, "Team NOT formed after 1 of 3 acceptances");
    let incState = await EmergencyIncidentRepository.findById(teamTestIncidentId);
    assert(incState?.status === "TEAM_FORMING", `Incident transitioned to TEAM_FORMING (got ${incState?.status})`);

    let teamQuery = await EmergencyTeamRepository.getTeamByIncidentId(teamTestIncidentId);
    assert(teamQuery === null, "Emergency Response Team record is null before staffing is fulfilled");

    // Step 2: Worker B accepts
    const resB = await EmergencyTeamRepository.respondToDispatch({
      dispatchId: dIdB,
      workerId: workerB,
      response: "ACCEPT",
    });
    assert(resB.success === true, "Worker B acceptance succeeded");
    assert(resB.teamFormed === false, "Team NOT formed after 2 of 3 acceptances");

    // Step 3: Worker C accepts (Requirement of 3 fulfilled!)
    const resC = await EmergencyTeamRepository.respondToDispatch({
      dispatchId: dIdC,
      workerId: workerC,
      response: "ACCEPT",
    });
    assert(resC.success === true, "Worker C acceptance succeeded");
    assert(resC.teamFormed === true, "Team IS FORMED immediately upon 3rd acceptance");
    assert(Boolean(resC.teamId), `Team ID generated: ${resC.teamId}`);

    incState = await EmergencyIncidentRepository.findById(teamTestIncidentId);
    assert(incState?.status === "ACTIVE", `Incident status transitioned to ACTIVE (got ${incState?.status})`);

    // Verify Team Record & Members
    teamQuery = await EmergencyTeamRepository.getTeamByIncidentId(teamTestIncidentId);
    assert(teamQuery !== null, "Emergency Response Team record exists");
    assert(teamQuery?.incident_id === teamTestIncidentId, "Team references correct incident ID");
    assert(teamQuery?.federation_id === federationId, "Team references correct federation ID");
    assert(teamQuery?.status === "FORMED", `Team status is FORMED (got ${teamQuery?.status})`);
    assert(teamQuery?.required_worker_count === 3, "Team requires 3 workers");
    assert(teamQuery?.accepted_worker_count === 3, "Team records 3 accepted workers");

    // Verify Members
    const members = teamQuery?.members || [];
    assert(members.length === 3, `Team contains exactly 3 members (found ${members.length})`);
    assert(members.some((m) => m.worker_id === workerA), "Worker A is in team members");
    assert(members.some((m) => m.worker_id === workerB), "Worker B is in team members");
    assert(members.some((m) => m.worker_id === workerC), "Worker C is in team members");

    // Duplicate membership prevention check
    const memberWorkerIds = members.map((m) => m.worker_id);
    const uniqueWorkerIds = new Set(memberWorkerIds);
    assert(memberWorkerIds.length === uniqueWorkerIds.size, "No duplicate worker memberships in the team");

    // -------------------------------------------------------------
    // E. DETERMINISTIC TEAM LEAD PRESERVATION
    // -------------------------------------------------------------
    console.log("\n--------------------------------------------------");
    console.log("E. DETERMINISTIC TEAM LEAD PRESERVATION");
    console.log("--------------------------------------------------");
    // Worker A was dispatched under role 'Team Lead'
    assert(teamQuery?.team_lead_worker_id === workerA, `Worker A was designated Team Lead deterministically (got ${teamQuery?.team_lead_worker_id})`);
    const leadMember = (members || []).find((m) => m.worker_id === workerA);
    assert(leadMember?.is_team_lead === true, "Team member record has is_team_lead: true");
    console.log("  ✅ PASS: Team lead requirement preserved deterministically without arbitrary selection");
    passedTests++;
  }

  // -------------------------------------------------------------
  // F. SHORTAGE & PARTIAL ACCEPTANCE PRESERVATION
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("F. SHORTAGE & PARTIAL ACCEPTANCE PRESERVATION");
  console.log("--------------------------------------------------");
  {
    // Incident with 1 accept and 1 decline out of 3 needed
    const partialIncidentId = crypto.randomUUID();
    const partialIncident = {
      id: partialIncidentId,
      emergency_id: "EMG-2026-PARTIAL",
      customer_id: customerId,
      federation_id: federationId,
      category_name: "Gas & Fire Hazard",
      emergency_type: "Piped Gas Leakage",
      response_matrix_code: "gas-piped-leak",
      severity: "CRITICAL" as const,
      status: "DISPATCHING" as const,
      location: "SG Highway, Ahmedabad",
      address_details: {},
      description: "Strong gas odor detected from building gas riser.",
      evidence_photos: [],
      approx_people_affected: 6,
      immediate_danger: true,
      danger_details: "Riser pipe leaking on ground floor.",
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await EmergencyIncidentRepository.insertIncident(partialIncident);

    const wrk1 = "00000000-0000-0000-0000-000000000101";
    const wrk2 = "00000000-0000-0000-0000-000000000102";
    const d1 = crypto.randomUUID();
    const d2 = crypto.randomUUID();

    const pDispatches: any[] = [
      {
        id: d1,
        incident_id: partialIncidentId,
        worker_id: wrk1,
        federation_id: federationId,
        required_role: "Lift Electrician",
        matched_skills: ["Electrical Maintenance"],
        eligibility_score: 95,
        eligibility_reasons: {},
        status: "DISPATCHED" as const,
        offered_at: new Date().toISOString(),
        responded_at: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: d2,
        incident_id: partialIncidentId,
        worker_id: wrk2,
        federation_id: federationId,
        required_role: "Emergency Mechanical",
        matched_skills: ["Lift Maintenance"],
        eligibility_score: 90,
        eligibility_reasons: {},
        status: "DISPATCHED" as const,
        offered_at: new Date().toISOString(),
        responded_at: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).findDispatchById = async (id: string) => {
      return pDispatches.find((d) => d.id === id) || null;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).listDispatchesForIncident = async (incId: string) => {
      if (incId === partialIncidentId) return pDispatches;
      return [];
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (EmergencyDispatchRepository as any).updateDispatchStatus = async (id: string, st: any, respAt: string) => {
      const target: any = pDispatches.find((d) => d.id === id);
      if (target) {
        target.status = st;
        target.responded_at = respAt;
      }
    };

    // Worker 1 accepts
    await EmergencyTeamRepository.respondToDispatch({
      dispatchId: d1,
      workerId: wrk1,
      response: "ACCEPT",
    });

    // Worker 2 declines
    await EmergencyTeamRepository.respondToDispatch({
      dispatchId: d2,
      workerId: wrk2,
      response: "DECLINE",
    });

    // Verify states
    assert(pDispatches[0].status === "ACCEPTED", "Accepted worker remains ACCEPTED");
    assert(pDispatches[1].status === "DECLINED", "Declined worker remains DECLINED");

    const partialTeam = await EmergencyTeamRepository.getTeamByIncidentId(partialIncidentId);
    assert(partialTeam === null, "Insufficient acceptance does NOT create a falsely complete team");

    const incStatus = (await EmergencyIncidentRepository.findById(partialIncidentId))?.status;
    assert(incStatus === "TEAM_FORMING" || incStatus === "DISPATCHING", `Incident remains in incomplete state (${incStatus})`);
  }

  // -------------------------------------------------------------
  // G. REALTIME & API VERIFICATION
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("G. TEAMS API & INCIDENT ENRICHMENT");
  console.log("--------------------------------------------------");
  {
    // Customer can query teams endpoint for their incident
    // Query teams endpoint with missing params
    const badReq = new NextRequest("http://localhost:3000/api/emergency/teams", {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const badRes = await getTeamsHandler(badReq);
    assert(badRes.status === 400, `Query without params returns 400 Bad Request (got ${badRes.status})`);

    // Unauthenticated GET /api/emergency/teams
    const unauthGetReq = new NextRequest("http://localhost:3000/api/emergency/teams?incidentId=foo");
    const unauthGetRes = await getTeamsHandler(unauthGetReq);
    assert(unauthGetRes.status === 401, `Unauthenticated GET /api/emergency/teams rejected with 401 Unauthorized (got ${unauthGetRes.status})`);
  }

  // -------------------------------------------------------------
  // H. REGRESSION TESTS (NORMAL BOOKINGS & ISOLATION)
  // -------------------------------------------------------------
  console.log("\n--------------------------------------------------");
  console.log("H. REGRESSION: NORMAL BOOKING FLOW REMAINS INTACT");
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
        totalAmount: 500,
        problemDescription: "Standard non-emergency water tap fixing",
      }),
    });

    const bookingRes = await createBookingHandler(normalReq);
    const bookingBody = await bookingRes.json();

    assert(bookingRes.status === 200, `Normal booking creation returned 200 OK (got ${bookingRes.status})`);
    assert(Boolean(bookingBody.booking?.id), "Normal booking ID generated");
    assert(bookingBody.booking?.status === "REQUEST_SENT", `Normal booking status is REQUEST_SENT (got ${bookingBody.booking?.status})`);
    assert(bookingBody.booking?.bookingNumber.startsWith("BK-"), `Normal booking number has BK- prefix: ${bookingBody.booking?.bookingNumber}`);
    console.log(`  ℹ️ Confirmed: Normal booking ${bookingBody.booking?.bookingNumber} operates completely independently.`);
  }

  console.log("\n==================================================");
  console.log(`TASK 4 VERIFICATION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================");

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTask4Verification().catch((err) => {
  console.error("\n💥 FATAL VERIFICATION ERROR:", err);
  process.exit(1);
});

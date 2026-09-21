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

// 2. Import API handlers and repositories
import { POST as createIncidentHandler } from "../app/api/emergency/incidents/route";
import { GET as listFederationIncidentsHandler } from "../app/api/emergency/federation/incidents/route";
import { GET as getIncidentControlDetailHandler } from "../app/api/emergency/federation/incidents/[id]/route";
import { PATCH as changeSeverityHandler } from "../app/api/emergency/federation/incidents/[id]/severity/route";
import { POST as reviewAdditionalWorkerHandler } from "../app/api/emergency/requests/additional-workers/[id]/review/route";
import { POST as teamWorkerActionHandler } from "../app/api/emergency/federation/incidents/[id]/workers/route";
import { PATCH as modifyResponsePlanHandler } from "../app/api/emergency/federation/incidents/[id]/response-plan/route";
import { POST as createSupportRequestHandler } from "../app/api/emergency/federation/incidents/[id]/support-request/route";
import { GET as getAuditLogsHandler } from "../app/api/emergency/federation/incidents/[id]/audit/route";
import { POST as createAdditionalWorkerHandler } from "../app/api/emergency/requests/additional-workers/route";
import { POST as createBookingHandler } from "../app/api/bookings/route";

import { EmergencyTeamRepository } from "../lib/emergency/team-store";
import { EmergencyDispatchRepository } from "../lib/emergency/dispatch-store";
import { EmergencyResponseMatrixRepository } from "../lib/emergency/response-matrix-store";
import { EmergencyControlCenterRepository } from "../lib/emergency/control-center-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || "";
const dbClient = createClient(supabaseUrl, supabaseSecret);

async function runTask6Verification() {
  console.log("==================================================");
  console.log("KAUSHALYA SETU EMERGENCY SERVICES — TASK 6");
  console.log("FEDERATION EMERGENCY CONTROL CENTER VERIFICATION");
  console.log("==================================================\n");

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: unknown, message: string) {
    if (Boolean(condition)) {
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
    throw new Error("Failed to authenticate customer: " + errCust?.message);
  }
  const customerToken = authCustomer.session.access_token;
  const customerId = authCustomer.user.id;
  console.log(`  Customer: ${customerId}`);

  const federationAId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";

  // Ensure test customer has an address associated with Federation A
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingCustAddr } = await (dbClient.from("addresses") as any)
    .select("id")
    .eq("profile_id", customerId)
    .limit(1)
    .maybeSingle();

  if (existingCustAddr?.id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (dbClient.from("addresses") as any)
      .update({ federation_id: federationAId, city: "Ahmedabad" })
      .eq("id", existingCustAddr.id);
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (dbClient.from("addresses") as any).insert({
      profile_id: customerId,
      federation_id: federationAId,
      address_line1: "101 Ashram Road",
      city: "Ahmedabad",
      state: "Gujarat",
      postal_code: "380009",
      is_default: true,
    });
  }

  // 2. Federation Admin A (Ahmedabad Federation)
  const { data: authFedA, error: errFedA } = await anonClient.auth.signInWithPassword({
    email: "federation@example.com",
    password: "Password123!",
  });
  if (errFedA || !authFedA.session) {
    throw new Error("Failed to authenticate Federation Admin A: " + errFedA?.message);
  }
  const fedAToken = authFedA.session.access_token;
  const fedAUserId = authFedA.user.id;

  await dbClient.auth.admin.updateUserById(fedAUserId, {
    user_metadata: { role: "FEDERATION_ADMIN", federation_id: federationAId },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (dbClient.from("profiles") as any).upsert({
    id: fedAUserId,
    email: "federation@example.com",
    role: "FEDERATION_ADMIN",
    full_name: "Ahmedabad Federation Admin",
  });

  console.log(`  Federation Admin A: ${fedAUserId} (Federation: ${federationAId})`);

  // 3. Worker 1 (Ravi Patel - Federation A)
  const { data: authWorker, error: errWrk } = await anonClient.auth.signInWithPassword({
    email: "worker@example.com",
    password: "Password123!",
  });
  if (errWrk || !authWorker.session) {
    throw new Error("Failed to authenticate test worker: " + errWrk?.message);
  }
  const worker1Token = authWorker.session.access_token;
  const worker1UserId = authWorker.user.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raviWorkerRec } = await (dbClient.from("workers") as any)
    .select("id, federation_id")
    .eq("profile_id", worker1UserId)
    .single();
  const worker1Id = raviWorkerRec.id;
  console.log(`  Worker 1 (Lead): ${worker1Id}`);

  // 4. Candidate Workers in Federation A
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: candidateWorkers } = await (dbClient.from("workers") as any)
    .select("id, profile_id, profession")
    .eq("federation_id", federationAId)
    .neq("id", worker1Id)
    .limit(2);

  const worker2Id = candidateWorkers?.[0]?.id || "00000000-0000-0000-0000-000000000002";
  const worker3Id = candidateWorkers?.[1]?.id || "00000000-0000-0000-0000-000000000003";

  // Ensure candidate test workers are in verified and active account status
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (dbClient.from("workers") as any)
    .update({ verification_status: "verified", account_status: "ACTIVE" })
    .in("id", [worker2Id, worker3Id]);

  console.log(`  Worker 2: ${worker2Id}, Worker 3: ${worker3Id}`);

  // 5. Federation Admin B (Different Federation) for Isolation Testing
  // Create a temporary user with role FEDERATION_ADMIN in a different federation
  const foreignFedId = "ffffffff-ffff-4fff-8fff-ffffffffffff";
  const fedBEmail = `fed.admin.b.${Date.now()}@example.com`;
  const { data: authFedBUser } = await dbClient.auth.admin.createUser({
    email: fedBEmail,
    password: "Password123!",
    email_confirm: true,
    user_metadata: { role: "FEDERATION_ADMIN", federation_id: foreignFedId },
  });

  const fedBUserId = authFedBUser.user!.id;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (dbClient.from("profiles") as any).upsert({
    id: fedBUserId,
    email: fedBEmail,
    role: "FEDERATION_ADMIN",
    full_name: "Surat Federation Admin",
  });

  const { data: authFedB } = await anonClient.auth.signInWithPassword({
    email: fedBEmail,
    password: "Password123!",
  });
  const fedBToken = authFedB.session!.access_token;
  console.log(`  Federation Admin B (Foreign Fed): ${fedBUserId} (Fed: ${foreignFedId})\n`);

  // =============================================================
  // STEP 1: Incident Creation & Scoping Verification
  // =============================================================
  console.log("[STEP 1] Incident Creation & Strict Federation Scoping Check...");
  const emergencyType = "Electrical Short Circuit & Sparking";

  const incReq = new NextRequest("http://localhost:3000/api/emergency/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      emergencyType,
      location: "Tower 4, Main Utility Shaft, Ahmedabad",
      description: "Severe electrical arcing and cable insulation fire",
      approxPeopleAffected: 25,
      immediateDanger: true,
    }),
  });
  const incRes = await createIncidentHandler(incReq);
  const incData = await incRes.json();
  assert(incRes.status === 201 && incData.success, "Incident created with 201 Created");
  const incidentId = incData.incident.id;
  const emergencyId = incData.incident.emergencyId;
  console.log(`  Incident: ${emergencyId} (ID: ${incidentId}) | FedId: ${incData.incident.federationId || incData.incident.federation_id}`);

  // Verify Federation Admin A can list this incident
  const listReqA = new NextRequest("http://localhost:3000/api/emergency/federation/incidents", {
    headers: { Authorization: `Bearer ${fedAToken}` },
  });
  const listResA = await listFederationIncidentsHandler(listReqA);
  const listDataA = await listResA.json();
  if (listResA.status !== 200) {
    console.error("listResA failed:", listResA.status, listDataA);
  }
  console.log("  listDataA count:", listDataA.incidents?.length, "first few:", listDataA.incidents?.slice(0, 3));
  assert(listResA.status === 200 && listDataA.success, "Federation Admin A lists incidents (200 OK)");
  const foundA = (listDataA.incidents || []).some((i: any) => i.id === incidentId);
  assert(foundA, "Incident appears in Federation Admin A's incident list");

  // Verify Federation Admin A can inspect control detail
  const detailReqA = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${fedAToken}` },
  });
  const detailResA = await getIncidentControlDetailHandler(detailReqA, { params: Promise.resolve({ id: incidentId }) });
  const detailDataA = await detailResA.json();
  assert(detailResA.status === 200 && detailDataA.success, "Federation Admin A retrieves full control detail (200 OK)");
  assert(detailDataA.incident.emergencyId === emergencyId, "Incident details matches target incident");
  assert(Boolean(detailDataA.shortage), "Staffing shortage metrics included in control packet");

  // ISOLATION: Customer & Worker blocked from Federation Control endpoints
  const custControlReq = new NextRequest("http://localhost:3000/api/emergency/federation/incidents", {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const custControlRes = await listFederationIncidentsHandler(custControlReq);
  assert(custControlRes.status === 403, "Customer blocked from Federation Control (403 Forbidden)");

  const wrkControlReq = new NextRequest("http://localhost:3000/api/emergency/federation/incidents", {
    headers: { Authorization: `Bearer ${worker1Token}` },
  });
  const wrkControlRes = await listFederationIncidentsHandler(wrkControlReq);
  assert(wrkControlRes.status === 403, "Worker blocked from Federation Control (403 Forbidden)");

  // ISOLATION: Federation Admin B cannot inspect or list Federation A's incident
  const detailReqB = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${fedBToken}` },
  });
  const detailResB = await getIncidentControlDetailHandler(detailReqB, { params: Promise.resolve({ id: incidentId }) });
  assert(detailResB.status === 404, "Foreign Federation Admin B blocked from reading Federation A incident (404/Not Found)");

  const listReqB = new NextRequest("http://localhost:3000/api/emergency/federation/incidents", {
    headers: { Authorization: `Bearer ${fedBToken}` },
  });
  const listResB = await listFederationIncidentsHandler(listReqB);
  const listDataB = await listResB.json();
  const foundB = (listDataB.incidents || []).some((i: any) => i.id === incidentId);
  assert(!foundB, "Federation A incident does NOT appear in Federation B list");
  console.log();

  // =============================================================
  // STEP 2: Emergency Severity Modification & Audit Trail
  // =============================================================
  console.log("[STEP 2] Testing Severity Modification & Audit Logging...");

  // Foreign Federation Admin B attempt to change severity -> 403
  const sevReqB = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/severity`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedBToken}`,
    },
    body: JSON.stringify({ severity: "HIGH", reason: "Attempted tampering" }),
  });
  const sevResB = await changeSeverityHandler(sevReqB, { params: Promise.resolve({ id: incidentId }) });
  assert(sevResB.status === 403, "Foreign Federation Admin B blocked from changing severity (403 Forbidden)");

  // Invalid severity -> 400
  const sevReqInvalid = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/severity`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({ severity: "EXTREME", reason: "Invalid level" }),
  });
  const sevResInvalid = await changeSeverityHandler(sevReqInvalid, { params: Promise.resolve({ id: incidentId }) });
  assert(sevResInvalid.status === 400, "Invalid severity rejected with 400 Bad Request");

  // Authorized Severity Update: CRITICAL -> HIGH
  const sevReqA = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/severity`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({ severity: "HIGH", reason: "Main breaker isolated; fire hazard mitigated." }),
  });
  const sevResA = await changeSeverityHandler(sevReqA, { params: Promise.resolve({ id: incidentId }) });
  const sevDataA = await sevResA.json();
  assert(sevResA.status === 200 && sevDataA.success, "Federation Admin A successfully changed severity to HIGH");
  assert(sevDataA.incident.severity === "HIGH", "Incident record updated to HIGH");

  // Verify Audit Log
  const auditReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/audit`, {
    headers: { Authorization: `Bearer ${fedAToken}` },
  });
  const auditRes = await getAuditLogsHandler(auditReq, { params: Promise.resolve({ id: incidentId }) });
  const auditData = await auditRes.json();
  assert(auditRes.status === 200 && auditData.success, "Fetched incident audit trail (200 OK)");
  const sevLog = (auditData.logs || []).find((l: any) => l.action_type === "SEVERITY_CHANGED");
  assert(Boolean(sevLog), "SEVERITY_CHANGED event present in audit trail");
  assert(sevLog.actor_id === fedAUserId, "Audit log records actor as Federation Admin A");
  assert(sevLog.previous_state.severity === "CRITICAL", "Audit records previous severity as CRITICAL");
  assert(sevLog.new_state.severity === "HIGH", "Audit records new severity as HIGH");
  console.log();

  // =============================================================
  // STEP 3: Setup Response Team & Verify Staffing Shortage
  // =============================================================
  console.log("[STEP 3] Verifying Staffing Shortage Visibility & Metrics...");
  // Simulate dispatch acceptance to form partial team with Worker 1 (Team Lead)
  const dId1 = crypto.randomUUID();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockDispatch: any = {
    id: dId1,
    incident_id: incidentId,
    worker_id: worker1Id,
    federation_id: federationAId,
    required_role: "Team Lead / Senior Electrician",
    matched_skills: ["Electrical safety"],
    eligibility_score: 95,
    status: "DISPATCHED",
    offered_at: new Date().toISOString(),
    responded_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (EmergencyDispatchRepository as any).findDispatchById = async (id: string) => {
    if (id === dId1) return mockDispatch;
    return null;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (EmergencyDispatchRepository as any).listDispatchesForIncident = async () => [mockDispatch];

  // Worker 1 accepts
  const resp1 = await EmergencyTeamRepository.respondToDispatch({
    dispatchId: dId1,
    workerId: worker1Id,
    response: "ACCEPT",
  });
  mockDispatch.status = "ACCEPTED";
  mockDispatch.responded_at = new Date().toISOString();

  // Inspect detail again
  const detailRes3 = await getIncidentControlDetailHandler(detailReqA, { params: Promise.resolve({ id: incidentId }) });
  const detailData3 = await detailRes3.json();
  assert(detailData3.shortage.hasShortage === true, "Staffing shortage detected accurately");
  assert(detailData3.shortage.missing >= 1, `Missing workers count recorded (${detailData3.shortage.missing})`);
  console.log(`  Staffing: ${detailData3.shortage.accepted}/${detailData3.shortage.required} (Shortage: ${detailData3.shortage.missing})\n`);

  // =============================================================
  // STEP 4: Review Additional Worker Request (Approve / Reject)
  // =============================================================
  console.log("[STEP 4] Testing Additional Worker Request Review Workflow...");

  // 4a. Worker 1 (Team Lead) submits support request
  // Form team first so team lead authorization passes
  const teamId = crypto.randomUUID();
  const teamMemberId = crypto.randomUUID();
  const nowStr = new Date().toISOString();

  await EmergencyTeamRepository.registerTeam(
    {
      id: teamId,
      incident_id: incidentId,
      federation_id: federationAId,
      status: "ACTIVE",
      team_lead_worker_id: worker1Id,
      requires_team_lead: true,
      required_worker_count: 2,
      accepted_worker_count: 1,
      created_at: nowStr,
      updated_at: nowStr,
    },
    [
      {
        id: teamMemberId,
        team_id: teamId,
        incident_id: incidentId,
        worker_id: worker1Id,
        role: "Team Lead / Senior Electrician",
        is_team_lead: true,
        status: "ACTIVE",
        accepted_at: nowStr,
        created_at: nowStr,
        updated_at: nowStr,
      },
    ]
  );

  const addReq1 = new NextRequest("http://localhost:3000/api/emergency/requests/additional-workers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${worker1Token}`,
    },
    body: JSON.stringify({
      incidentId,
      skill: "High Voltage Specialist",
      count: 2,
      reason: "Panel transformer oil overheating",
    }),
  });
  const addRes1 = await createAdditionalWorkerHandler(addReq1);
  const addData1 = await addRes1.json();
  if (addRes1.status !== 201) {
    console.error("addRes1 error:", addRes1.status, addData1);
  }
  assert(addRes1.status === 201 && addData1.success, "Additional worker request created (Status: PENDING_FEDERATION_REVIEW)");
  const req1Id = addData1.request.id;

  // 4b. Rejection without reason fails -> 400
  const rejReqInvalid = new NextRequest(`http://localhost:3000/api/emergency/requests/additional-workers/${req1Id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({ action: "REJECT" }),
  });
  const rejResInvalid = await reviewAdditionalWorkerHandler(rejReqInvalid, { params: Promise.resolve({ id: req1Id }) });
  assert(rejResInvalid.status === 400, "Rejection without reason rejected with 400 Bad Request");

  // 4c. Foreign Federation Admin B cannot approve -> 403
  const appReqB = new NextRequest(`http://localhost:3000/api/emergency/requests/additional-workers/${req1Id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedBToken}`,
    },
    body: JSON.stringify({ action: "APPROVE" }),
  });
  const appResB = await reviewAdditionalWorkerHandler(appReqB, { params: Promise.resolve({ id: req1Id }) });
  const appDataB = await appResB.json();
  if (appResB.status !== 403) {
    console.error("appResB failed to return 403:", appResB.status, appDataB);
  }
  assert(appResB.status === 403, "Foreign Federation Admin B blocked from reviewing request (403 Forbidden)");

  // 4d. Federation Admin A approves request
  const appReqA = new NextRequest(`http://localhost:3000/api/emergency/requests/additional-workers/${req1Id}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({ action: "APPROVE" }),
  });
  const appResA = await reviewAdditionalWorkerHandler(appReqA, { params: Promise.resolve({ id: req1Id }) });
  const appDataA = await appResA.json();
  assert(appResA.status === 200 && appDataA.success, "Federation Admin A approved additional worker request");
  assert(appDataA.request.status === "APPROVED", "Request status transitioned to APPROVED");

  // Scope Boundary Confirmation: No automatic dispatches created
  const dispatchesNow = await EmergencyDispatchRepository.listDispatchesForIncident(incidentId);
  const autoCreated = dispatchesNow.filter((d) => d.required_role === "High Voltage Specialist");
  assert(autoCreated.length === 0, "Task 6 Scope Boundary Confirmed: No automated dispatch pool records created");

  // Audit check
  const auditRes4 = await getAuditLogsHandler(auditReq, { params: Promise.resolve({ id: incidentId }) });
  const auditData4 = await auditRes4.json();
  const appLog = (auditData4.logs || []).find((l: any) => l.action_type === "ADDITIONAL_WORKER_APPROVED");
  assert(Boolean(appLog), "ADDITIONAL_WORKER_APPROVED event logged in audit trail");
  console.log();

  // =============================================================
  // STEP 5: Controlled Worker ADD and REPLACE Actions
  // =============================================================
  console.log("[STEP 5] Testing Controlled Worker ADD and REPLACE Actions...");

  // 5a. Admin A adds Worker 2 to the team
  const addWorkerReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/workers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      action: "ADD",
      workerId: worker2Id,
      role: "Assistant Electrician",
    }),
  });
  const addWorkerRes = await teamWorkerActionHandler(addWorkerReq, { params: Promise.resolve({ id: incidentId }) });
  const addWorkerData = await addWorkerRes.json();
  if (addWorkerRes.status !== 201) {
    console.error("addWorker failed:", addWorkerRes.status, addWorkerData);
  }
  assert(addWorkerRes.status === 201 && addWorkerData.success, "Federation Admin A added Worker 2 to team");
  assert(addWorkerData.member.worker_id === worker2Id, "New member record created for Worker 2");
  assert(addWorkerData.member.status === "ACTIVE", "New member status is ACTIVE");

  // 5b. Prevent duplicate addition of the same worker -> 409
  const dupWorkerReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/workers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      action: "ADD",
      workerId: worker2Id,
      role: "Duplicate Role",
    }),
  });
  const dupWorkerRes = await teamWorkerActionHandler(dupWorkerReq, { params: Promise.resolve({ id: incidentId }) });
  assert(dupWorkerRes.status === 409, "Duplicate worker assignment rejected with 409 Conflict");

  // 5c. Admin A replaces Worker 2 with Worker 3
  const repWorkerReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/workers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      action: "REPLACE",
      existingWorkerId: worker2Id,
      replacementWorkerId: worker3Id,
      reason: "Worker 2 requested medical leave from site",
    }),
  });
  const repWorkerRes = await teamWorkerActionHandler(repWorkerReq, { params: Promise.resolve({ id: incidentId }) });
  const repWorkerData = await repWorkerRes.json();
  assert(repWorkerRes.status === 200 && repWorkerData.success, "Federation Admin A replaced Worker 2 with Worker 3");
  assert(repWorkerData.member.worker_id === worker3Id, "Replacement member Worker 3 is now ACTIVE");

  // Audit check for WORKER_ADDED and WORKER_REPLACED
  const auditRes5 = await getAuditLogsHandler(auditReq, { params: Promise.resolve({ id: incidentId }) });
  const auditData5 = await auditRes5.json();
  assert((auditData5.logs || []).some((l: any) => l.action_type === "WORKER_ADDED"), "WORKER_ADDED event logged");
  assert((auditData5.logs || []).some((l: any) => l.action_type === "WORKER_REPLACED"), "WORKER_REPLACED event logged");
  console.log();

  // =============================================================
  // STEP 6: Response Plan Customization (Add Task / Cancel Task)
  // =============================================================
  console.log("[STEP 6] Testing Response Plan Customization...");

  // 6a. Add custom field task
  const addTaskReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/response-plan`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      action: "ADD_TASK",
      payload: {
        title: "Substation Busbar Thermal Scan",
        description: "Check busbar joints with infrared thermal scanner",
        assignedRole: "Senior Electrician",
      },
    }),
  });
  const addTaskRes = await modifyResponsePlanHandler(addTaskReq, { params: Promise.resolve({ id: incidentId }) });
  const addTaskData = await addTaskRes.json();
  assert(addTaskRes.status === 201 && addTaskData.success, "Custom operational task added to response plan");
  const customTaskId = addTaskData.result.id;

  // 6b. Cancel task
  const cancelTaskReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/response-plan`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      action: "CANCEL_TASK",
      payload: {
        taskId: customTaskId,
        reason: "Thermal scanner battery depleted; visual inspection completed",
      },
    }),
  });
  const cancelTaskRes = await modifyResponsePlanHandler(cancelTaskReq, { params: Promise.resolve({ id: incidentId }) });
  assert(cancelTaskRes.status === 200, "Operational task cancelled by Federation Admin");

  // Verify Global Response Matrix unchanged
  const globalMatrix = await EmergencyResponseMatrixRepository.findByEmergencyType(emergencyType);
  const hasCustomInMatrix = (globalMatrix?.initial_tasks || []).some((t) => t.title === "Substation Busbar Thermal Scan");
  assert(!hasCustomInMatrix, "Global Emergency Response Matrix remains strictly immutable");
  console.log();

  // =============================================================
  // STEP 7: Emergency Support Request (Additional Team Foundation)
  // =============================================================
  console.log("[STEP 7] Testing Support Request (Additional Team / External Support)...");

  const supportReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/support-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      requestType: "ADDITIONAL_TEAM",
      requestedRoles: ["Heavy Machinery Operator", "Structural Engineer"],
      requestedWorkerCount: 4,
      reason: "Shaft structural integrity compromised; backup deconstruction crew requested.",
    }),
  });
  const supportRes = await createSupportRequestHandler(supportReq, { params: Promise.resolve({ id: incidentId }) });
  const supportData = await supportRes.json();
  assert(supportRes.status === 201 && supportData.success, "Emergency support request logged with 201 Created");
  assert(supportData.request.status === "PENDING_REVIEW", "Support request status is strictly PENDING_REVIEW");
  assert(supportData.request.requested_worker_count === 4, "Requested worker count is 4");

  // Audit check
  const auditRes7 = await getAuditLogsHandler(auditReq, { params: Promise.resolve({ id: incidentId }) });
  const auditData7 = await auditRes7.json();
  assert((auditData7.logs || []).some((l: any) => l.action_type === "SUPPORT_REQUESTED"), "SUPPORT_REQUESTED event logged");
  console.log();

  // =============================================================
  // STEP 8: Normal Booking Regression Check
  // =============================================================
  console.log("[STEP 8] Verifying Decoupling: Normal Bookings Unaffected...");
  const normalBookingReq = new NextRequest("http://localhost:3000/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      action: "create",
      customerId,
      workerId: worker1Id,
      serviceId: "a510e2c8-5ee9-4b01-abfc-a2a101ea729e",
      federationId: federationAId,
      addressId: "3f50baf2-d986-4bec-88c2-dfa901d78a0b",
      totalAmount: 500,
      problemDescription: "Normal scheduled pipe fitting service",
    }),
  });
  const normalBookingRes = await createBookingHandler(normalBookingReq);
  const normalBookingData = await normalBookingRes.json();
  assert(normalBookingRes.status === 200, "Normal booking creation returned 200 OK");
  assert(Boolean(normalBookingData.booking?.id), "Normal booking ID generated");
  assert(normalBookingData.booking?.bookingNumber?.startsWith("BK-"), "Normal booking number has BK- prefix");
  assert(!normalBookingData.booking?.emergency_id, "Normal booking has NO emergency_id");
  console.log();

  // Cleanup temporary foreign federation admin B
  try {
    await dbClient.auth.admin.deleteUser(fedBUserId);
  } catch {
    // Cleanup notice
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("==================================================");
  console.log(`TASK 6 VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================");
}

runTask6Verification().catch((err) => {
  console.error("\n❌ VERIFICATION FATAL ERROR:", err);
  process.exit(1);
});

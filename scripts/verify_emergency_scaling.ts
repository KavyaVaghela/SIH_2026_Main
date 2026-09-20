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

// 2. Import API route handlers and repositories
import { POST as createIncidentHandler } from "../app/api/emergency/incidents/route";
import { GET as getIncidentTeamsHandler, POST as createIncidentTeamHandler } from "../app/api/emergency/federation/incidents/[id]/teams/route";
import { GET as getEscalationHandler, POST as postEscalationHandler } from "../app/api/emergency/federation/incidents/[id]/escalation/route";
import { POST as reviewSupportRequestHandler } from "../app/api/emergency/federation/incidents/[id]/support-request/[requestId]/review/route";
import { POST as reportNoShowHandler } from "../app/api/emergency/federation/incidents/[id]/workers/no-show/route";
import { POST as dispatchAdditionalWorkersHandler } from "../app/api/emergency/requests/additional-workers/[id]/dispatch/route";
import { POST as createAdditionalWorkerHandler } from "../app/api/emergency/requests/additional-workers/route";
import { POST as reviewAdditionalWorkerHandler } from "../app/api/emergency/requests/additional-workers/[id]/review/route";
import { POST as createSupportRequestHandler } from "../app/api/emergency/federation/incidents/[id]/support-request/route";
import { GET as getAuditLogsHandler } from "../app/api/emergency/federation/incidents/[id]/audit/route";
import { POST as createBookingHandler } from "../app/api/bookings/route";

import { EmergencyTeamRepository } from "../lib/emergency/team-store";
import { EmergencyDispatchRepository } from "../lib/emergency/dispatch-store";
import { EmergencyScalingRepository, DEFAULT_TIME_RULES } from "../lib/emergency/scaling-store";
import { EmergencyResponseMatrixRepository } from "../lib/emergency/response-matrix-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || "";
const dbClient = createClient(supabaseUrl, supabaseSecret);

async function runTask7Verification() {
  console.log("==================================================");
  console.log("KAUSHALYA SETU EMERGENCY SERVICES — TASK 7");
  console.log("EMERGENCY SCALING, RESILIENCE & FAILURE RECOVERY");
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
  const federationAId = "b765df3b-c418-4a15-b79f-3cbc09e475dc"; // Ahmedabad

  // 2. Federation Admin A (Ahmedabad)
  const { data: authFedA, error: errFedA } = await anonClient.auth.signInWithPassword({
    email: "federation@example.com",
    password: "Password123!",
  });
  if (errFedA || !authFedA.session) {
    throw new Error("Failed to authenticate Federation Admin A: " + errFedA?.message);
  }
  const fedAToken = authFedA.session.access_token;
  const fedAUserId = authFedA.user.id;

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
  const { data: worker1Rec } = await (dbClient.from("workers") as any)
    .select("id, federation_id")
    .eq("profile_id", worker1UserId)
    .single();
  const worker1Id = worker1Rec.id;

  // 4. Candidate Workers in Federation A
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: candidateWorkers } = await (dbClient.from("workers") as any)
    .select("id, profile_id, profession")
    .eq("federation_id", federationAId)
    .neq("id", worker1Id)
    .limit(3);

  const worker2Id = candidateWorkers?.[0]?.id || "00000000-0000-0000-0000-000000000002";
  const worker3Id = candidateWorkers?.[1]?.id || "00000000-0000-0000-0000-000000000003";

  // 5. Federation Admin B (Target Support Federation - Surat)
  const federationBId = "11111111-2222-3333-4444-555555555555";
  const fedBEmail = `fed.support.b.${Date.now()}@example.com`;
  const { data: authFedBUser } = await dbClient.auth.admin.createUser({
    email: fedBEmail,
    password: "Password123!",
    email_confirm: true,
    user_metadata: { role: "FEDERATION_ADMIN", federation_id: federationBId },
  });
  const fedBUserId = authFedBUser.user!.id;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (dbClient.from("profiles") as any).upsert({
    id: fedBUserId,
    email: fedBEmail,
    role: "FEDERATION_ADMIN",
    full_name: "Surat Support Federation Admin",
  });

  const { data: authFedB } = await anonClient.auth.signInWithPassword({
    email: fedBEmail,
    password: "Password123!",
  });
  const fedBToken = authFedB.session!.access_token;

  // 6. Federation Admin C (Foreign Uninvolved Federation)
  const federationCId = "99999999-8888-7777-6666-555555555555";
  const fedCEmail = `fed.uninvolved.c.${Date.now()}@example.com`;
  const { data: authFedCUser } = await dbClient.auth.admin.createUser({
    email: fedCEmail,
    password: "Password123!",
    email_confirm: true,
    user_metadata: { role: "FEDERATION_ADMIN", federation_id: federationCId },
  });
  const fedCUserId = authFedCUser.user!.id;
  const { data: authFedC } = await anonClient.auth.signInWithPassword({
    email: fedCEmail,
    password: "Password123!",
  });
  const fedCToken = authFedC.session!.access_token;

  console.log(`  Federation A: ${federationAId}`);
  console.log(`  Federation B (Support): ${federationBId}`);
  console.log(`  Federation C (Foreign): ${federationCId}\n`);

  // =============================================================
  // STEP 1: Multi-Team Emergency Scaling
  // =============================================================
  console.log("[STEP 1] Testing Multi-Team Incident Scaling...");
  const incReq = new NextRequest("http://localhost:3000/api/emergency/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      emergencyType: "Society Water Tank Burst",
      location: `Riverfront Complex, Block C-${Date.now()}, Ahmedabad`,
      description: "Rooftop 20,000L water tank ruptured, structural flooding across 8 floors",
      approxPeopleAffected: 120,
      immediateDanger: true,
    }),
  });
  const incRes = await createIncidentHandler(incReq);
  const incData = await incRes.json();
  assert(incRes.status === 201 && incData.success, "Emergency Incident created (201 Created)");
  const incidentId = incData.incident.id;

  // 1a. Form Primary Team
  const primaryTeamId = crypto.randomUUID();
  await EmergencyTeamRepository.registerTeam(
    {
      id: primaryTeamId,
      incident_id: incidentId,
      federation_id: federationAId,
      status: "ACTIVE",
      team_type: "PRIMARY",
      team_lead_worker_id: worker1Id,
      requires_team_lead: true,
      required_worker_count: 3,
      accepted_worker_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    [
      {
        id: crypto.randomUUID(),
        team_id: primaryTeamId,
        incident_id: incidentId,
        worker_id: worker1Id,
        role: "Team Lead / Plumber",
        is_team_lead: true,
        status: "ACTIVE",
        accepted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]
  );

  // 1b. Create Additional Response Team (Secondary Specialized Unit) via API
  const addTeamReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      teamType: "SPECIALIZED_UNIT",
      parentTeamId: primaryTeamId,
      requiredWorkerCount: 2,
      reason: "Secondary drainage and dewatering extraction team required in basement utility area",
    }),
  });
  const addTeamRes = await createIncidentTeamHandler(addTeamReq, { params: Promise.resolve({ id: incidentId }) });
  const addTeamData = await addTeamRes.json();
  assert(addTeamRes.status === 201 && addTeamData.success, "Additional specialized response team created (201 Created)");
  const secondaryTeamId = addTeamData.team.id;
  assert(addTeamData.team.team_type === "SPECIALIZED_UNIT", "Team type recorded as SPECIALIZED_UNIT");

  // 1c. List all incident teams
  const listTeamsReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/teams`, {
    headers: { Authorization: `Bearer ${fedAToken}` },
  });
  const listTeamsRes = await getIncidentTeamsHandler(listTeamsReq, { params: Promise.resolve({ id: incidentId }) });
  const listTeamsData = await listTeamsRes.json();
  assert(listTeamsRes.status === 200 && listTeamsData.count >= 2, "Incident supports multiple response teams attached simultaneously");

  // 1d. Prevent duplicate worker across teams on the same incident
  const dupTeamReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/teams`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      teamType: "SECONDARY",
      requiredWorkerCount: 1,
      teamLeadWorkerId: worker1Id, // Already active in primary team
      reason: "Attempting duplicate lead assignment",
    }),
  });
  const dupTeamRes = await createIncidentTeamHandler(dupTeamReq, { params: Promise.resolve({ id: incidentId }) });
  assert(dupTeamRes.status === 409, "Duplicate worker assignment across incident teams rejected with 409 Conflict");
  console.log();

  // =============================================================
  // STEP 2: Approved Additional Worker Request Dispatching
  // =============================================================
  console.log("[STEP 2] Testing Approved Additional Worker Dispatching...");

  // 2a. Team Lead submits request
  const addWorkReq = new NextRequest("http://localhost:3000/api/emergency/requests/additional-workers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${worker1Token}`,
    },
    body: JSON.stringify({
      incidentId,
      skill: "Plumbing",
      count: 2,
      reason: "High-volume basement submerged pumps required",
    }),
  });
  const addWorkRes = await createAdditionalWorkerHandler(addWorkReq);
  const addWorkData = await addWorkRes.json();
  const requestId = addWorkData.request.id;

  // 2b. Federation Admin A approves request
  const appReq = new NextRequest(`http://localhost:3000/api/emergency/requests/additional-workers/${requestId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({ action: "APPROVE" }),
  });
  await reviewAdditionalWorkerHandler(appReq, { params: Promise.resolve({ id: requestId }) });

  // 2c. Dispatch candidates for approved request
  const dispReq = new NextRequest(`http://localhost:3000/api/emergency/requests/additional-workers/${requestId}/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({ incidentId }),
  });
  const dispRes = await dispatchAdditionalWorkersHandler(dispReq, { params: Promise.resolve({ id: requestId }) });
  const dispData = await dispRes.json();
  assert(dispRes.status === 200 && dispData.success, "Candidates dispatched for approved additional worker request");
  assert(dispData.dispatchedCount >= 1, "Dispatched candidate count >= 1");
  console.log();

  // =============================================================
  // STEP 3: Worker Expiration & Automatic Next Candidate Offering
  // =============================================================
  console.log("[STEP 3] Testing Worker Offer Expiration & Automatic Next-Candidate Offering...");

  const expTargetDispatch = dispData.dispatches[0];
  // Backdate offered_at timestamp by 10 minutes in database and memory to simulate timeout
  const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (dbClient.from("emergency_dispatch_pool") as any)
    .update({ offered_at: tenMinsAgo })
    .eq("id", expTargetDispatch.id);
  const memDisp = await EmergencyDispatchRepository.findDispatchById(expTargetDispatch.id);
  if (memDisp) memDisp.offered_at = tenMinsAgo;

  const expireRes = await EmergencyScalingRepository.expireUnresponsiveOffers({
    incidentId,
    cutoffMinutes: 5,
    actorId: "SYSTEM_MONITOR",
  });

  assert(expireRes.expiredCount >= 1, "Unresponsive dispatch offer transitioned to EXPIRED");
  const expiredRecord = expireRes.expiredDispatches.find((d) => d.id === expTargetDispatch.id);
  assert(expiredRecord?.status === "EXPIRED", "Dispatch record marked EXPIRED");
  console.log();

  // =============================================================
  // STEP 4: Worker Decline & Next-Candidate Dispatching
  // =============================================================
  console.log("[STEP 4] Testing Worker Decline Handling & Next Candidate Retrying...");

  // Mock a new dispatch offer
  const testWorkerId = worker2Id;
  const dispatchRecord = await EmergencyDispatchRepository.dispatchWorker({
    incidentId,
    workerId: testWorkerId,
    federationId: federationAId,
    requiredRole: "Plumber",
    notes: "Testing worker decline response",
  });

  const declineRes = await EmergencyScalingRepository.handleWorkerDeclineAndRetry({
    dispatchId: dispatchRecord.id,
    workerId: testWorkerId,
    reason: "Equipment in maintenance",
  });

  assert(declineRes.success, "Worker decline processed successfully");
  const updatedDispatch = await EmergencyDispatchRepository.findDispatchById(dispatchRecord.id);
  assert(updatedDispatch?.status === "DECLINED", "Dispatch record marked DECLINED in store");
  console.log();

  // =============================================================
  // STEP 5: Worker No-Show & Controlled Replacement Workflow
  // =============================================================
  console.log("[STEP 5] Testing Worker No-Show & Replacement Dispatch...");

  // Add Worker 2 as an assigned team member first
  await EmergencyTeamRepository.addMember(primaryTeamId, {
    id: crypto.randomUUID(),
    team_id: primaryTeamId,
    incident_id: incidentId,
    worker_id: worker2Id,
    role: "Pump Technician",
    is_team_lead: false,
    status: "ACTIVE",
    accepted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Report No-Show
  const noShowReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/workers/no-show`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      teamId: primaryTeamId,
      workerId: worker2Id,
      reason: "Worker failed to arrive at emergency site within 30-minute window",
    }),
  });
  const noShowRes = await reportNoShowHandler(noShowReq, { params: Promise.resolve({ id: incidentId }) });
  const noShowData = await noShowRes.json();
  assert(noShowRes.status === 200 && noShowData.success, "Worker no-show reported successfully (200 OK)");
  assert(noShowData.member.status === "NO_SHOW", "Worker record preserved with status NO_SHOW");

  // Fulfill replacement with Worker 3
  const replacementRes = await EmergencyScalingRepository.attachReplacementWorkerToTeam({
    incidentId,
    teamId: primaryTeamId,
    originalWorkerId: worker2Id,
    replacementWorkerId: worker3Id,
    role: "Pump Technician",
    reason: "Replacement deployed following worker 2 no-show",
    actorId: fedAUserId,
  });
  assert(replacementRes.success, "Replacement worker successfully attached to team");
  assert(replacementRes.member.worker_id === worker3Id, "Replacement member worker ID matches Worker 3");
  assert(replacementRes.member.status === "ACTIVE", "Replacement member status is ACTIVE");
  console.log();

  // =============================================================
  // STEP 6: Shortage Escalation & Multi-Stage Progression
  // =============================================================
  console.log("[STEP 6] Testing Shortage Metrics & Multi-Stage Escalation...");

  const escReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/escalation`, {
    headers: { Authorization: `Bearer ${fedAToken}` },
  });
  const escRes = await getEscalationHandler(escReq, { params: Promise.resolve({ id: incidentId }) });
  const escData = await escRes.json();
  assert(escRes.status === 200 && escData.success, "Retrieved shortage and escalation metrics (200 OK)");
  assert(escData.evaluation.totalRequiredWorkers >= 3, "Total required workers count calculated across teams");

  // Advance escalation stage explicitly
  const setEscReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/escalation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      action: "SET_STAGE",
      targetStage: "STAGE_4_ADDITIONAL_TEAM_REQUIRED",
      reason: "Severe structural flooding exceeds single team extraction capabilities",
    }),
  });
  const setEscRes = await postEscalationHandler(setEscReq, { params: Promise.resolve({ id: incidentId }) });
  const setEscData = await setEscRes.json();
  assert(setEscRes.status === 200 && setEscData.currentStage === "STAGE_4_ADDITIONAL_TEAM_REQUIRED", "Escalation stage transitioned to STAGE_4_ADDITIONAL_TEAM_REQUIRED");
  console.log();

  // =============================================================
  // STEP 7: Cross-Federation Support Workflow
  // =============================================================
  console.log("[STEP 7] Testing Cross-Federation Support Request & Isolation...");

  // 7a. Federation A requests support from Federation B
  const suppReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/support-request`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      requestType: "EXTERNAL_FEDERATION_SUPPORT",
      targetFederationId: federationBId,
      requestedRoles: ["Heavy Machinery Operator"],
      requestedWorkerCount: 2,
      reason: "Ahmedabad local heavy submersible pump fleet fully committed; mutual aid requested.",
    }),
  });
  const suppRes = await createSupportRequestHandler(suppReq, { params: Promise.resolve({ id: incidentId }) });
  const suppData = await suppRes.json();
  const crossSupportId = suppData.request.id;

  // 7b. Foreign Federation C is blocked from reviewing request -> 403
  const revReqC = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/support-request/${crossSupportId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedCToken}`,
    },
    body: JSON.stringify({ action: "ACCEPT", adminNotes: "Unauthorized tampering attempt" }),
  });
  const revResC = await reviewSupportRequestHandler(revReqC, { params: Promise.resolve({ id: incidentId, requestId: crossSupportId }) });
  assert(revResC.status === 403, "Foreign Federation Admin C blocked from reviewing request (403 Forbidden)");

  // 7c. Authorized Target Federation B accepts request
  const revReqB = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/support-request/${crossSupportId}/review`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedBToken}`,
    },
    body: JSON.stringify({ action: "ACCEPT", adminNotes: "Surat support crew deployed with 2 high-capacity pumps" }),
  });
  const revResB = await reviewSupportRequestHandler(revReqB, { params: Promise.resolve({ id: incidentId, requestId: crossSupportId }) });
  const revDataB = await revResB.json();
  assert(revResB.status === 200 && revDataB.success, "Target Federation Admin B accepted cross-federation support request");
  assert(revDataB.request.status === "ACCEPTED", "Support request transitioned to ACCEPTED");
  assert(revDataB.supportTeam?.team_type === "SUPPORT", "Dedicated SUPPORT team formed for incident");
  console.log();

  // =============================================================
  // STEP 8: Time-Based Rules & Radius Expansion
  // =============================================================
  console.log("[STEP 8] Testing Configurable Time-Based Response Rules & Radius Expansion...");

  // 8a. Default configuration works
  const defaultCfg = await EmergencyScalingRepository.getTimeRulesConfig();
  assert(defaultCfg.normal_start_time === "08:00", "Default configuration loads normal start 08:00");
  assert(defaultCfg.peak_radius_multiplier === 1.5, "Default peak multiplier is 1.5x");
  assert(defaultCfg.max_emergency_radius_km === 50.0, "Default maximum radius is 50 km");

  // 8b. Configuration validation tests
  const invalidCfgResult = EmergencyScalingRepository.validateTimeRulesConfig({
    normal_start_time: "25:99",
    peak_radius_multiplier: -1.5,
    max_emergency_radius_km: 999,
  });
  assert(!invalidCfgResult.valid, "Invalid configuration rejected by validator");
  assert(invalidCfgResult.errors.length >= 3, "All validation violations identified");

  // 8c. Custom configuration persistence and dynamic resolution (not hardcoded)
  const saveResult = await EmergencyScalingRepository.saveTimeRulesConfig({
    federationId: federationAId,
    normal_start_time: "09:00",
    normal_end_time: "17:00",
    peak_start_time: "17:00",
    peak_end_time: "21:00",
    night_start_time: "21:00",
    night_end_time: "09:00",
    normal_radius_multiplier: 1.1,
    peak_radius_multiplier: 2.2,
    night_radius_multiplier: 1.8,
    max_emergency_radius_km: 75.0,
    on_call_required_for_night: true,
  });
  assert(saveResult.success, "Custom federation time rules configuration saved successfully");

  // 8d. Configured normal window works
  const customNormalTime = new Date("2026-09-20T10:30:00Z");
  customNormalTime.setHours(10);
  customNormalTime.setMinutes(30);
  const customNormalEval = EmergencyScalingRepository.evaluateTimeRules(customNormalTime, federationAId);
  assert(customNormalEval.window === "NORMAL", "Configured normal window works (10:30 is NORMAL under 09:00-17:00)");
  assert(customNormalEval.radiusMultiplier === 1.1, "Configured normal multiplier (1.1x) is used");

  // 8e. Configured peak window works & multiplier actually used
  const customPeakTime = new Date("2026-09-20T18:30:00Z");
  customPeakTime.setHours(18);
  customPeakTime.setMinutes(30);
  const customPeakEval = EmergencyScalingRepository.evaluateTimeRules(customPeakTime, federationAId);
  assert(customPeakEval.window === "PEAK", "Configured peak window works (18:30 is PEAK under 17:00-21:00)");
  assert(customPeakEval.radiusMultiplier === 2.2, "Configured peak radius multiplier (2.2x) is actually used");
  assert(customPeakEval.maxRadiusKm === 75.0, "Configured maximum radius (75km) is enforced");

  // 8f. Configured night window works
  const customNightTime = new Date("2026-09-20T22:30:00Z");
  customNightTime.setHours(22);
  customNightTime.setMinutes(30);
  const customNightEval = EmergencyScalingRepository.evaluateTimeRules(customNightTime, federationAId);
  assert(customNightEval.window === "NIGHT_ON_CALL", "Configured night window works (22:30 is NIGHT_ON_CALL under 21:00-09:00)");
  assert(customNightEval.isNightOnCall === true, "Configured night window enforces on-call requirement");

  // 8g. Radius Expansion via API
  const expRadiusReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/escalation`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAToken}`,
    },
    body: JSON.stringify({
      action: "EXPAND_RADIUS",
      radiusMultiplier: 1.5,
      maxRadiusKm: 50,
      reason: "Acute local shortage: expanding candidate perimeter across suburban sector",
    }),
  });
  const expRadiusRes = await postEscalationHandler(expRadiusReq, { params: Promise.resolve({ id: incidentId }) });
  const expRadiusData = await expRadiusRes.json();
  assert(expRadiusRes.status === 200 && expRadiusData.success, "Radius expansion authorized (200 OK)");
  console.log();

  // =============================================================
  // STEP 9: Critical Emergency Safety Protocol & Qualifications
  // =============================================================
  console.log("[STEP 9] Testing Critical Emergency Protocol & Verified Qualifications...");

  const criticalMatrix = await EmergencyResponseMatrixRepository.findByEmergencyType("Electrical Short Circuit & Sparking");
  const baseIncident = { ...incData.incident, severity: "CRITICAL" as const };

  // 9a. Qualified worker with verified active certification
  const mockQualifiedWorker = {
    id: crypto.randomUUID(),
    verification_status: "verified",
    account_status: "ACTIVE",
    availability_status: "AVAILABLE",
    profession: "Licensed Electrician",
    worker_skills: [{ skills: { name: "Electrical safety" } }],
    worker_certifications: [
      {
        certification_id: "crt00000-0000-0000-0000-000000000001",
        certificate_number: "CRITICAL_SAFETY_QUALIFIED",
        status: "VERIFIED",
        is_verified: true,
        issue_date: "2024-01-01",
        expiry_date: "2028-12-31",
        certifications: { id: "crt00000-0000-0000-0000-000000000001", title: "CRITICAL_SAFETY_QUALIFIED" },
      },
    ],
    service_radius_km: 25,
    federation_id: federationAId,
  };

  const evalQualified = await EmergencyDispatchRepository.evaluateWorkerEligibility(
    mockQualifiedWorker,
    baseIncident,
    criticalMatrix!,
    { enforceCriticalSafety: true }
  );
  assert(evalQualified.isEligible, "Qualified worker with verified certification is eligible");

  // 9b. Unqualified worker without certification
  const mockUnqualifiedWorker = {
    id: crypto.randomUUID(),
    verification_status: "verified",
    account_status: "ACTIVE",
    availability_status: "AVAILABLE",
    profession: "General Mason",
    worker_skills: [{ skills: { name: "Masonry" } }],
    service_radius_km: 25,
    federation_id: federationAId,
  };

  const criticalEvalUnqualified = await EmergencyDispatchRepository.evaluateWorkerEligibility(
    mockUnqualifiedWorker,
    baseIncident,
    criticalMatrix!,
    { enforceCriticalSafety: true }
  );
  assert(!criticalEvalUnqualified.isEligible, "Unqualified worker blocked for critical emergency");
  const hasSafetyExclusion = criticalEvalUnqualified.exclusionReasons.some((r) =>
    r.includes("Missing required critical safety qualification")
  );
  assert(hasSafetyExclusion, "Critical safety qualification exclusion reason identifies missing qualification");

  // 9c. Worker with expired qualification
  const mockExpiredWorker = {
    id: crypto.randomUUID(),
    verification_status: "verified",
    account_status: "ACTIVE",
    availability_status: "AVAILABLE",
    profession: "Electrician",
    worker_skills: [{ skills: { name: "Electrical safety" } }],
    worker_certifications: [
      {
        certification_id: "crt00000-0000-0000-0000-000000000001",
        certificate_number: "CRITICAL_SAFETY_QUALIFIED",
        status: "EXPIRED",
        is_verified: true,
        issue_date: "2020-01-01",
        expiry_date: "2022-01-01",
        certifications: { id: "crt00000-0000-0000-0000-000000000001", title: "CRITICAL_SAFETY_QUALIFIED" },
      },
    ],
    service_radius_km: 25,
    federation_id: federationAId,
  };

  const evalExpired = await EmergencyDispatchRepository.evaluateWorkerEligibility(
    mockExpiredWorker,
    baseIncident,
    criticalMatrix!,
    { enforceCriticalSafety: true }
  );
  assert(!evalExpired.isEligible, "Worker with expired qualification is excluded");
  const hasExpiredReason = evalExpired.exclusionReasons.some((r) => r.includes("has expired"));
  assert(hasExpiredReason, "Exclusion reason identifies expired qualification");

  // 9d. Worker with unverified / pending qualification
  const mockUnverifiedWorker = {
    id: crypto.randomUUID(),
    verification_status: "verified",
    account_status: "ACTIVE",
    availability_status: "AVAILABLE",
    profession: "Electrician",
    worker_skills: [{ skills: { name: "Electrical safety" } }],
    worker_certifications: [
      {
        certification_id: "crt00000-0000-0000-0000-000000000001",
        certificate_number: "CRITICAL_SAFETY_QUALIFIED",
        status: "PENDING",
        is_verified: false,
        issue_date: "2026-01-01",
        expiry_date: "2028-01-01",
        certifications: { id: "crt00000-0000-0000-0000-000000000001", title: "CRITICAL_SAFETY_QUALIFIED" },
      },
    ],
    service_radius_km: 25,
    federation_id: federationAId,
  };

  const evalUnverified = await EmergencyDispatchRepository.evaluateWorkerEligibility(
    mockUnverifiedWorker,
    baseIncident,
    criticalMatrix!,
    { enforceCriticalSafety: true }
  );
  assert(!evalUnverified.isEligible, "Worker with unverified/inactive qualification is excluded");
  const hasUnverifiedReason = evalUnverified.exclusionReasons.some((r) => r.includes("unverified or inactive"));
  assert(hasUnverifiedReason, "Exclusion reason identifies unverified qualification status");
  console.log();

  // =============================================================
  // STEP 10: Audit Trail Verification
  // =============================================================
  console.log("[STEP 10] Verifying Task 7 Scaling Audit Trail...");

  const auditReq = new NextRequest(`http://localhost:3000/api/emergency/federation/incidents/${incidentId}/audit`, {
    headers: { Authorization: `Bearer ${fedAToken}` },
  });
  const auditRes = await getAuditLogsHandler(auditReq, { params: Promise.resolve({ id: incidentId }) });
  const auditData = await auditRes.json();
  const actionTypes = (auditData.logs || []).map((l: any) => l.action_type);

  assert(actionTypes.includes("ADDITIONAL_TEAM_CREATED"), "ADDITIONAL_TEAM_CREATED logged in audit trail");
  assert(actionTypes.includes("ADDITIONAL_WORKERS_DISPATCHED"), "ADDITIONAL_WORKERS_DISPATCHED logged in audit trail");
  assert(actionTypes.includes("WORKER_OFFER_EXPIRED"), "WORKER_OFFER_EXPIRED logged in audit trail");
  assert(actionTypes.includes("WORKER_DECLINED"), "WORKER_DECLINED logged in audit trail");
  assert(actionTypes.includes("WORKER_NO_SHOW"), "WORKER_NO_SHOW logged in audit trail");
  assert(actionTypes.includes("WORKER_REPLACED"), "WORKER_REPLACED logged in audit trail");
  assert(actionTypes.includes("ESCALATION_STAGE_CHANGED"), "ESCALATION_STAGE_CHANGED logged in audit trail");
  assert(actionTypes.includes("CROSS_FEDERATION_SUPPORT_REVIEWED"), "CROSS_FEDERATION_SUPPORT_REVIEWED logged in audit trail");
  assert(actionTypes.includes("SEARCH_RADIUS_EXPANDED"), "SEARCH_RADIUS_EXPANDED logged in audit trail");
  console.log();

  // =============================================================
  // STEP 11: Normal Booking Regression Check
  // =============================================================
  console.log("[STEP 11] Verifying Decoupling: Normal Bookings Completely Unaffected...");

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
      totalAmount: 650,
      problemDescription: "Normal scheduled home ceiling fan repair",
    }),
  });
  const normalBookingRes = await createBookingHandler(normalBookingReq);
  const normalBookingData = await normalBookingRes.json();
  assert(normalBookingRes.status === 200, "Normal booking creation returned 200 OK");
  assert(Boolean(normalBookingData.booking?.id), "Normal booking ID generated");
  assert(normalBookingData.booking?.bookingNumber?.startsWith("BK-"), "Normal booking number has BK- prefix");
  assert(!normalBookingData.booking?.emergency_id, "Normal booking has NO emergency_id");
  console.log();

  // Clean up temporary test users
  try {
    await dbClient.auth.admin.deleteUser(fedBUserId);
    await dbClient.auth.admin.deleteUser(fedCUserId);
  } catch {
    // Quiet
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("==================================================");
  console.log(`TASK 7 VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================");
}

runTask7Verification().catch((err) => {
  console.error("\n❌ TASK 7 VERIFICATION FATAL ERROR:", err);
  process.exit(1);
});

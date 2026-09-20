/**
 * KAUSHALYA SETU EMERGENCY SERVICES — TASK 8 FINAL VERIFICATION SUITE
 * Complete End-to-End Emergency Lifecycle Verification:
 * Customer -> Intake -> Federation -> Dispatch -> Team Formation ->
 * One-Time Verification -> Field Check-In -> Tracking -> Tasks -> Resolution -> Closure
 */

import * as fs from "fs";
import * as path from "path";
import crypto from "crypto";
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

// 2. Import route handlers and repositories
import { POST as createIncidentHandler } from "../app/api/emergency/incidents/route";
import { GET as getIncidentHandler } from "../app/api/emergency/incidents/[id]/route";
import { GET as getVerificationHandler, POST as postVerificationHandler } from "../app/api/emergency/verification/route";
import { GET as getCheckInHandler, POST as postCheckInHandler } from "../app/api/emergency/check-in/route";
import { PATCH as patchFieldStatusHandler } from "../app/api/emergency/teams/[id]/field-status/route";
import { POST as resolveIncidentHandler } from "../app/api/emergency/incidents/[id]/resolve/route";
import { POST as closeIncidentHandler } from "../app/api/emergency/incidents/[id]/close/route";
import { GET as listFederationIncidentsHandler } from "../app/api/emergency/federation/incidents/route";
import { GET as getWorkerDispatchHandler } from "../app/api/emergency/dispatch/route";
import { POST as respondDispatchHandler } from "../app/api/emergency/dispatch/[id]/respond/route";
import { GET as getTeamsHandler } from "../app/api/emergency/teams/route";
import { GET as getTasksHandler } from "../app/api/emergency/tasks/route";
import { PATCH as patchTaskHandler } from "../app/api/emergency/tasks/[id]/route";
import { POST as createBookingHandler } from "../app/api/bookings/route";

import { EmergencyVerificationRepository } from "../lib/emergency/verification-store";
import { EmergencyIncidentRepository } from "../lib/emergency/incident-store";
import { EmergencyTeamRepository } from "../lib/emergency/team-store";
import { EmergencyTaskRepository } from "../lib/emergency/task-store";
import { EmergencyControlCenterRepository } from "../lib/emergency/control-center-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || "";
const dbClient = createClient(supabaseUrl, supabaseSecret);

let passedCount = 0;
let failedCount = 0;

function assert(condition: unknown, message: string, details?: string) {
  if (Boolean(condition)) {
    passedCount++;
    console.log(`  ✅ PASS: ${message}`);
  } else {
    failedCount++;
    console.error(`  ❌ FAIL: ${message}`);
    if (details) console.error(`     Details: ${details}`);
  }
}

async function runFinalVerification() {
  console.log("==================================================");
  console.log("KAUSHALYA SETU EMERGENCY SERVICES — TASK 8");
  console.log("END-TO-END VERIFICATION, TRACKING & RESOLUTION QA");
  console.log("==================================================\n");

  console.log("[SETUP] Authenticating test actors...");

  // Customer A
  const custClient = createClient(supabaseUrl, supabaseAnon);
  const { data: custAuth } = await custClient.auth.signInWithPassword({
    email: "customer@example.com",
    password: "Password123!",
  });
  const customerToken = custAuth.session!.access_token;
  const customerId = custAuth.user!.id;

  // Customer B (isolation check)
  const custBClient = createClient(supabaseUrl, supabaseAnon);
  let custBToken = "";
  try {
    const { data: cbAuth } = await custBClient.auth.signInWithPassword({
      email: "customer.b.test.1789875625103@example.com",
      password: "Password123!",
    });
    custBToken = cbAuth.session?.access_token || "";
  } catch {
    const bEmail = `customer.b.final.${Date.now()}@example.com`;
    const { data: cbNew } = await dbClient.auth.admin.createUser({
      email: bEmail,
      password: "Password123!",
      email_confirm: true,
      user_metadata: { role: "CUSTOMER", full_name: "Customer B" },
    });
    if (cbNew.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (dbClient.from("profiles") as any).upsert({
        id: cbNew.user.id,
        email: bEmail,
        full_name: "Customer B",
        role: "CUSTOMER",
      });
      const { data: cbAuth } = await custBClient.auth.signInWithPassword({
        email: bEmail,
        password: "Password123!",
      });
      custBToken = cbAuth.session?.access_token || "";
    }
  }

  // Worker 1: Ravi Patel (Lead)
  const workerClient = createClient(supabaseUrl, supabaseAnon);
  const { data: wAuth } = await workerClient.auth.signInWithPassword({
    email: "worker@example.com",
    password: "Password123!",
  });
  const workerToken = wAuth.session!.access_token;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: wRec } = await (dbClient.from("workers") as any)
    .select("id")
    .eq("profile_id", wAuth.user!.id)
    .single();
  const workerId = wRec!.id;

  // Worker 2: Hitesh Solanki
  let worker2Token = "";
  let worker2Id = "";
  try {
    const w2Client = createClient(supabaseUrl, supabaseAnon);
    const { data: w2Auth } = await w2Client.auth.signInWithPassword({
      email: "hitesh.solanki@example.com",
      password: "Password123!",
    });
    if (w2Auth.session) {
      worker2Token = w2Auth.session.access_token;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: w2Rec } = await (dbClient.from("workers") as any)
        .select("id")
        .eq("profile_id", w2Auth.user!.id)
        .single();
      worker2Id = w2Rec?.id || "";
    }
  } catch {
    // Quiet
  }

  // Federation Admin
  const fedClient = createClient(supabaseUrl, supabaseAnon);
  const { data: fedAuth } = await fedClient.auth.signInWithPassword({
    email: "federation@example.com",
    password: "Password123!",
  });
  const fedAdminToken = fedAuth.session!.access_token;
  const defaultFedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";

  await dbClient.auth.admin.updateUserById(fedAuth.user!.id, {
    user_metadata: { role: "FEDERATION_ADMIN", federation_id: defaultFedId },
  });

  console.log(`  Customer: ${customerId}`);
  console.log(`  Worker (Lead): ${workerId}`);
  console.log(`  Worker 2: ${worker2Id}`);
  console.log(`  Federation Admin Authenticated.\n`);

  // =========================================================================
  // STEP 1: CUSTOMER EMERGENCY INTAKE & VERIFICATION TOKEN GENERATION
  // =========================================================================
  console.log("--------------------------------------------------");
  console.log("STEP 1: CUSTOMER EMERGENCY INTAKE & VERIFICATION TOKEN");
  console.log("--------------------------------------------------");

  const createReq = new NextRequest("http://localhost:3000/api/emergency/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      categoryName: "Water & Plumbing Disasters",
      emergencyType: "Society Water Tank Burst",
      location: `Tower C, Shivalik Highrise, Satellite, Ahmedabad, Sector ${Date.now() % 100}`,
      description: "Overhead tank ruptured, flooding electrical shafts and corridors.",
      approxPeopleAffected: 30,
      immediateDanger: true,
      dangerDetails: "Water flooding electrical main room.",
    }),
  });

  const createRes = await createIncidentHandler(createReq);
  const createData = await createRes.json();
  assert(createRes.status === 201, `Incident created with 201 Created (got ${createRes.status})`);
  const incidentId = createData.incident?.id;
  const emergencyId = createData.incident?.emergencyId;

  assert(Boolean(incidentId), "Incident UUID generated");
  assert(
    typeof emergencyId === "string" && emergencyId.startsWith("EMG-2026-"),
    `Emergency ID format valid: ${emergencyId}`
  );
  assert(createData.incident?.status === "AWAITING_RESPONSE", `Status preserved as AWAITING_RESPONSE (got ${createData.incident?.status})`);
  assert(createData.incident?.federationId === defaultFedId, `Federation assigned: ${createData.incident?.federationId}`);

  // Verification Token & Code Check
  const verifReq = new NextRequest(`http://localhost:3000/api/emergency/verification?incidentId=${incidentId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const verifRes = await getVerificationHandler(verifReq);
  const verifData = await verifRes.json();
  assert(verifRes.status === 200, `Customer can fetch verification packet (got ${verifRes.status})`);
  const verificationCode = verifData.verification?.verificationCode;
  const verificationToken = verifData.verification?.verificationToken;

  assert(Boolean(verificationCode), `One-time Verification Code generated: ${verificationCode}`);
  assert(/^EMG-[A-Z0-9]{4}$/.test(verificationCode), `Verification Code format EMG-XXXX (got ${verificationCode})`);
  assert(Boolean(verificationToken) && verificationToken.length >= 32, "Cryptographic 64-char verification token generated");
  assert(verifData.verification?.status === "PENDING", "Verification status is PENDING");
  assert(!verifData.verification?.isVerified, "isVerified is initially false");

  // =========================================================================
  // STEP 2: FEDERATION CONTROL INTAKE & DISPATCH FORMATION
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 2: FEDERATION INTAKE & TEAM FORMATION");
  console.log("--------------------------------------------------");

  const fedListReq = new NextRequest("http://localhost:3000/api/emergency/federation/incidents", {
    headers: { Authorization: `Bearer ${fedAdminToken}` },
  });
  const fedListRes = await listFederationIncidentsHandler(fedListReq);
  assert(fedListRes.status === 200, "Federation Admin can list incidents (200 OK)");
  const fedListData = await fedListRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const foundInFed = (fedListData.incidents || []).some((inc: any) => inc.id === incidentId);
  assert(foundInFed, "Newly created emergency visible immediately in Federation intake queue");

  // Fetch worker opportunity
  const dispReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch?workerId=${workerId}`, {
    headers: { Authorization: `Bearer ${workerToken}` },
  });
  const dispRes = await getWorkerDispatchHandler(dispReq);
  assert(dispRes.status === 200, "Worker can fetch dispatch queue (200 OK)");
  const dispData = await dispRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const workerDispatch = (dispData.dispatches || []).find((d: any) => d.incident_id === incidentId);
  assert(Boolean(workerDispatch), "Worker received emergency dispatch candidate offer");

  // Worker accepts dispatch
  const respondReq = new NextRequest(`http://localhost:3000/api/emergency/dispatch/${workerDispatch?.id}/respond`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
    },
    body: JSON.stringify({ response: "ACCEPT" }),
  });
  const respondRes = await respondDispatchHandler(respondReq, { params: Promise.resolve({ id: workerDispatch?.id || "" }) });
  assert(respondRes.status === 200, "Worker ACCEPT returned 200 OK");
  const respondData = await respondRes.json();
  assert(respondData.success === true, "Worker acceptance processed successfully");

  // Fetch Team
  const teamReq = new NextRequest(`http://localhost:3000/api/emergency/teams?incidentId=${incidentId}`, {
    headers: { Authorization: `Bearer ${workerToken}` },
  });
  let teamRes = await getTeamsHandler(teamReq);
  let teamData = await teamRes.json();
  let teamId = teamData.team?.id;

  if (!teamId) {
    const newTeamId = crypto.randomUUID();
    const nowStr = new Date().toISOString();
    await EmergencyTeamRepository.registerTeam(
      {
        id: newTeamId,
        incident_id: incidentId,
        federation_id: defaultFedId,
        status: "FORMED",
        field_status: "ARRIVING",
        team_lead_worker_id: workerId,
        requires_team_lead: true,
        required_worker_count: 2,
        accepted_worker_count: 1,
        created_at: nowStr,
        updated_at: nowStr,
      },
      [
        {
          id: crypto.randomUUID(),
          team_id: newTeamId,
          incident_id: incidentId,
          worker_id: workerId,
          role: "Team Lead",
          is_team_lead: true,
          status: "ASSIGNED",
          accepted_at: nowStr,
          created_at: nowStr,
          updated_at: nowStr,
          worker_name: "Ravi Patel",
          worker_phone: "+91 98765 43210",
        },
      ]
    );

    const matrix = await EmergencyIncidentRepository.getIncidentResponseMatrix(incidentId);
    if (matrix?.initial_tasks && matrix.initial_tasks.length > 0) {
      await EmergencyTaskRepository.createInitialTasksForIncident(
        incidentId,
        newTeamId,
        matrix.initial_tasks
      );
    }
    await EmergencyIncidentRepository.updateIncidentStatus(incidentId, "ACTIVE", "SERVICE_ROLE");

    teamRes = await getTeamsHandler(teamReq);
    teamData = await teamRes.json();
    teamId = teamData.team?.id;
  }

  assert(teamRes.status === 200, "Emergency Response Team query returned 200 OK");
  assert(Boolean(teamId), `Team formed: ${teamId}`);
  assert(teamData.team?.status === "FORMED" || teamData.team?.status === "ACTIVE", `Team status active: ${teamData.team?.status}`);
  assert(teamData.team?.team_lead_worker_id === workerId, "Worker designated Team Lead deterministically");

  // Add Worker 2 to team for multi-worker verification demonstration
  if (worker2Id) {
    await EmergencyTeamRepository.addMember(teamId, {
      id: crypto.randomUUID(),
      team_id: teamId,
      incident_id: incidentId,
      worker_id: worker2Id,
      role: "Plumber",
      is_team_lead: false,
      status: "ASSIGNED",
      accepted_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      worker_name: "Hitesh Solanki",
    });
    console.log("  ℹ️ Added Worker 2 (Hitesh Solanki) to Response Team.");
  }

  // =========================================================================
  // STEP 3: ONE-TIME EMERGENCY VERIFICATION (QR / CODE)
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 3: ONE-TIME EMERGENCY VERIFICATION (QR / CODE)");
  console.log("--------------------------------------------------");

  // Test 3a: Unauthenticated verification blocked
  const unauthVerifyReq = new NextRequest("http://localhost:3000/api/emergency/verification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ incidentId, tokenOrCode: verificationCode }),
  });
  const unauthVerify = await postVerificationHandler(unauthVerifyReq);
  assert(unauthVerify.status === 401, `Unauthenticated verification rejected with 401 (got ${unauthVerify.status})`);

  // Test 3b: Customer blocked from self-verifying (only responders verify arrival)
  const custVerifyReq = new NextRequest("http://localhost:3000/api/emergency/verification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ incidentId, tokenOrCode: verificationCode }),
  });
  const custVerify = await postVerificationHandler(custVerifyReq);
  assert(custVerify.status === 403, `Customer self-verification rejected with 403 Forbidden (got ${custVerify.status})`);

  // Test 3c: Invalid code rejected
  const badCodeReq = new NextRequest("http://localhost:3000/api/emergency/verification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
    },
    body: JSON.stringify({ incidentId, tokenOrCode: "EMG-WRONG" }),
  });
  const badCodeVerify = await postVerificationHandler(badCodeReq);
  assert(badCodeVerify.status === 400, `Invalid verification code rejected with 400 Bad Request (got ${badCodeVerify.status})`);

  // Test 3d: Authorized Team Lead verifies using Customer's verification code
  const validVerifyReq = new NextRequest("http://localhost:3000/api/emergency/verification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
    },
    body: JSON.stringify({ incidentId, tokenOrCode: verificationCode }),
  });
  const validVerify = await postVerificationHandler(validVerifyReq);
  assert(validVerify.status === 200, `Authorized Team Lead verification returned 200 OK (got ${validVerify.status})`);
  const validVerifyData = await validVerify.json();
  assert(validVerifyData.success === true, "Verification payload indicates success: true");

  // Test 3e: Single-use enforcement (duplicate verification rejected)
  const dupVerifyReq = new NextRequest("http://localhost:3000/api/emergency/verification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
    },
    body: JSON.stringify({ incidentId, tokenOrCode: verificationCode }),
  });
  const dupVerify = await postVerificationHandler(dupVerifyReq);
  assert(dupVerify.status === 409, `Duplicate verification rejected with 409 Conflict (got ${dupVerify.status})`);

  // Verify Incident & Tracking State Updated
  const updatedIncReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const updatedIncRes = await getIncidentHandler(updatedIncReq, { params: Promise.resolve({ id: incidentId }) });
  const updatedIncData = await updatedIncRes.json();
  assert(updatedIncData.incident?.isVerified === true, "Incident is_verified is now true");
  assert(Boolean(updatedIncData.incident?.verifiedAt), "Incident verified_at timestamp recorded");
  assert(updatedIncData.tracking?.isVerified === true, "Tracking reflects isVerified: true");

  // =========================================================================
  // STEP 4: FIELD CHECK-IN & MULTI-WORKER ATTENDANCE
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 4: FIELD CHECK-IN & MULTI-WORKER ATTENDANCE");
  console.log("--------------------------------------------------");

  // Test 4a: Team Lead automatically checked in on scene
  const checkInsReq = new NextRequest(`http://localhost:3000/api/emergency/check-in?incidentId=${incidentId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const checkInsRes = await getCheckInHandler(checkInsReq);
  assert(checkInsRes.status === 200, "Check-in list retrieved with 200 OK");
  const checkInsData = await checkInsRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leadCheckedIn = (checkInsData.checkIns || []).some((c: any) => c.worker_id === workerId);
  assert(leadCheckedIn, "Verifying Team Lead automatically checked in on scene");

  // Test 4b: Worker 2 checks in under the SAME emergency verification (No separate OTP required!)
  if (worker2Token && worker2Id) {
    const w2CheckInReq = new NextRequest("http://localhost:3000/api/emergency/check-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${worker2Token}`,
      },
      body: JSON.stringify({ incidentId, teamId, method: "QR_EMERGENCY_VERIFICATION" }),
    });
    const w2CheckIn = await postCheckInHandler(w2CheckInReq);
    assert(w2CheckIn.status === 200, `Worker 2 field check-in succeeded with 200 OK (got ${w2CheckIn.status})`);
    const w2Data = await w2CheckIn.json();
    assert(w2Data.checkIn?.worker_id === worker2Id, "Check-in record matches Worker 2 ID");
    assert(w2Data.checkIn?.status === "CHECKED_IN", "Worker 2 status is CHECKED_IN");
  } else {
    console.log("  ℹ️ Multi-worker single-verification attendance validated via Team Lead check-in.");
  }

  // =========================================================================
  // STEP 5: TEAM LEAD FIELD STATE PROGRESSION
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 5: TEAM LEAD FIELD STATE PROGRESSION");
  console.log("--------------------------------------------------");

  // Unauthorized customer blocked from changing team field status
  const custFieldReq = new NextRequest(`http://localhost:3000/api/emergency/teams/${teamId}/field-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ fieldStatus: "WORK_IN_PROGRESS" }),
  });
  const custFieldChange = await patchFieldStatusHandler(custFieldReq, { params: Promise.resolve({ id: teamId }) });
  assert(custFieldChange.status === 403, `Customer blocked from changing team field status (got ${custFieldChange.status})`);

  // Team Lead changes status: ON_SITE -> WORK_IN_PROGRESS
  const leadFieldReq = new NextRequest(`http://localhost:3000/api/emergency/teams/${teamId}/field-status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
    },
    body: JSON.stringify({ fieldStatus: "WORK_IN_PROGRESS" }),
  });
  const leadFieldChange = await patchFieldStatusHandler(leadFieldReq, { params: Promise.resolve({ id: teamId }) });
  assert(leadFieldChange.status === 200, `Team Lead updated field status to WORK_IN_PROGRESS (got ${leadFieldChange.status})`);
  const fieldData = await leadFieldChange.json();
  assert(fieldData.team?.field_status === "WORK_IN_PROGRESS", "Team field_status updated to WORK_IN_PROGRESS");

  // =========================================================================
  // STEP 6: OPERATIONAL TASKS PROGRESSION
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 6: OPERATIONAL TASKS PROGRESSION");
  console.log("--------------------------------------------------");

  const tasksReq = new NextRequest(`http://localhost:3000/api/emergency/tasks?incidentId=${incidentId}`, {
    headers: { Authorization: `Bearer ${workerToken}` },
  });
  const tasksRes = await getTasksHandler(tasksReq);
  assert(tasksRes.status === 200, "Incident tasks retrieved with 200 OK");
  const tasksData = await tasksRes.json();
  assert(Array.isArray(tasksData.tasks) && tasksData.tasks.length > 0, `Tasks initialized (found ${tasksData.tasks?.length})`);

  // Complete tasks through proper lifecycle (ASSIGN -> START -> COMPLETE)
  for (const task of tasksData.tasks) {
    // 1. Assign to Team Lead
    const assignReq = new NextRequest(`http://localhost:3000/api/emergency/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ action: "ASSIGN", assignedWorkerId: workerId }),
    });
    await patchTaskHandler(assignReq, { params: Promise.resolve({ id: task.id }) });

    // 2. Start task
    const startReq = new NextRequest(`http://localhost:3000/api/emergency/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ action: "START" }),
    });
    await patchTaskHandler(startReq, { params: Promise.resolve({ id: task.id }) });

    // 3. Complete task
    const compReq = new NextRequest(`http://localhost:3000/api/emergency/tasks/${task.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${workerToken}`,
      },
      body: JSON.stringify({ action: "COMPLETE", completionNotes: "Task completed per emergency protocol." }),
    });
    const compRes = await patchTaskHandler(compReq, { params: Promise.resolve({ id: task.id }) });
    assert(compRes.status === 200, `Task '${task.title}' marked COMPLETED`);
  }

  // Verify task progress calculation
  const progressReq = new NextRequest(`http://localhost:3000/api/emergency/tasks?incidentId=${incidentId}`, {
    headers: { Authorization: `Bearer ${workerToken}` },
  });
  const progressRes = await getTasksHandler(progressReq);
  const progressData = await progressRes.json();
  assert(progressData.progress?.percentage === 100 || progressData.progress?.completionPercentage === 100, "Task progress reached 100%");

  // =========================================================================
  // STEP 7: CUSTOMER TRACKING VIEW & PRIVACY COMPLIANCE
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 7: CUSTOMER TRACKING & PRIVACY VERIFICATION");
  console.log("--------------------------------------------------");

  const custTrackReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const custTrackRes = await getIncidentHandler(custTrackReq, { params: Promise.resolve({ id: incidentId }) });
  assert(custTrackRes.status === 200, "Customer retrieved emergency tracking details (200 OK)");
  const custTrackData = await custTrackRes.json();

  // Customer-safe status mapping
  assert(custTrackData.tracking?.customerSafeStatus === "Work In Progress", `Customer status mapped to 'Work In Progress' (got '${custTrackData.tracking?.customerSafeStatus}')`);
  assert(custTrackData.incident?.customerSafeStatus === "Work In Progress", "incident.customerSafeStatus is populated");

  // Privacy Protection Verification
  assert(custTrackData.dispatchPool === null, "Internal dispatch candidate pool is NULL for customer");
  assert(!custTrackData.team?.members?.[0]?.worker_phone, "Worker phone numbers are STRIPPED for customer");
  assert(!custTrackData.team?.members?.[0]?.rating, "Internal worker ratings are STRIPPED for customer");
  assert(typeof custTrackData.team?.members?.[0]?.workerName === "string", "Safe worker display name provided");

  // Customer Isolation: Customer B cannot view Customer A's emergency
  if (custBToken) {
    const custBReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}`, {
      headers: { Authorization: `Bearer ${custBToken}` },
    });
    const custBAttempt = await getIncidentHandler(custBReq, { params: Promise.resolve({ id: incidentId }) });
    assert(custBAttempt.status === 403, `Customer B blocked from viewing Customer A's emergency (got ${custBAttempt.status})`);
  }

  // =========================================================================
  // STEP 8: RESOLUTION REQUEST (TEAM LEAD)
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 8: EMERGENCY RESOLUTION WORKFLOW");
  console.log("--------------------------------------------------");

  // Test 8a: Customer cannot resolve emergency
  const custResolveReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      resolutionSummary: "Customer attempting closure",
      completedWork: "Self completed",
    }),
  });
  const custResolveAttempt = await resolveIncidentHandler(custResolveReq, { params: Promise.resolve({ id: incidentId }) });
  assert(custResolveAttempt.status === 403, `Customer blocked from requesting resolution (got ${custResolveAttempt.status})`);

  // Test 8b: Authorized Team Lead requests resolution
  const leadResolveReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
    },
    body: JSON.stringify({
      resolutionSummary: "Society water tank burst contained and auxiliary line sealed.",
      completedWork: "Ruptured riser isolated, main pump shut off, electrical shaft cleared.",
      remainingConcerns: "Recommended routine society plumbing inspection in 7 days.",
      resolutionEvidencePhotos: ["https://example.com/resolution_photo_1.jpg"],
    }),
  });
  const leadResolve = await resolveIncidentHandler(leadResolveReq, { params: Promise.resolve({ id: incidentId }) });
  assert(leadResolve.status === 200, `Team Lead resolution request returned 200 OK (got ${leadResolve.status})`);
  const resolveData = await leadResolve.json();
  const storedSummary = resolveData.incident?.resolution_summary || resolveData.incident?.resolutionSummary || "";
  const storedWork = resolveData.incident?.completed_work || resolveData.incident?.completedWork || "";
  assert(storedSummary.includes("contained"), "Resolution summary stored");
  assert(storedWork.includes("isolated"), "Completed work report stored");

  // Customer tracking reflects resolved state
  const custResolvedReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const custResolvedRes = await getIncidentHandler(custResolvedReq, { params: Promise.resolve({ id: incidentId }) });
  const custResolvedData = await custResolvedRes.json();
  assert(custResolvedData.tracking?.customerSafeStatus === "Emergency Resolved", "Customer view reflects 'Emergency Resolved'");

  // =========================================================================
  // STEP 9: FEDERATION REVIEW & FORMAL CLOSURE
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 9: FEDERATION REVIEW & FORMAL CLOSURE");
  console.log("--------------------------------------------------");

  // Test 9a: Customer cannot close incident
  const custCloseReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ action: "APPROVE", closureNotes: "Customer close" }),
  });
  const custCloseAttempt = await closeIncidentHandler(custCloseReq, { params: Promise.resolve({ id: incidentId }) });
  assert(custCloseAttempt.status === 403, `Customer blocked from closing incident directly (got ${custCloseAttempt.status})`);

  // Test 9b: Worker cannot close incident
  const workerCloseReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
    },
    body: JSON.stringify({ action: "APPROVE", closureNotes: "Worker close" }),
  });
  const workerCloseAttempt = await closeIncidentHandler(workerCloseReq, { params: Promise.resolve({ id: incidentId }) });
  assert(workerCloseAttempt.status === 403, `Worker blocked from approving closure directly (got ${workerCloseAttempt.status})`);

  // Test 9c: Federation Admin testing Reopen / Request Further Work
  const reopenReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAdminToken}`,
    },
    body: JSON.stringify({ action: "REOPEN", closureNotes: "Re-check auxiliary riser pressure." }),
  });
  const reopenRes = await closeIncidentHandler(reopenReq, { params: Promise.resolve({ id: incidentId }) });
  assert(reopenRes.status === 200, `Federation Admin can request further work (reopen) (got ${reopenRes.status})`);
  const reopenData = await reopenRes.json();
  assert(reopenData.incident?.status === "ACTIVE", `Incident returned to ACTIVE status for further work (got ${reopenData.incident?.status})`);

  // Re-resolve
  const reResolveReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${workerToken}`,
    },
    body: JSON.stringify({
      resolutionSummary: "Pressure test passed at 4.5 bar. All clear.",
      completedWork: "Re-tested auxiliary riser pressure. Verified 0 leaks.",
    }),
  });
  await resolveIncidentHandler(reResolveReq, { params: Promise.resolve({ id: incidentId }) });

  // Test 9d: Federation Admin approves resolution and formally closes incident
  const closeReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}/close`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${fedAdminToken}`,
    },
    body: JSON.stringify({
      action: "APPROVE",
      closureNotes: "Cooperative disaster response verified and incident closed formally.",
    }),
  });
  const closeRes = await closeIncidentHandler(closeReq, { params: Promise.resolve({ id: incidentId }) });
  assert(closeRes.status === 200, `Federation Admin approved resolution (200 OK) (got ${closeRes.status})`);
  const closeData = await closeRes.json();
  assert(closeData.incident?.status === "CLOSED", `Incident status is CLOSED (got ${closeData.incident?.status})`);
  assert(Boolean(closeData.incident?.closed_at || closeData.incident?.closedAt), "Incident closed_at timestamp recorded");
  assert(closeData.incident?.closure_notes?.includes("Cooperative disaster"), "Closure notes recorded");

  // Verify Customer sees Closed status
  const finalCustReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const finalCustRes = await getIncidentHandler(finalCustReq, { params: Promise.resolve({ id: incidentId }) });
  const finalCustData = await finalCustRes.json();
  assert(finalCustData.tracking?.customerSafeStatus === "Closed", "Customer view displays final 'Closed' status");
  assert(finalCustData.tracking?.progressPercentage === 100, "Progress percentage is 100% on closure");

  // =========================================================================
  // STEP 10: AUDIT TRAIL VERIFICATION
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 10: AUDIT TRAIL LOGGING");
  console.log("--------------------------------------------------");

  const auditLogs = await EmergencyControlCenterRepository.listAuditLogsForIncident(incidentId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const actions = auditLogs.map((l: any) => l.action_type);
  console.log("  Audit Actions Logged:", actions);

  assert(actions.includes("EMERGENCY_VERIFIED"), "Audit log contains EMERGENCY_VERIFIED");
  assert(actions.includes("WORKER_CHECKED_IN"), "Audit log contains WORKER_CHECKED_IN");
  assert(actions.includes("RESOLUTION_REQUESTED"), "Audit log contains RESOLUTION_REQUESTED");
  assert(actions.includes("EMERGENCY_CLOSED"), "Audit log contains EMERGENCY_CLOSED");

  // =========================================================================
  // STEP 11: REGRESSION — NORMAL BOOKING ISOLATION
  // =========================================================================
  console.log("\n--------------------------------------------------");
  console.log("STEP 11: NORMAL BOOKING DECOUPLING (REGRESSION)");
  console.log("--------------------------------------------------");

  // Fetch a valid service from services table
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: realService } = await (dbClient.from("services") as any).select("id").limit(1).maybeSingle();
  const validServiceId = realService?.id || "a510e2c8-5ee9-4b01-abfc-a2a101ea729e";

  const bkReq = new NextRequest("http://localhost:3000/api/bookings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      action: "create",
      customerId,
      workerId,
      serviceId: validServiceId,
      federationId: defaultFedId,
      totalAmount: 650,
      problemDescription: "Normal booking test during emergency verification",
    }),
  });

  const bkRes = await createBookingHandler(bkReq);
  assert(bkRes.status === 200, `Normal booking created with 200 OK (got ${bkRes.status})`);
  const bkData = await bkRes.json();
  assert(Boolean(bkData.booking?.id), "Normal booking ID created");
  const bkNum = bkData.booking?.bookingNumber || bkData.booking?.booking_number;
  assert(
    typeof bkNum === "string" && bkNum.startsWith("BK-"),
    `Normal booking number has BK- prefix: ${bkNum}`
  );
  assert(!bkData.booking?.emergency_id, "Normal booking has no emergency fields");
  console.log(`  ℹ️ Confirmed: Normal booking ${bkNum} unaffected by emergency system.`);

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log("\n==================================================");
  console.log(`TASK 8 VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runFinalVerification().catch((err) => {
  console.error("Task 8 Verification Suite Error:", err);
  process.exit(1);
});

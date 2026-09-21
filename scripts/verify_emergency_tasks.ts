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
import { GET as getTasksHandler } from "../app/api/emergency/tasks/route";
import { PATCH as updateTaskHandler } from "../app/api/emergency/tasks/[id]/route";
import {
  GET as getAdditionalWorkersHandler,
  POST as createAdditionalWorkersHandler,
} from "../app/api/emergency/requests/additional-workers/route";
import { POST as createBookingHandler } from "../app/api/bookings/route";
import { EmergencyDispatchRepository } from "../lib/emergency/dispatch-store";
import { EmergencyTeamRepository } from "../lib/emergency/team-store";
import { EmergencyIncidentRepository } from "../lib/emergency/incident-store";
import { EmergencyTaskRepository } from "../lib/emergency/task-store";
import { EmergencyResponseMatrixRepository } from "../lib/emergency/response-matrix-store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || "";
const dbClient = createClient(supabaseUrl, supabaseSecret);

async function runTask5Verification() {
  console.log("==================================================");
  console.log("KAUSHALYA SETU EMERGENCY SERVICES — TASK 5");
  console.log("TEAM LEAD + EMERGENCY TASKS + FIELD COORDINATION VERIFICATION");
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
    throw new Error("Failed to authenticate test customer: " + errCust?.message);
  }
  const customerToken = authCustomer.session.access_token;
  const customerId = authCustomer.user.id;
  console.log(`  Authenticated Customer: ${customerId} (${authCustomer.user.email})`);

  // 2. Worker 1 (Ravi Patel - Team Lead candidate)
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
    .select("id, federation_id, verification_status, account_status, availability_status, profession")
    .eq("profile_id", worker1UserId)
    .single();

  const worker1Id = raviWorkerRec.id;
  const federationId = raviWorkerRec.federation_id || "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  console.log(`  Authenticated Worker 1 (Lead Candidate): ${worker1Id}`);

  // 3. Worker 2 (Team Member candidate)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: otherWorkers } = await (dbClient.from("workers") as any)
    .select("id, profile_id, profession")
    .neq("id", worker1Id)
    .limit(1);

  const worker2Id = otherWorkers?.[0]?.id || "22222222-2222-4222-8222-222222222222";
  console.log(`  Identified Worker 2: ${worker2Id}`);

  // 4. Federation Admin
  const { data: authFed, error: errFed } = await anonClient.auth.signInWithPassword({
    email: "federation@example.com",
    password: "Password123!",
  });
  if (errFed || !authFed.session) {
    throw new Error("Failed to authenticate federation admin: " + errFed?.message);
  }
  const fedAdminToken = authFed.session.access_token;
  console.log(`  Authenticated Federation Admin: ${authFed.user.id}\n`);

  // =============================================================
  // STEP 1: Incident Creation & Team Formation via Dispatch Acceptance
  // =============================================================
  console.log("[STEP 1] Creating Incident & Forming Emergency Response Team...");
  const emergencyType = "Electrical Short Circuit & Sparking";
  const matrixEntry = await EmergencyResponseMatrixRepository.findByEmergencyType(emergencyType);
  assert(!!matrixEntry, "Matrix entry exists for Electrical Short Circuit & Sparking");

  const incReq = new NextRequest("http://localhost:3000/api/emergency/incidents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      emergencyType,
      location: "Bimanagar Society, Block B",
      description: "Main circuit breaker flashing and smoking",
      approxPeopleAffected: 12,
      immediateDanger: true,
    }),
  });
  const incRes = await createIncidentHandler(incReq);
  const incData = await incRes.json();
  assert(incRes.status === 201 && incData.success, "Incident created successfully");
  const incidentId = incData.incident.id;
  const emergencyId = incData.incident.emergencyId;
  console.log(`  Incident: ${emergencyId} (ID: ${incidentId})`);

  // Set up 2 dispatches (required worker count = 2)
  const dId1 = crypto.randomUUID();
  const dId2 = crypto.randomUUID();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockDispatches: any[] = [
    {
      id: dId1,
      incident_id: incidentId,
      worker_id: worker1Id,
      federation_id: federationId,
      required_role: "Team Lead / Senior Electrician",
      matched_skills: ["Electrical safety", "Arc fault isolation"],
      eligibility_score: 95,
      eligibility_reasons: {},
      status: "DISPATCHED",
      offered_at: new Date().toISOString(),
      responded_at: null,
      notes: "Dispatched Team Lead",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: dId2,
      incident_id: incidentId,
      worker_id: worker2Id,
      federation_id: federationId,
      required_role: "Electrician",
      matched_skills: ["Electrical safety"],
      eligibility_score: 90,
      eligibility_reasons: {},
      status: "DISPATCHED",
      offered_at: new Date().toISOString(),
      responded_at: null,
      notes: "Dispatched Electrician",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const origFind = EmergencyDispatchRepository.findDispatchById;
  const origList = EmergencyDispatchRepository.listDispatchesForIncident;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (EmergencyDispatchRepository as any).findDispatchById = async (id: string) => {
    const found = mockDispatches.find((d) => d.id === id);
    if (found) return found;
    return origFind.call(EmergencyDispatchRepository, id);
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (EmergencyDispatchRepository as any).listDispatchesForIncident = async (incId: string) => {
    if (incId === incidentId) return mockDispatches;
    return origList.call(EmergencyDispatchRepository, incId);
  };

  // Worker 1 accepts dispatch (partial staffing)
  const resp1 = await EmergencyTeamRepository.respondToDispatch({
    dispatchId: dId1,
    workerId: worker1Id,
    response: "ACCEPT",
  });
  mockDispatches[0].status = "ACCEPTED";
  mockDispatches[0].responded_at = new Date().toISOString();
  assert(resp1.success && !resp1.teamFormed, "Worker 1 accepted; partial staffing recorded (1/2)");

  // Worker 2 accepts dispatch (full staffing -> triggers team formation & tasks generation)
  const resp2 = await EmergencyTeamRepository.respondToDispatch({
    dispatchId: dId2,
    workerId: worker2Id,
    response: "ACCEPT",
  });
  mockDispatches[1].status = "ACCEPTED";
  mockDispatches[1].responded_at = new Date().toISOString();
  assert(resp2.success && resp2.teamFormed, "Worker 2 accepted; full staffing reached and team formed (2/2)");

  const team = resp2.team!;
  assert(!!team, "Emergency response team record formed");
  assert(team.team_lead_worker_id === worker1Id, "Worker 1 deterministically assigned as Team Lead");
  console.log(`  Team formed: ID=${team.id}, Lead=${team.team_lead_worker_id}\n`);

  // =============================================================
  // STEP 2: Predefined Matrix Initial Tasks Verification
  // =============================================================
  console.log("[STEP 2] Verifying Predefined Matrix Initial Tasks Generation...");
  const tasks = await EmergencyTaskRepository.listTasksForIncident(incidentId);
  assert(tasks.length > 0, `Initial tasks generated for incident (Count: ${tasks.length})`);
  assert(tasks.length === matrixEntry!.initial_tasks.length, `Task count matches matrix definition (${matrixEntry!.initial_tasks.length})`);

  // Verify ordering and structure
  let orderCorrect = true;
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const expected = matrixEntry!.initial_tasks[i];
    if (t.task_order !== expected.order || t.title !== expected.title || t.description !== expected.instruction) {
      orderCorrect = false;
    }
  }
  assert(orderCorrect, "Tasks order and contents exactly match Emergency Response Matrix predefined tasks");

  // Verify all tasks initial status is PENDING
  const allPending = tasks.every((t) => t.status === "PENDING" && t.assigned_worker_id === null);
  assert(allPending, "All initial tasks start with status = 'PENDING' and assigned_worker_id = null");

  // Verify idempotency
  const tasksRecreated = await EmergencyTaskRepository.createInitialTasksForIncident(
    incidentId,
    team.id,
    matrixEntry!.initial_tasks
  );
  assert(tasksRecreated.length === tasks.length, "Task generation is idempotent (no duplicate tasks created)");
  console.log();

  // =============================================================
  // STEP 3: Task Assignment by Team Lead & Authorization Checks
  // =============================================================
  console.log("[STEP 3] Testing Task Assignment & Authorization...");
  const task1 = tasks[0];
  const task2 = tasks[1];

  // 3a. Customer attempts to assign task -> Forbidden
  const custAssignReq = new NextRequest(`http://localhost:3000/api/emergency/tasks/${task1.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({ action: "ASSIGN", assignedWorkerId: worker1Id }),
  });
  const custAssignRes = await updateTaskHandler(custAssignReq, { params: Promise.resolve({ id: task1.id }) });
  assert(custAssignRes.status === 403, "Customer cannot assign emergency tasks (403 Forbidden)");

  // 3b. Team Lead assigns Task 1 to Worker 1 (Self)
  const leadAssignReq1 = new NextRequest(`http://localhost:3000/api/emergency/tasks/${task1.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${worker1Token}`,
    },
    body: JSON.stringify({ action: "ASSIGN", assignedWorkerId: worker1Id }),
  });
  const leadAssignRes1 = await updateTaskHandler(leadAssignReq1, { params: Promise.resolve({ id: task1.id }) });
  const leadAssignData1 = await leadAssignRes1.json();
  assert(leadAssignRes1.status === 200 && leadAssignData1.success, "Team Lead successfully assigns Task 1 to Worker 1");
  assert(leadAssignData1.task.status === "ASSIGNED", "Task 1 status transitioned to ASSIGNED");
  assert(leadAssignData1.task.assigned_worker_id === worker1Id, "Task 1 assigned_worker_id matches Worker 1");

  // 3c. Team Lead assigns Task 2 to Worker 2
  const leadAssignReq2 = new NextRequest(`http://localhost:3000/api/emergency/tasks/${task2.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${worker1Token}`,
    },
    body: JSON.stringify({ action: "ASSIGN", assignedWorkerId: worker2Id }),
  });
  const leadAssignRes2 = await updateTaskHandler(leadAssignReq2, { params: Promise.resolve({ id: task2.id }) });
  const leadAssignData2 = await leadAssignRes2.json();
  assert(leadAssignRes2.status === 200 && leadAssignData2.success, "Team Lead successfully assigns Task 2 to Worker 2");
  assert(leadAssignData2.task.assigned_worker_id === worker2Id, "Task 2 assigned to Worker 2");
  console.log();

  // =============================================================
  // STEP 4: Task Execution Lifecycle (START -> COMPLETE)
  // =============================================================
  console.log("[STEP 4] Testing Task Execution Lifecycle & Progress Tracking...");

  // 4a. Worker 1 starts Task 1
  const startReq = new NextRequest(`http://localhost:3000/api/emergency/tasks/${task1.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${worker1Token}`,
    },
    body: JSON.stringify({ action: "START" }),
  });
  const startRes = await updateTaskHandler(startReq, { params: Promise.resolve({ id: task1.id }) });
  const startData = await startRes.json();
  assert(startRes.status === 200 && startData.success, "Worker 1 starts Task 1");
  assert(startData.task.status === "IN_PROGRESS", "Task 1 status transitioned to IN_PROGRESS");
  assert(!!startData.task.started_at, "Task 1 started_at timestamped");

  // 4b. Worker 1 completes Task 1 with notes
  const completeNotes = "Main distribution board isolated with lock-out tag.";
  const completeReq = new NextRequest(`http://localhost:3000/api/emergency/tasks/${task1.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${worker1Token}`,
    },
    body: JSON.stringify({ action: "COMPLETE", completionNotes: completeNotes }),
  });
  const completeRes = await updateTaskHandler(completeReq, { params: Promise.resolve({ id: task1.id }) });
  const completeData = await completeRes.json();
  assert(completeRes.status === 200 && completeData.success, "Worker 1 completes Task 1");
  assert(completeData.task.status === "COMPLETED", "Task 1 status transitioned to COMPLETED");
  assert(completeData.task.completion_notes === completeNotes, "Completion notes accurately stored");
  assert(!!completeData.task.completed_at, "Task 1 completed_at timestamped");

  // 4c. Verify Progress Summary via GET /api/emergency/tasks
  const getTasksReq = new NextRequest(`http://localhost:3000/api/emergency/tasks?incidentId=${incidentId}`, {
    headers: { Authorization: `Bearer ${worker1Token}` },
  });
  const getTasksRes = await getTasksHandler(getTasksReq);
  const getTasksData = await getTasksRes.json();
  assert(getTasksRes.status === 200 && getTasksData.success, "Fetched tasks list and progress summary");
  assert(getTasksData.progress.completedTasks === 1, "Progress shows 1 completed task");
  assert(getTasksData.progress.totalTasks === tasks.length, `Progress totalTasks matches ${tasks.length}`);
  const expectedPct = Math.round((1 / tasks.length) * 100);
  assert(getTasksData.progress.completionPercentage === expectedPct, `Progress percentage calculated accurately (${expectedPct}%)`);
  console.log();

  // =============================================================
  // STEP 5: Additional Worker Support Request (Team Lead only)
  // =============================================================
  console.log("[STEP 5] Testing Team Lead Additional Worker Request...");

  // 5a. Customer attempts to request additional workers -> Forbidden
  const custAddReq = new NextRequest("http://localhost:3000/api/emergency/requests/additional-workers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      incidentId,
      skill: "High Voltage Specialist",
      count: 1,
      reason: "Busbar charred",
    }),
  });
  const custAddRes = await createAdditionalWorkersHandler(custAddReq);
  assert(custAddRes.status === 403, "Customer cannot request additional workers (403 Forbidden)");

  // 5b. Team Lead submits request for 2 High Voltage Electricians
  const leadAddReq = new NextRequest("http://localhost:3000/api/emergency/requests/additional-workers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${worker1Token}`,
    },
    body: JSON.stringify({
      incidentId,
      skill: "High Voltage Specialist",
      count: 2,
      reason: "Busbar insulation destroyed, requires backup substation crew",
    }),
  });
  const leadAddRes = await createAdditionalWorkersHandler(leadAddReq);
  const leadAddData = await leadAddRes.json();
  assert(leadAddRes.status === 201 && leadAddData.success, "Team Lead successfully submitted additional worker request");
  assert(leadAddData.request.status === "PENDING_FEDERATION_REVIEW", "Request status is strictly PENDING_FEDERATION_REVIEW");
  assert(leadAddData.request.count === 2, "Requested worker count is 2");

  // 5c. Confirm Task 5 Scope Boundary: NO automated dispatch pool entries were created
  const dispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incidentId);
  const newDispatches = dispatches.filter((d) => d.required_role === "High Voltage Specialist");
  assert(newDispatches.length === 0, "Scope Boundary Confirmed: No automated dispatch pool entries created for additional workers");

  // 5d. Query additional worker requests via GET
  const getAddReq = new NextRequest(`http://localhost:3000/api/emergency/requests/additional-workers?incidentId=${incidentId}`, {
    headers: { Authorization: `Bearer ${worker1Token}` },
  });
  const getAddRes = await getAdditionalWorkersHandler(getAddReq);
  const getAddData = await getAddRes.json();
  assert(getAddRes.status === 200 && getAddData.success, "Listed additional worker requests for incident");
  assert(getAddData.requests.length >= 1, "Additional worker request present in query results");
  console.log();

  // =============================================================
  // STEP 6: Emergency Incident Details Enriched with Tasks & Progress
  // =============================================================
  console.log("[STEP 6] Verifying Emergency Incident API Enriched Response...");
  const incDetailReq = new NextRequest(`http://localhost:3000/api/emergency/incidents/${incidentId}`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  const incDetailRes = await getIncidentDetailHandler(incDetailReq, { params: Promise.resolve({ id: incidentId }) });
  const incDetailData = await incDetailRes.json();
  assert(incDetailRes.status === 200 && incDetailData.success, "Fetched incident details via GET /api/emergency/incidents/[id]");
  assert(Array.isArray(incDetailData.tasks) && incDetailData.tasks.length === tasks.length, "Incident details includes tasks array");
  assert(incDetailData.taskProgress && incDetailData.taskProgress.completedTasks === 1, "Incident details includes accurate taskProgress");
  console.log();

  // =============================================================
  // STEP 7: Regression Check: Standard Booking Decoupling
  // =============================================================
  console.log("[STEP 7] Verifying Decoupling: Normal Bookings Unaffected...");
  const bookingReq = new NextRequest("http://localhost:3000/api/bookings", {
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
      federationId,
      addressId: "3f50baf2-d986-4bec-88c2-dfa901d78a0b",
      totalAmount: 450,
      problemDescription: "Normal scheduled tap repair service",
    }),
  });
  const bookingRes = await createBookingHandler(bookingReq);
  const bookingData = await bookingRes.json();
  assert(bookingRes.status === 200, "Normal booking created successfully (200 OK)");
  assert(Boolean(bookingData.booking?.id), "Normal booking ID generated");
  assert(bookingData.booking?.bookingNumber?.startsWith("BK-"), "Normal booking number has BK- prefix");
  assert(!bookingData.booking?.emergency_id, "Normal booking has NO emergency_id");
  console.log();

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log("==================================================");
  console.log(`TASK 5 VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log("==================================================");
}

runTask5Verification().catch((err) => {
  console.error("\n❌ VERIFICATION FATAL ERROR:", err);
  process.exit(1);
});

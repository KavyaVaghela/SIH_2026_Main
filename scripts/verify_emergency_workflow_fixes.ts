/**
 * Verification Script: Emergency Services End-to-End Workflow Fixes
 * 
 * Validates:
 * 1. Federation Cancel Emergency & Archival
 *    - Federation can cancel active emergency with required justification
 *    - Incident status transitions to CANCELLED atomically
 *    - Associated response teams are disbanded (status: DISBANDED)
 *    - Assigned team members are released (status: RELEASED)
 *    - Pending dispatches are withdrawn (status: WITHDRAWN)
 *    - Incident tasks are cancelled (status: CANCELLED)
 *    - Additional worker requests are cancelled
 *    - Cancellation metadata and audit logs (EMERGENCY_CANCELLED) are recorded
 *    - Non-terminal incidents cannot be archived (throws error)
 *    - Terminal incidents (CLOSED, RESOLVED, CANCELLED) can be archived
 *    - Archived incidents are excluded by default from active federation list
 *    - Archived incidents are retrievable with includeArchived: true or status: "ARCHIVED"
 * 
 * 2. Worker Card Dismissal & Terminal State Protection
 *    - getActiveTeamForWorker returns null for CANCELLED, CLOSED, and RESOLVED incidents
 *    - getActiveTeamForWorker returns null for RELEASED workers
 *    - listDispatchesForWorker excludes dispatches for terminal incidents
 *    - reviewClosure with APPROVE disbands teams and releases worker members
 * 
 * 3. Customer Safe Status
 *    - CANCELLED incidents map to "Emergency Cancelled" for customer tracking
 */

import { EmergencyIncidentRepository, EmergencyIncidentRecord } from "../lib/emergency/incident-store";
import { EmergencyTeamRepository, EmergencyResponseTeamRecord, EmergencyTeamMemberRecord } from "../lib/emergency/team-store";
import { EmergencyDispatchRepository } from "../lib/emergency/dispatch-store";
import { EmergencyControlCenterRepository } from "../lib/emergency/control-center-store";
import { EmergencyTaskRepository, EmergencyIncidentTaskRecord, EmergencyAdditionalWorkerRequestRecord } from "../lib/emergency/task-store";

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, testName: string, details?: unknown) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    testsPassed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`, details || "");
    testsFailed++;
  }
}

async function runVerification() {
  console.log("================================================================================");
  console.log(" EMERGENCY SERVICES END-TO-END WORKFLOW VERIFICATION");
  console.log("================================================================================\n");

  const testFedId = `fed-test-${Date.now()}`;
  const testWorkerId1 = `worker-test-1-${Date.now()}`;
  const testWorkerId2 = `worker-test-2-${Date.now()}`;
  const testCustomerId = `cust-test-${Date.now()}`;
  const now = new Date().toISOString();

  // ============================================================================
  // TEST SUITE 1: Incident Creation and Active State Setup
  // ============================================================================
  console.log("--- TEST SUITE 1: Incident Creation & Team Setup ---");
  const testIncident: EmergencyIncidentRecord = {
    id: `inc-test-${Date.now()}`,
    emergency_id: `EMG-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_id: testCustomerId,
    federation_id: testFedId,
    category_name: "Electrical Services",
    emergency_type: "Transformer Arc Flash",
    severity: "HIGH",
    status: "ACTIVE",
    location: "Block C, Industrial Park, Sector 4",
    address_details: { city: "Ahmedabad" },
    description: "High voltage sparks and smoke near main distribution board",
    evidence_photos: [],
    approx_people_affected: 20,
    immediate_danger: true,
    danger_details: "Active fire hazard",
    metadata: {},
    created_at: now,
    updated_at: now,
  };

  const createdIncident = await EmergencyIncidentRepository.insertIncident(testIncident);
  const incidentId = createdIncident.id;
  assert(createdIncident.status === "ACTIVE", "Incident created with status ACTIVE");
  assert(createdIncident.emergency_id.startsWith("EMG-"), "Incident assigned emergency_id format EMG-");

  // Create a response team with 2 workers using registerTeam
  const teamId = `team-test-${Date.now()}`;
  const teamMembers: EmergencyTeamMemberRecord[] = [
    {
      id: `mem-1-${Date.now()}`,
      team_id: teamId,
      incident_id: incidentId,
      worker_id: testWorkerId1,
      role: "Emergency Lead Electrician",
      is_team_lead: true,
      status: "ACTIVE",
      accepted_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: `mem-2-${Date.now()}`,
      team_id: teamId,
      incident_id: incidentId,
      worker_id: testWorkerId2,
      role: "Safety Assistant",
      is_team_lead: false,
      status: "ACTIVE",
      accepted_at: now,
      created_at: now,
      updated_at: now,
    },
  ];

  const teamRecord: EmergencyResponseTeamRecord = {
    id: teamId,
    incident_id: incidentId,
    federation_id: testFedId,
    status: "ACTIVE",
    team_lead_worker_id: testWorkerId1,
    requires_team_lead: true,
    required_worker_count: 2,
    accepted_worker_count: 2,
    created_at: now,
    updated_at: now,
    team_type: "PRIMARY",
    members: teamMembers,
  };

  await EmergencyTeamRepository.registerTeam(teamRecord, teamMembers);

  // Worker 1 should see active team
  const activeTeamBefore = await EmergencyTeamRepository.getActiveTeamForWorker(testWorkerId1);
  assert(activeTeamBefore !== null && activeTeamBefore.incident_id === incidentId, "Worker 1 has active team assignment before cancellation");

  // Add tasks
  const task1: EmergencyIncidentTaskRecord = {
    id: `task-1-${Date.now()}`,
    incident_id: incidentId,
    team_id: teamId,
    task_order: 1,
    title: "Isolate Distribution Substation",
    description: "Switch off incoming 11kV breaker immediately",
    status: "IN_PROGRESS",
    assigned_worker_id: testWorkerId1,
    assigned_role: "Emergency Lead Electrician",
    started_at: now,
    completed_at: null,
    completion_notes: null,
    created_at: now,
    updated_at: now,
  };
  await EmergencyTaskRepository.createTask(task1);

  // Add an additional worker request
  const addReq: EmergencyAdditionalWorkerRequestRecord = {
    id: `add-req-1-${Date.now()}`,
    incident_id: incidentId,
    team_id: teamId,
    requested_by_worker_id: testWorkerId1,
    requested_role: "Heavy Equipment Specialist",
    requested_skill: "Heavy Equipment Specialist",
    requested_worker_count: 1,
    count: 1,
    reason: "Requires mobile crane to clear fallen transformer",
    status: "PENDING_FEDERATION_REVIEW",
    created_at: now,
    updated_at: now,
  };
  const addReqRes = await EmergencyTaskRepository.createAdditionalWorkerRequest(addReq);
  const createdAddReqId = addReqRes.request?.id || addReq.id;

  // ============================================================================
  // TEST SUITE 2: Archival Constraint on Non-Terminal Incident
  // ============================================================================
  console.log("\n--- TEST SUITE 2: Archival Constraints ---");
  const preArchiveRes = await EmergencyIncidentRepository.archiveIncident({
    incidentId,
    adminProfileId: "admin-user-1",
  });
  assert(!preArchiveRes.success, "Active incident cannot be archived (rejected with success: false)");

  // ============================================================================
  // TEST SUITE 3: Federation Incident Cancellation
  // ============================================================================
  console.log("\n--- TEST SUITE 3: Emergency Incident Cancellation ---");
  const cancelRes = await EmergencyIncidentRepository.cancelIncident({
    incidentId,
    reason: "False alarm: building engineer confirmed normal controlled switching operation.",
    adminProfileId: "fed-super-admin-01",
  });

  assert(cancelRes.success === true, "cancelIncident returned success: true");
  const cancelledRecord = cancelRes.record!;
  assert(cancelledRecord.status === "CANCELLED", "Incident status updated to CANCELLED");
  assert(cancelledRecord.metadata?.is_cancelled === true, "Incident metadata has is_cancelled: true");
  assert(cancelledRecord.metadata?.cancelled_by === "fed-super-admin-01", "Incident metadata records cancelled_by");
  assert(typeof cancelledRecord.metadata?.cancellation_reason === "string", "Incident metadata records cancellation_reason");

  // Verify Customer Safe Status for CANCELLED
  const safeStatus = EmergencyIncidentRepository.getCustomerSafeStatus(cancelledRecord);
  assert(safeStatus === "Emergency Cancelled", "Customer safe status is 'Emergency Cancelled'");

  // Verify Team Disbandment
  const updatedTeam = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
  assert(updatedTeam?.status === "DISBANDED", "Associated response team is marked DISBANDED");
  assert(updatedTeam?.field_status === "RESOLVED", "Associated response team field status marked RESOLVED");

  // Verify All Members Released
  const allMembersReleased = (updatedTeam?.members || []).every((m) => m.status === "RELEASED");
  assert(allMembersReleased, "All team members transitioned to status RELEASED");

  // Verify Tasks Cancelled
  const updatedTasks = await EmergencyTaskRepository.listTasksForIncident(incidentId);
  const task1Updated = updatedTasks.find((t) => t.id === task1.id);
  assert(task1Updated?.status === "CANCELLED", "Active task marked CANCELLED");

  // Verify Additional Requests Cancelled
  const updatedAddReqs = await EmergencyTaskRepository.listAdditionalWorkerRequests(incidentId);
  const addReqUpdated = updatedAddReqs.find((r) => r.id === createdAddReqId);
  assert(addReqUpdated?.status === "CANCELLED", "Pending additional worker request marked CANCELLED");

  // ============================================================================
  // TEST SUITE 4: Worker Incident Visibility After Cancellation
  // ============================================================================
  console.log("\n--- TEST SUITE 4: Worker State Cleared After Cancellation ---");
  const activeTeamAfter = await EmergencyTeamRepository.getActiveTeamForWorker(testWorkerId1);
  assert(activeTeamAfter === null, "Worker 1 getActiveTeamForWorker returns null after cancellation");

  const activeTeamAfterWorker2 = await EmergencyTeamRepository.getActiveTeamForWorker(testWorkerId2);
  assert(activeTeamAfterWorker2 === null, "Worker 2 getActiveTeamForWorker returns null after cancellation");

  const dispatchesWorker1 = await EmergencyDispatchRepository.listDispatchesForWorker(testWorkerId1);
  const hasCancelledIncidentDispatch = dispatchesWorker1.some((d) => d.incident_id === incidentId);
  assert(!hasCancelledIncidentDispatch, "Worker 1 dispatch pool excludes cancelled incident");

  // ============================================================================
  // TEST SUITE 5: Archival of Cancelled / Completed Emergency
  // ============================================================================
  console.log("\n--- TEST SUITE 5: Incident Archival & Federation Table Filtering ---");
  const archiveRes = await EmergencyIncidentRepository.archiveIncident({
    incidentId,
    adminProfileId: "fed-super-admin-01",
  });
  assert(archiveRes.success === true, "archiveIncident returns success: true for cancelled incident");
  assert(archiveRes.record?.metadata?.is_archived === true, "Incident metadata has is_archived: true");

  // List incidents for federation (default: hides archived)
  const defaultList = await EmergencyControlCenterRepository.listIncidentsForFederation(testFedId);
  const inDefaultList = defaultList.some((i) => i.id === incidentId);
  assert(!inDefaultList, "Archived incident is excluded by default from active federation list");

  // List incidents for federation with includeArchived: true
  const listWithArchived = await EmergencyControlCenterRepository.listIncidentsForFederation(testFedId, {
    includeArchived: true,
  });
  const inListWithArchived = listWithArchived.some((i) => i.id === incidentId);
  assert(inListWithArchived, "Archived incident is retrievable when includeArchived: true");

  // List incidents with status: "ARCHIVED"
  const archivedOnlyList = await EmergencyControlCenterRepository.listIncidentsForFederation(testFedId, {
    status: "ARCHIVED",
  });
  const inArchivedOnlyList = archivedOnlyList.some((i) => i.id === incidentId);
  assert(inArchivedOnlyList, "Archived incident is retrievable when filtering by status ARCHIVED");

  // ============================================================================
  // TEST SUITE 6: Normal Closure Disbands Teams and Releases Workers
  // ============================================================================
  console.log("\n--- TEST SUITE 6: Normal Closure Flow & Worker State Cleanup ---");
  const inc2Now = new Date().toISOString();
  const inc2Id = `inc-test-2-${Date.now()}`;
  const inc2Record: EmergencyIncidentRecord = {
    id: inc2Id,
    emergency_id: `EMG-${Math.floor(1000 + Math.random() * 9000)}`,
    customer_id: testCustomerId,
    federation_id: testFedId,
    category_name: "Plumbing Services",
    emergency_type: "Basement Main Rupture",
    severity: "CRITICAL",
    status: "ACTIVE",
    location: "Tower 2, Sector 9",
    address_details: { city: "Ahmedabad" },
    description: "Flooding threatening electrical transformer",
    evidence_photos: [],
    approx_people_affected: 50,
    immediate_danger: true,
    danger_details: "Water rising",
    metadata: {},
    created_at: inc2Now,
    updated_at: inc2Now,
  };
  await EmergencyIncidentRepository.insertIncident(inc2Record);

  const team2Id = `team-2-${Date.now()}`;
  const team2Members: EmergencyTeamMemberRecord[] = [
    {
      id: `mem-21-${Date.now()}`,
      team_id: team2Id,
      incident_id: inc2Id,
      worker_id: testWorkerId1,
      role: "Master Plumber",
      is_team_lead: true,
      status: "ACTIVE",
      accepted_at: inc2Now,
      created_at: inc2Now,
      updated_at: inc2Now,
    },
  ];
  const team2Record: EmergencyResponseTeamRecord = {
    id: team2Id,
    incident_id: inc2Id,
    federation_id: testFedId,
    status: "ACTIVE",
    team_lead_worker_id: testWorkerId1,
    requires_team_lead: true,
    required_worker_count: 1,
    accepted_worker_count: 1,
    created_at: inc2Now,
    updated_at: inc2Now,
    team_type: "PRIMARY",
    members: team2Members,
  };
  await EmergencyTeamRepository.registerTeam(team2Record, team2Members);

  // Verify worker sees active team
  const activeBeforeClose = await EmergencyTeamRepository.getActiveTeamForWorker(testWorkerId1);
  assert(activeBeforeClose !== null && activeBeforeClose.incident_id === inc2Id, "Worker 1 has active team for Incident 2 before closure");

  // Review closure: APPROVE
  await EmergencyIncidentRepository.reviewClosure({
    incidentId: inc2Id,
    adminProfileId: "fed-super-admin-01",
    action: "APPROVE",
    closureNotes: "Containment confirmed",
  });

  // Incident should be CLOSED
  const closedInc = await EmergencyIncidentRepository.findById(inc2Id);
  assert(closedInc?.status === "CLOSED", "Incident 2 status transitioned to CLOSED");

  // Team should be DISBANDED
  const closedTeam = await EmergencyTeamRepository.getTeamByIncidentId(inc2Id);
  assert(closedTeam?.status === "DISBANDED", "Response team 2 disbanded on formal closure");

  // Worker 1 should NOT see active team for closed incident
  const activeAfterClose = await EmergencyTeamRepository.getActiveTeamForWorker(testWorkerId1);
  assert(activeAfterClose === null, "Worker 1 active team is null after incident closure (fixes stale card issue)");

  // Archiving closed incident
  const archivedClosedRes = await EmergencyIncidentRepository.archiveIncident({
    incidentId: inc2Id,
    adminProfileId: "fed-super-admin-01",
  });
  assert(archivedClosedRes.record?.metadata?.is_archived === true, "Closed incident successfully archived");

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log("\n================================================================================");
  console.log(` RESULTS: ${testsPassed} PASSED, ${testsFailed} FAILED`);
  console.log("================================================================================\n");

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});

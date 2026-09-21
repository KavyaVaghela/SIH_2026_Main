import { NextRequest, NextResponse } from "next/server";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { EmergencyDispatchRepository } from "@/lib/emergency/dispatch-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { EmergencyTaskRepository } from "@/lib/emergency/task-store";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import type { EmergencyIncidentStatus } from "@/supabase/types/database.types";

export async function GET(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: any }
) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    if (!id) {
      return NextResponse.json({ error: "Incident ID is required." }, { status: 400 });
    }

    // 1. Authenticate caller strictly via Supabase session
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: An active authenticated session is required." },
        { status: 401 }
      );
    }

    const incident = await EmergencyIncidentRepository.findById(id);
    if (!incident) {
      return NextResponse.json({ error: "Emergency incident not found." }, { status: 404 });
    }

    // 2. Customer Scoping Check: Customer A cannot view Customer B's incident
    if (authUser.role === "CUSTOMER" && incident.customer_id !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view this emergency incident." },
        { status: 403 }
      );
    }

    const [matrix, dispatches, team, tasks] = await Promise.all([
      EmergencyIncidentRepository.getIncidentResponseMatrix(incident.id),
      EmergencyDispatchRepository.listDispatchesForIncident(incident.id),
      EmergencyTeamRepository.getTeamByIncidentId(incident.id),
      EmergencyTaskRepository.listTasksForIncident(incident.id),
    ]);
    const taskProgress = tasks.length > 0 ? await EmergencyTaskRepository.calculateProgress(incident.id) : null;

    // Task 8: Verification details
    const { EmergencyVerificationRepository } = await import("@/lib/emergency/verification-store");
    let verification = await EmergencyVerificationRepository.getVerificationByIncidentId(incident.id);
    if (!verification && incident.status !== "CLOSED") {
      verification = await EmergencyVerificationRepository.generateVerification(incident.id, team?.id);
    }

    const customerSafeStatus = EmergencyIncidentRepository.getCustomerSafeStatus(incident, team);
    const isCustomer = authUser.role === "CUSTOMER";

    // Privacy Sanitization for Customers:
    // Do NOT expose worker private info, phone numbers, or internal dispatch candidate pools
    let safeTeam = null;
    if (team) {
      if (isCustomer) {
        safeTeam = {
          id: team.id,
          status: team.status,
          fieldStatus: team.field_status || "DISPATCHED",
          requiredWorkerCount: team.required_worker_count,
          acceptedWorkerCount: team.accepted_worker_count,
          members: (team.members || []).map((m) => ({
            id: m.id,
            role: m.role,
            isTeamLead: m.is_team_lead,
            status: m.status,
            workerName: m.worker_name || (m.is_team_lead ? "Response Lead" : "Response Technician"),
          })),
        };
      } else {
        safeTeam = team;
      }
    }

    return NextResponse.json({
      success: true,
      incident: {
        id: incident.id,
        emergencyId: incident.emergency_id,
        customerId: incident.customer_id,
        federationId: incident.federation_id,
        categoryName: incident.category_name,
        emergencyType: incident.emergency_type,
        responseMatrixCode: incident.response_matrix_code || null,
        severity: incident.severity,
        status: incident.status,
        customerSafeStatus,
        location: incident.location,
        addressDetails: incident.address_details,
        description: incident.description,
        evidencePhotos: incident.evidence_photos,
        approxPeopleAffected: incident.approx_people_affected,
        immediateDanger: incident.immediate_danger,
        dangerDetails: incident.danger_details,
        isVerified: incident.is_verified || verification?.status === "VERIFIED",
        verifiedAt: incident.verified_at || verification?.verified_at,
        verificationCode: verification?.verification_code,
        resolutionSummary: incident.resolution_summary,
        completedWork: incident.completed_work,
        remainingConcerns: incident.remaining_concerns,
        resolutionEvidencePhotos: incident.resolution_evidence_photos,
        resolvedAt: incident.resolved_at,
        closedAt: incident.closed_at,
        closureNotes: incident.closure_notes,
        createdAt: incident.created_at,
        updatedAt: incident.updated_at,
      },
      responseMatrix: matrix,
      dispatchPool: isCustomer ? null : dispatches,
      team: safeTeam,
      tasks: isCustomer
        ? tasks.map((t) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            taskOrder: t.task_order,
          }))
        : tasks,
      taskProgress,
      verification: verification
        ? {
            id: verification.id,
            verificationCode: verification.verification_code,
            verificationToken: verification.verification_token,
            status: verification.status,
            isVerified: verification.status === "VERIFIED",
            verifiedAt: verification.verified_at,
            expiresAt: verification.expires_at,
          }
        : null,
      tracking: {
        customerSafeStatus,
        isVerified: incident.is_verified || verification?.status === "VERIFIED",
        verificationCode: verification?.verification_code,
        verificationToken: verification?.verification_token,
        teamFieldStatus: team?.field_status || "DISPATCHED",
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.status === "COMPLETED").length,
        progressPercentage:
          incident.status === "CLOSED"
            ? 100
            : incident.status === "RESOLVED"
            ? 80
            : (incident.is_verified || verification?.status === "VERIFIED" || team?.field_status === "ON_SITE" || team?.field_status === "WORK_IN_PROGRESS")
            ? 60
            : (team || incident.status === "ACTIVE")
            ? 40
            : 20,
        paymentNotice: "Covered under Cooperative Emergency Assistance Protocol (₹0 Immediate Charge)",
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/incidents/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: { params: any }
) {
  try {
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    // 1. Authenticate caller strictly via Supabase session
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: An active authenticated session is required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Explicitly delete any client-supplied role or customer identity overrides
    delete (body as Record<string, unknown>).role;
    delete (body as Record<string, unknown>).customerId;
    delete (body as Record<string, unknown>).customer_id;

    // 2. Customers are STRICTLY prohibited from updating incident status
    if (authUser.role === "CUSTOMER") {
      return NextResponse.json(
        {
          error: "Forbidden: Customers cannot directly change incident status.",
        },
        { status: 403 }
      );
    }

    const { status } = body;
    if (!status) {
      return NextResponse.json({ error: "No update fields provided." }, { status: 400 });
    }

    const result = await EmergencyIncidentRepository.updateIncidentStatus(
      id,
      status as EmergencyIncidentStatus,
      authUser.role
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, incident: result.record });
  } catch (err: unknown) {
    console.error("PATCH /api/emergency/incidents/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

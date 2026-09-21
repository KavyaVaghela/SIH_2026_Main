import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyTeamRepository, EmergencyTeamFieldStatus } from "@/lib/emergency/team-store";
import { EmergencyControlCenterRepository } from "@/lib/emergency/control-center-store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    const { id: teamId } = await context.params;
    if (!teamId) {
      return NextResponse.json(
        { error: "Team ID parameter is required." },
        { status: 400 }
      );
    }

    const team = await EmergencyTeamRepository.getTeamById(teamId);
    if (!team) {
      return NextResponse.json(
        { error: "Emergency response team not found." },
        { status: 404 }
      );
    }

    // Role check: Caller must be Team Lead or Federation Admin
    let isAuthorized = false;
    const workerProfileId = authUser.id;

    if (authUser.role === "WORKER") {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workerRec } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", authUser.id)
        .maybeSingle();

      const workerId = workerRec?.id;
      // Allow Team Lead or any assigned member if no team lead designated
      if (team.team_lead_worker_id) {
        isAuthorized = team.team_lead_worker_id === workerId;
      } else {
        isAuthorized = (team.members || []).some((m) => m.worker_id === workerId);
      }
    } else if (authUser.role === "FEDERATION_ADMIN" || authUser.role === "SUPER_ADMIN") {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Forbidden: Only the designated Team Lead or Federation Admin may update team field status." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { fieldStatus } = body;

    const validStatuses: EmergencyTeamFieldStatus[] = [
      "DISPATCHED",
      "ARRIVING",
      "ON_SITE",
      "WORK_IN_PROGRESS",
      "AWAITING_SUPPORT",
      "READY_FOR_RESOLUTION",
      "RESOLVED",
    ];

    if (!fieldStatus || !validStatuses.includes(fieldStatus)) {
      return NextResponse.json(
        { error: `Invalid fieldStatus. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const previousStatus = team.field_status || "DISPATCHED";
    const updatedTeam = await EmergencyTeamRepository.updateFieldStatus(teamId, fieldStatus);

    // Audit log
    try {
      if (team.federation_id) {
        await EmergencyControlCenterRepository.createAuditLog({
          incidentId: team.incident_id,
          federationId: team.federation_id,
          actorId: workerProfileId,
          actionType: "TEAM_FIELD_STATUS_UPDATED",
          previousState: { field_status: previousStatus },
          newState: { field_status: fieldStatus },
          notes: `Team field status changed to ${fieldStatus}.`,
        });
      }
    } catch {
      // Audit log resilient
    }

    return NextResponse.json({
      success: true,
      message: `Team field status updated to ${fieldStatus}.`,
      team: updatedTeam,
    });
  } catch (err: unknown) {
    console.error("PATCH /api/emergency/teams/[id]/field-status error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

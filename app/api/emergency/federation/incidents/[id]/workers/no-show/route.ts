import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { EmergencyScalingRepository } from "@/lib/emergency/scaling-store";

export async function POST(
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

    const { id: incidentId } = await context.params;
    if (!incidentId) {
      return NextResponse.json({ error: "Incident ID is required." }, { status: 400 });
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json({ error: "Emergency incident not found." }, { status: 404 });
    }

    const body = await request.json();
    const { teamId, workerId, reason } = body;

    if (!teamId || !workerId) {
      return NextResponse.json(
        { error: "Both teamId and workerId are required." },
        { status: 400 }
      );
    }

    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "A specific justification reason is required (minimum 5 characters)." },
        { status: 400 }
      );
    }

    // Authorization: Federation Admin of the incident or Team Lead of the team
    const isSuperAdmin = authUser.role === "SUPER_ADMIN";
    const isFedAdmin = authUser.role === "FEDERATION_ADMIN" && authUser.federationId === incident.federation_id;
    let isTeamLead = false;

    if (authUser.role === "WORKER") {
      const team = await EmergencyTeamRepository.getTeamById(teamId);
      if (team && team.team_lead_worker_id === authUser.id) {
        isTeamLead = true;
      }
    }

    if (!isSuperAdmin && !isFedAdmin && !isTeamLead) {
      return NextResponse.json(
        { error: "Forbidden: Only Federation Administrators or Team Leads can report worker no-shows." },
        { status: 403 }
      );
    }

    const result = await EmergencyScalingRepository.reportWorkerNoShow({
      incidentId,
      teamId,
      workerId,
      reason: reason.trim(),
      actorId: authUser.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to report no-show." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      member: result.member,
      replacementDispatch: result.replacementDispatch,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/federation/incidents/[id]/workers/no-show error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

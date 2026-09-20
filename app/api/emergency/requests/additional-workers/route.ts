import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyTaskRepository } from "@/lib/emergency/task-store";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get("incidentId");

    if (!incidentId) {
      return NextResponse.json(
        { error: "incidentId query parameter is required." },
        { status: 400 }
      );
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json(
        { error: "Emergency incident not found." },
        { status: 404 }
      );
    }

    // Role check: Worker must be a team member, or Customer/Admin
    if (authUser.role === "WORKER") {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workerRec } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", authUser.id)
        .maybeSingle();

      const team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
      const isMember = (team?.members || []).some((m) => m.worker_id === workerRec?.id);
      if (!isMember) {
        return NextResponse.json(
          { error: "Forbidden: Only assigned team members may view worker requests." },
          { status: 403 }
        );
      }
    }

    const requests = await EmergencyTaskRepository.listAdditionalWorkerRequests(incidentId);

    return NextResponse.json({
      success: true,
      incidentId,
      requests,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/requests/additional-workers error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    if (authUser.role !== "WORKER" && authUser.role !== "FEDERATION_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Team Leads or Federation Admins can request additional workers." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { incidentId, skill, count = 1, reason } = body;

    if (!incidentId || !skill || !reason) {
      return NextResponse.json(
        { error: "incidentId, skill, and reason are required fields." },
        { status: 400 }
      );
    }

    if (typeof count !== "number" || count < 1) {
      return NextResponse.json(
        { error: "count must be a positive number." },
        { status: 400 }
      );
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json(
        { error: "Emergency incident not found." },
        { status: 404 }
      );
    }

    const teams = await EmergencyTeamRepository.listTeamsForIncident(incidentId);
    let team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
    if (!team && teams.length > 0) {
      team = teams[0];
    }
    if (!team) {
      return NextResponse.json(
        { error: "No response team found for this incident." },
        { status: 404 }
      );
    }

    let requesterWorkerId = authUser.id;
    if (authUser.role === "WORKER") {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workerRec } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", authUser.id)
        .maybeSingle();

      if (!workerRec) {
        return NextResponse.json(
          { error: "Worker profile not found." },
          { status: 404 }
        );
      }

      // Check that the worker is the designated Team Lead on a team for this incident
      const leadTeam = teams.find((t) => t.team_lead_worker_id === workerRec.id);
      if (!leadTeam && team.team_lead_worker_id !== workerRec.id) {
        return NextResponse.json(
          { error: "Forbidden: Only the designated Team Lead can request additional workers." },
          { status: 403 }
        );
      }
      if (leadTeam) {
        team = leadTeam;
      }
      requesterWorkerId = workerRec.id;
    }

    const result = await EmergencyTaskRepository.createAdditionalWorkerRequest({
      incidentId,
      teamId: team.id,
      requestedByWorkerId: requesterWorkerId,
      requestedSkill: skill,
      requestedRole: skill,
      requestedWorkerCount: count,
      reason,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create additional worker request." },
        { status: result.code || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Additional worker request submitted and awaiting Federation review.",
      request: result.request,
    }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/emergency/requests/additional-workers error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { createAdminClient } from "@/lib/supabase/admin";

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
      return NextResponse.json(
        { error: "Incident ID is required." },
        { status: 400 }
      );
    }

    if (authUser.role !== "WORKER" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only authorized field responders can request incident resolution." },
        { status: 403 }
      );
    }

    // Resolve worker ID
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: workerRec } = await (supabase.from("workers") as any)
      .select("id")
      .eq("profile_id", authUser.id)
      .maybeSingle();

    if (!workerRec && authUser.role === "WORKER") {
      return NextResponse.json(
        { error: "Worker profile not found." },
        { status: 404 }
      );
    }

    const workerId = workerRec?.id || authUser.id;

    const team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
    if (!team) {
      return NextResponse.json(
        { error: "No response team found for this incident." },
        { status: 400 }
      );
    }

    // Team Lead verification check: if team has designated lead, only lead can request resolution
    if (team.team_lead_worker_id && team.team_lead_worker_id !== workerId && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only the designated Team Lead can request incident resolution." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { resolutionSummary, completedWork, remainingConcerns, resolutionEvidencePhotos } = body;

    if (!resolutionSummary || !completedWork) {
      return NextResponse.json(
        { error: "resolutionSummary and completedWork are required." },
        { status: 400 }
      );
    }

    const result = await EmergencyIncidentRepository.requestResolution({
      incidentId,
      workerId,
      resolutionSummary,
      completedWork,
      remainingConcerns,
      resolutionEvidencePhotos,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Incident resolution requested successfully. Awaiting federation review and closure.",
      incident: result.record,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/incidents/[id]/resolve error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

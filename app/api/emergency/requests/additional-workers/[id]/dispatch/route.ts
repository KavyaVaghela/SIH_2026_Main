import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
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

    if (authUser.role !== "FEDERATION_ADMIN" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to Federation Administrators." },
        { status: 403 }
      );
    }

    const { id: requestId } = await context.params;
    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required." }, { status: 400 });
    }

    const body = await request.json();
    const { incidentId } = body;

    if (!incidentId) {
      return NextResponse.json({ error: "incidentId is required in request body." }, { status: 400 });
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json({ error: "Emergency incident not found." }, { status: 404 });
    }

    if (authUser.role !== "SUPER_ADMIN" && incident.federation_id !== authUser.federationId) {
      return NextResponse.json(
        { error: "Forbidden: Incident belongs to another federation." },
        { status: 403 }
      );
    }

    const result = await EmergencyScalingRepository.dispatchApprovedAdditionalWorkers({
      requestId,
      incidentId,
      actorId: authUser.id,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to dispatch workers." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      dispatchedCount: result.dispatchedCount,
      dispatches: result.dispatches,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/requests/additional-workers/[id]/dispatch error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

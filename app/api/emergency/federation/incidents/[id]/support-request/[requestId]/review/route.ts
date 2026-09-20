import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { EmergencyScalingRepository } from "@/lib/emergency/scaling-store";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string; requestId: string }> }
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

    const { id: incidentId, requestId } = await context.params;
    if (!incidentId || !requestId) {
      return NextResponse.json(
        { error: "Both incident ID and support request ID are required." },
        { status: 400 }
      );
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json({ error: "Emergency incident not found." }, { status: 404 });
    }

    const body = await request.json();
    const { action, adminNotes } = body;

    if (action !== "ACCEPT" && action !== "DECLINE") {
      return NextResponse.json(
        { error: "Action must be either ACCEPT or DECLINE." },
        { status: 400 }
      );
    }

    const targetFederationId = authUser.federationId || "";

    const result = await EmergencyScalingRepository.reviewCrossFederationSupportRequest({
      requestId,
      targetFederationAdminId: authUser.id,
      targetFederationId,
      action,
      adminNotes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to review support request." },
        { status: result.error?.includes("Forbidden") ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      request: result.request,
      supportTeam: result.supportTeam,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/federation/incidents/[id]/support-request/[requestId]/review error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

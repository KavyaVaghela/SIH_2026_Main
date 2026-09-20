import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyControlCenterRepository } from "@/lib/emergency/control-center-store";

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

    const { id: incidentId } = await context.params;
    if (!incidentId) {
      return NextResponse.json(
        { error: "Incident ID is required." },
        { status: 400 }
      );
    }

    const federationId = authUser.federationId;
    if (!federationId) {
      return NextResponse.json(
        { error: "No federation association identified for current administrator." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      requestType = "ADDITIONAL_TEAM",
      targetFederationId,
      requestedRoles = [],
      requestedWorkerCount = 1,
      reason,
      adminNotes,
    } = body;

    if (!reason || reason.trim().length < 5) {
      return NextResponse.json(
        { error: "A clear operational justification reason is required (minimum 5 characters)." },
        { status: 400 }
      );
    }

    const result = await EmergencyControlCenterRepository.createSupportRequest({
      incidentId,
      requestingFederationId: federationId,
      requestedByAdminId: authUser.id,
      requestType,
      targetFederationId,
      requestedRoles,
      requestedWorkerCount: Number(requestedWorkerCount) || 1,
      reason,
      adminNotes,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code });
    }

    return NextResponse.json({
      success: true,
      message: "Emergency support request logged and awaiting operational review.",
      request: result.request,
    }, { status: 201 });
  } catch (err: unknown) {
    console.error("POST /api/emergency/federation/incidents/[id]/support-request error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

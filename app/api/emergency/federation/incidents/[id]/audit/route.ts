import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyControlCenterRepository } from "@/lib/emergency/control-center-store";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";

export async function GET(
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

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json(
        { error: "Emergency incident not found." },
        { status: 404 }
      );
    }

    if (authUser.role !== "SUPER_ADMIN" && incident.federation_id !== authUser.federationId) {
      return NextResponse.json(
        { error: "Forbidden: Incident belongs to another federation." },
        { status: 403 }
      );
    }

    const logs = await EmergencyControlCenterRepository.listAuditLogs(incidentId);

    return NextResponse.json({
      success: true,
      incidentId,
      logs,
      total: logs.length,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/federation/incidents/[id]/audit error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

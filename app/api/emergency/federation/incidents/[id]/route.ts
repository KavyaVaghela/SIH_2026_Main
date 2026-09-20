import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyControlCenterRepository } from "@/lib/emergency/control-center-store";

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

    const isSuperAdmin = authUser.role === "SUPER_ADMIN";
    const federationId = authUser.federationId || "";

    const detail = await EmergencyControlCenterRepository.getIncidentControlDetail({
      incidentId,
      federationId,
      isSuperAdmin,
    });

    if (!detail) {
      return NextResponse.json(
        { error: "Emergency incident not found or outside administrative authority." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ...detail,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/federation/incidents/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

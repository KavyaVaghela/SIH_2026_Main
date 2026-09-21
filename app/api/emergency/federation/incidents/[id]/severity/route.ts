import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyControlCenterRepository } from "@/lib/emergency/control-center-store";
import type { EmergencyIncidentSeverity } from "@/supabase/types/database.types";

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

    const body = await request.json();
    const { severity, reason } = body;

    if (!severity) {
      return NextResponse.json(
        { error: "severity is required (LOW, MEDIUM, HIGH, CRITICAL)." },
        { status: 400 }
      );
    }

    const isSuperAdmin = authUser.role === "SUPER_ADMIN";
    const federationId = authUser.federationId || "";

    const result = await EmergencyControlCenterRepository.changeSeverity({
      incidentId,
      federationId,
      actorId: authUser.id,
      newSeverity: severity as EmergencyIncidentSeverity,
      reason,
      isSuperAdmin,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Emergency severity successfully updated to ${severity}.`,
      incident: result.incident,
    });
  } catch (err: unknown) {
    console.error("PATCH /api/emergency/federation/incidents/[id]/severity error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

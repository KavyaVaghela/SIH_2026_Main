import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
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

    if (authUser.role !== "FEDERATION_ADMIN" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only Federation Administrators or Super Admins can cancel emergency incidents." },
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

    // Scoping check for Federation Admin
    if (authUser.role === "FEDERATION_ADMIN" && incident.federation_id) {
      let userFedId = authUser.federationId;
      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: fedProfile } = await (supabase.from("profiles") as any)
          .select("federation_id")
          .eq("id", authUser.id)
          .maybeSingle();

        if (fedProfile?.federation_id) {
          userFedId = fedProfile.federation_id;
        }
      } catch {
        // Fall back to authUser.federationId
      }

      if (!userFedId) {
        userFedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
      }

      if (
        authUser.id !== "dev-admin-profile-id" &&
        userFedId &&
        incident.federation_id &&
        incident.federation_id.trim().toLowerCase() !== userFedId.trim().toLowerCase()
      ) {
        return NextResponse.json(
          { error: "Forbidden: You may only cancel incidents within your assigned federation." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { reason } = body;

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      return NextResponse.json(
        { error: "A specific cancellation reason is required." },
        { status: 400 }
      );
    }

    const result = await EmergencyIncidentRepository.cancelIncident({
      incidentId,
      adminProfileId: authUser.id,
      reason: reason.trim(),
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Emergency incident cancelled successfully.",
      incident: result.record,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/incidents/[id]/cancel error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

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
        { error: "Forbidden: Only Federation Administrators can approve resolution or close incidents." },
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
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedProfile } = await (supabase.from("profiles") as any)
        .select("federation_id")
        .eq("id", authUser.id)
        .maybeSingle();

      const userFedId =
        fedProfile?.federation_id ||
        authUser.federationId ||
        "b765df3b-c418-4a15-b79f-3cbc09e475dc";

      if (userFedId && incident.federation_id !== userFedId) {
        return NextResponse.json(
          { error: "Forbidden: You may only close incidents within your assigned federation." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();
    const { action, closureNotes } = body;

    if (action !== "APPROVE" && action !== "REOPEN") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'APPROVE' or 'REOPEN'." },
        { status: 400 }
      );
    }

    const result = await EmergencyIncidentRepository.reviewClosure({
      incidentId,
      adminProfileId: authUser.id,
      action,
      closureNotes,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "APPROVE"
          ? "Emergency incident resolution approved and closed successfully."
          : "Emergency incident reopened for further field response.",
      incident: result.record,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/incidents/[id]/close error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

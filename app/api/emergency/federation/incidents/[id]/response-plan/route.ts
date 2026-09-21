import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyControlCenterRepository } from "@/lib/emergency/control-center-store";

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
    const { action, payload } = body;

    if (!action || !payload) {
      return NextResponse.json(
        { error: "action and payload are required." },
        { status: 400 }
      );
    }

    const isSuperAdmin = authUser.role === "SUPER_ADMIN";
    const federationId = authUser.federationId || "";

    const result = await EmergencyControlCenterRepository.modifyResponsePlan({
      incidentId,
      federationId,
      actorId: authUser.id,
      action,
      payload,
      isSuperAdmin,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.code });
    }

    return NextResponse.json(
      {
        success: true,
        action,
        result: result.result,
      },
      { status: result.code || 200 }
    );
  } catch (err: unknown) {
    console.error("PATCH /api/emergency/federation/incidents/[id]/response-plan error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

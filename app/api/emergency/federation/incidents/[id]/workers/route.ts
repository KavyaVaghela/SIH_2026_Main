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

    const body = await request.json();
    const { action } = body;

    const isSuperAdmin = authUser.role === "SUPER_ADMIN";
    const federationId = authUser.federationId || "";

    if (action === "ADD") {
      const { workerId, role } = body;
      if (!workerId || !role) {
        return NextResponse.json(
          { error: "workerId and role are required for ADD action." },
          { status: 400 }
        );
      }

      const result = await EmergencyControlCenterRepository.addWorkerToTeam({
        incidentId,
        federationId,
        actorId: authUser.id,
        workerId,
        role,
        isSuperAdmin,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.code });
      }

      return NextResponse.json({
        success: true,
        action: "ADD",
        member: result.member,
      }, { status: 201 });
    }

    if (action === "REPLACE") {
      const { existingWorkerId, replacementWorkerId, reason } = body;
      if (!existingWorkerId || !replacementWorkerId || !reason) {
        return NextResponse.json(
          { error: "existingWorkerId, replacementWorkerId, and reason are required for REPLACE action." },
          { status: 400 }
        );
      }

      const result = await EmergencyControlCenterRepository.replaceWorkerOnTeam({
        incidentId,
        federationId,
        actorId: authUser.id,
        existingWorkerId,
        replacementWorkerId,
        reason,
        isSuperAdmin,
      });

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: result.code });
      }

      return NextResponse.json({
        success: true,
        action: "REPLACE",
        member: result.member,
      });
    }

    return NextResponse.json(
      { error: "Invalid action. Supported actions are ADD and REPLACE." },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("POST /api/emergency/federation/incidents/[id]/workers error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

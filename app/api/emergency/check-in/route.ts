import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyVerificationRepository } from "@/lib/emergency/verification-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    if (authUser.role !== "WORKER" && authUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only assigned workers can check in to an emergency response team." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { incidentId, teamId, method } = body;

    if (!incidentId) {
      return NextResponse.json(
        { error: "incidentId is required." },
        { status: 400 }
      );
    }

    // Resolve worker ID
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: workerRec } = await (supabase.from("workers") as any)
      .select("id")
      .eq("profile_id", authUser.id)
      .maybeSingle();

    if (!workerRec && authUser.role === "WORKER") {
      return NextResponse.json(
        { error: "Worker profile not found." },
        { status: 404 }
      );
    }

    const workerId = workerRec?.id || authUser.id;

    // If teamId not provided, resolve active team for incident
    let resolvedTeamId = teamId;
    if (!resolvedTeamId) {
      const team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
      if (!team) {
        return NextResponse.json(
          { error: "No response team found for this emergency incident." },
          { status: 404 }
        );
      }
      resolvedTeamId = team.id;
    }

    const result = await EmergencyVerificationRepository.recordWorkerCheckIn(
      incidentId,
      resolvedTeamId,
      workerId,
      method || "QR_EMERGENCY_VERIFICATION"
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Field check-in recorded successfully.",
      checkIn: result.checkIn,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/check-in error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const incidentId = searchParams.get("incidentId");
    if (!incidentId) {
      return NextResponse.json(
        { error: "incidentId query parameter is required." },
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

    // Role-based scoping
    if (authUser.role === "CUSTOMER" && incident.customer_id !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view check-ins for this incident." },
        { status: 403 }
      );
    }

    const checkIns = await EmergencyVerificationRepository.listCheckInsForIncident(incidentId);

    return NextResponse.json({
      success: true,
      incidentId,
      checkIns,
      totalCheckedIn: checkIns.length,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/check-in error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

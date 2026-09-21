import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyTaskRepository } from "@/lib/emergency/task-store";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { createAdminClient } from "@/lib/supabase/admin";

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

    // Role-based Access Control
    if (authUser.role === "CUSTOMER" && incident.customer_id !== authUser.id) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view tasks for this incident." },
        { status: 403 }
      );
    } else if (authUser.role === "WORKER") {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workerRec } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", authUser.id)
        .maybeSingle();

      const team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
      const isMember = (team?.members || []).some((m) => m.worker_id === workerRec?.id);
      if (!isMember) {
        return NextResponse.json(
          { error: "Forbidden: Only assigned team members may view incident tasks." },
          { status: 403 }
        );
      }
    } else if (authUser.role === "FEDERATION_ADMIN" && incident.federation_id) {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedProfile } = await (supabase.from("profiles") as any)
        .select("federation_id")
        .eq("id", authUser.id)
        .maybeSingle();

      if (fedProfile?.federation_id && fedProfile.federation_id !== incident.federation_id) {
        return NextResponse.json(
          { error: "Forbidden: Federation Admins can only view tasks within their federation." },
          { status: 403 }
        );
      }
    }

    const tasks = await EmergencyTaskRepository.listTasksForIncident(incidentId);
    const progress = await EmergencyTaskRepository.calculateProgress(incidentId);

    return NextResponse.json({
      success: true,
      incidentId,
      tasks,
      progress,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/tasks error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

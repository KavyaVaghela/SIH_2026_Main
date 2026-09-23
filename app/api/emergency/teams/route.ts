import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

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
    const teamId = searchParams.get("teamId");
    const workerIdParam = searchParams.get("workerId");

    if (!incidentId && !teamId && !workerIdParam) {
      return NextResponse.json(
        { error: "Specify incidentId, teamId, or workerId query parameter." },
        { status: 400 }
      );
    }

    let team = null;
    if (incidentId) {
      team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
    } else if (teamId) {
      team = await EmergencyTeamRepository.getTeamById(teamId);
    } else if (workerIdParam) {
      team = await EmergencyTeamRepository.getActiveTeamForWorker(workerIdParam);
      if (!team) {
        return NextResponse.json({
          success: true,
          team: null,
        });
      }
    }

    if (!team) {
      return NextResponse.json(
        { error: "Emergency response team not found." },
        { status: 404 }
      );
    }

    // Role-based Access Control
    if (authUser.role === "CUSTOMER") {
      const incident = await EmergencyIncidentRepository.findById(team.incident_id);
      if (incident?.customer_id !== authUser.id) {
        return NextResponse.json(
          { error: "Forbidden: Customer is not authorized to inspect teams for other incidents." },
          { status: 403 }
        );
      }
    } else if (authUser.role === "WORKER") {
      // Workers can view team if they are a member
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workerRec } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", authUser.id)
        .maybeSingle();

      const workerId = workerRec?.id;
      const isMember = (team.members || []).some((m) => m.worker_id === workerId);
      if (!isMember && authUser.role === "WORKER") {
        return NextResponse.json(
          { error: "Forbidden: Workers may only inspect emergency teams they belong to." },
          { status: 403 }
        );
      }
    } else if (authUser.role === "FEDERATION_ADMIN" && team.federation_id) {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedProfile } = await (supabase.from("profiles") as any)
        .select("federation_id")
        .eq("id", authUser.id)
        .maybeSingle();

      if (fedProfile?.federation_id && fedProfile.federation_id !== team.federation_id) {
        return NextResponse.json(
          { error: "Forbidden: Federation Admin cannot access teams outside their federation." },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      team,
    });
  } catch (err: unknown) {
    console.error("GET /api/emergency/teams error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

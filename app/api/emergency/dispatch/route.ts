import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import {
  EmergencyDispatchRepository,
} from "@/lib/emergency/dispatch-store";
import {
  EmergencyIncidentRepository,
} from "@/lib/emergency/incident-store";
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
    const workerId = searchParams.get("workerId");

    // 1. Querying by incidentId
    if (incidentId) {
      const incident = await EmergencyIncidentRepository.findById(incidentId);
      if (!incident) {
        return NextResponse.json({ error: "Emergency incident not found." }, { status: 404 });
      }

      // Customer isolation: Customers can only query their own incident
      if (authUser.role === "CUSTOMER" && incident.customer_id !== authUser.id) {
        return NextResponse.json(
          { error: "Forbidden: Customer is not authorized to access dispatch info for this incident." },
          { status: 403 }
        );
      }

      const dispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incidentId);
      return NextResponse.json({
        success: true,
        incidentId,
        dispatches,
        count: dispatches.length,
      });
    }

    // 2. Querying by workerId
    if (workerId) {
      // Workers can only query their own dispatched opportunities
      if (authUser.role === "WORKER") {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: workerRec } = await (supabase.from("workers") as any)
          .select("id")
          .eq("profile_id", authUser.id)
          .maybeSingle();

        if (!workerRec || workerRec.id !== workerId) {
          return NextResponse.json(
            { error: "Forbidden: Workers may only inspect emergency opportunities offered to themselves." },
            { status: 403 }
          );
        }
      } else if (authUser.role === "CUSTOMER") {
        return NextResponse.json(
          { error: "Forbidden: Customers cannot access worker dispatch queues." },
          { status: 403 }
        );
      }

      const dispatches = await EmergencyDispatchRepository.listDispatchesForWorker(workerId);
      return NextResponse.json({
        success: true,
        workerId,
        dispatches,
        count: dispatches.length,
      });
    }

    // Worker default list: if authenticated as worker with no params, show their own opportunities
    if (authUser.role === "WORKER") {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workerRec } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", authUser.id)
        .maybeSingle();

      if (workerRec) {
        const dispatches = await EmergencyDispatchRepository.listDispatchesForWorker(workerRec.id);
        return NextResponse.json({
          success: true,
          workerId: workerRec.id,
          dispatches,
          count: dispatches.length,
        });
      }
    }

    return NextResponse.json(
      { error: "Specify incidentId or workerId query parameter." },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("GET /api/emergency/dispatch error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    // Customers cannot directly trigger automated dispatch
    if (authUser.role === "CUSTOMER") {
      return NextResponse.json(
        { error: "Forbidden: Customers are not permitted to trigger or modify dispatch pool operations." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const incidentId = body.incidentId;
    if (!incidentId) {
      return NextResponse.json({ error: "incidentId is required." }, { status: 400 });
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return NextResponse.json({ error: "Emergency incident not found." }, { status: 404 });
    }

    // Federation Admin scoping check
    if (authUser.role === "FEDERATION_ADMIN" && incident.federation_id) {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fedAdminProfile } = await (supabase.from("profiles") as any)
        .select("federation_id")
        .eq("id", authUser.id)
        .maybeSingle();

      if (fedAdminProfile?.federation_id && fedAdminProfile.federation_id !== incident.federation_id) {
        return NextResponse.json(
          { error: "Forbidden: Federation Admins can only dispatch within their assigned federation." },
          { status: 403 }
        );
      }
    }

    const result = await EmergencyDispatchRepository.generateDispatchPool(incidentId);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (err: unknown) {
    console.error("POST /api/emergency/dispatch error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { projectId, requirementId: inputReqId, workerId } = body;

    if (!projectId || !workerId) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: projectId or workerId" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Resolve requirement record and requirement ID
    let resolvedRequirementId: string | null = inputReqId || null;
    let reqRecord: any = null;

    if (resolvedRequirementId) {
      const { data: reqById } = await (admin.from("project_requirements") as any)
        .select("*")
        .eq("id", resolvedRequirementId)
        .maybeSingle();

      if (reqById) {
        reqRecord = reqById;
      } else {
        resolvedRequirementId = null;
      }
    }

    if (!resolvedRequirementId) {
      const { data: reqsByProj } = await (admin.from("project_requirements") as any)
        .select("*")
        .eq("project_request_id", projectId);

      if (reqsByProj && reqsByProj.length > 0) {
        reqRecord = reqsByProj[0];
        resolvedRequirementId = reqsByProj[0].id;
      }
    }

    // 2. Fetch project request record for required workers fallback
    const { data: projRecord } = await (admin.from("project_requests") as any)
      .select("id, description")
      .eq("id", projectId)
      .maybeSingle();

    let descWorkers = 5;
    if (projRecord?.description) {
      const workersMatch = projRecord.description.match(/\[Workers\]:\s*(\d+)/);
      if (workersMatch) {
        descWorkers = Number(workersMatch[1]);
      }
    }

    // Auto-create requirement record if missing
    if (!resolvedRequirementId || !reqRecord) {
      const { data: skills } = await (admin.from("skills") as any).select("id").limit(1);
      const defaultSkillId = skills?.[0]?.id || "9f757d17-0f01-4d11-8d0f-601a832f8aba";

      const { data: created, error: createErr } = await (admin.from("project_requirements") as any)
        .insert({
          project_request_id: projectId,
          skill_id: defaultSkillId,
          required_workers_count: descWorkers,
        })
        .select();

      if (!createErr && created && created.length > 0) {
        reqRecord = created[0];
        resolvedRequirementId = created[0].id;
      }
    }

    let requiredWorkers = descWorkers;
    if (projRecord?.description && projRecord.description.includes("[Workers]:")) {
      requiredWorkers = descWorkers;
    } else if (reqRecord) {
      requiredWorkers = Number(reqRecord.required_workers_count) || descWorkers;
    }
    requiredWorkers = Math.max(1, requiredWorkers);

    // 3. Count current valid fulfillment records for this requirement
    const allocQuery = admin.from("project_allocations").select("id, status, worker_id, requirement_id, project_request_id");
    
    let orFilter = `project_request_id.eq.${projectId}`;
    if (resolvedRequirementId) {
      orFilter += `,requirement_id.eq.${resolvedRequirementId}`;
    }
    const { data: currentAllocs, error: queryErr } = await (allocQuery.or(orFilter) as any);

    if (queryErr) {
      console.error("POST /api/worker/accept query error:", queryErr);
      return NextResponse.json(
        { success: false, error: queryErr.message || "Failed to query existing project allocations." },
        { status: 500 }
      );
    }

    const validAllocs = (currentAllocs || []).filter(
      (a: any) => a.status === "assigned" || a.status === "ACCEPTED"
    );

    const fulfilledWorkers = validAllocs.length;
    const isFull = fulfilledWorkers >= requiredWorkers;

    // 4. Capacity Enforcement Check
    if (isFull) {
      console.warn(
        `[Capacity Blocked] Requirement ${resolvedRequirementId || projectId} is FULL (${fulfilledWorkers}/${requiredWorkers}). Rejecting allocation for worker ${workerId}.`
      );

      return NextResponse.json(
        {
          success: false,
          code: "SLOT_FULL",
          error: "All worker slots for this project are already filled.",
          requirementId: resolvedRequirementId,
          requiredWorkers,
          fulfilledWorkers,
          remainingWorkers: 0,
          isFull: true,
        },
        { status: 409 }
      );
    }

    // 5. If under capacity, insert the new allocation using Admin Client
    const { data: inserted, error: insErr } = await (admin.from("project_allocations") as any)
      .insert({
        project_request_id: projectId,
        requirement_id: resolvedRequirementId,
        worker_id: workerId,
        status: "assigned",
        allocated_at: new Date().toISOString(),
      })
      .select();

    if (insErr) {
      console.error("POST /api/worker/accept insert error:", insErr);
      return NextResponse.json(
        { success: false, error: insErr.message || "Failed to record allocation in database." },
        { status: 500 }
      );
    }

    const newFulfilled = fulfilledWorkers + 1;
    const newRemaining = Math.max(0, requiredWorkers - newFulfilled);
    const newIsFull = newFulfilled >= requiredWorkers;

    return NextResponse.json(
      {
        success: true,
        allocation: inserted?.[0],
        requirementId: resolvedRequirementId,
        requiredWorkers,
        fulfilledWorkers: newFulfilled,
        remainingWorkers: newRemaining,
        isFull: newIsFull,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    console.error("POST /api/worker/accept error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getBatchProjectsFulfillment, getProjectRequirementFulfillment } from "@/lib/projects/fulfillment";
import { getBatchProjectsActualCost } from "@/lib/projects/daily-monitoring-store";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("project_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("API GET /api/projects DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const projectsList = data || [];
    const projectIds = projectsList.map((p: any) => p.id);
    const [fulfillments, actualCosts] = await Promise.all([
      getBatchProjectsFulfillment(projectIds),
      getBatchProjectsActualCost(projectIds),
    ]);

    const enrichedProjects = projectsList.map((p: any) => {
      const f = fulfillments[p.id] || {
        requiredWorkers: 5,
        fulfilledWorkers: 0,
        remainingWorkers: 5,
        isFull: false,
        statusText: "5 Needed",
        requirementId: null,
      };

      const pmtsTagMatch = p.description?.match(/\[Payments Received\]:\s*(\d+(?:\.\d+)?)/);
      let pmtRec = pmtsTagMatch ? Number(pmtsTagMatch[1]) : Number(p.payments_received || 0);

      if (p.description?.includes("[Payment Schedule]:")) {
        const schedMatch = p.description.match(/\[Payment Schedule\]:\s*([^\n]+)/);
        if (schedMatch) {
          try {
            const sched = JSON.parse(schedMatch[1].trim());
            if (Array.isArray(sched)) {
              const schedSum = sched
                .filter((i: any) => i.paymentStatus === "PAID" || i.status === "PAID")
                .reduce((acc: number, i: any) => acc + Number(i.amount || 0), 0);
              if (schedSum > pmtRec) pmtRec = schedSum;
            }
          } catch {
            // ignore
          }
        }
      }

      const verifiedActualCost = actualCosts[p.id] || 0;

      return {
        ...p,
        actual_cost_to_date: verifiedActualCost,
        actualCostToDate: verifiedActualCost,
        payments_received: pmtRec,
        paymentsReceived: pmtRec,
        requirement_id: f.requirementId,
        required_workers_count: f.requiredWorkers,
        fulfilled_workers_count: f.fulfilledWorkers,
        allocated_workers_count: f.fulfilledWorkers,
        accepted_workers_count: f.fulfilledWorkers,
        remaining_workers_count: f.remainingWorkers,
        is_full: f.isFull,
        requirement_status_text: f.statusText,
      };
    });

    return NextResponse.json(
      {
        success: true,
        projects: enrichedProjects,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
        },
      }
    );
  } catch (err: unknown) {
    console.error("API GET /api/projects handler error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, description, rejection_reason, total_budget } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required fields: id or status" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch current project state
    const { data: currentProject, error: fetchErr } = await (admin.from("project_requests") as any)
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !currentProject) {
      return NextResponse.json({ error: "No project request found with given ID" }, { status: 404 });
    }

    const currentStatus = (currentProject.status || "").toUpperCase();
    const targetStatus = (status || "").toUpperCase();

    // 2. Server-Side Start Project Validation
    if (targetStatus === "IN_PROGRESS" || targetStatus === "ACTIVE") {
      if (currentStatus === "COMPLETED") {
        return NextResponse.json({ error: "Cannot start a project that is already completed." }, { status: 400 });
      }
      if (currentStatus === "IN_PROGRESS" || currentStatus === "ACTIVE") {
        return NextResponse.json({ error: "Project has already been started." }, { status: 400 });
      }

      // Worker Fulfillment Check using Authoritative Helper
      const f = await getProjectRequirementFulfillment(id);

      if (f.fulfilledWorkers < f.requiredWorkers) {
        return NextResponse.json(
          {
            error: `Cannot start project: Required workers have not been fully allocated yet (${f.fulfilledWorkers}/${f.requiredWorkers} allocated).`,
          },
          { status: 400 }
        );
      }
    }

    // 3. Server-Side Complete Project Validation
    if (targetStatus === "COMPLETED") {
      if (currentStatus === "SUBMITTED" || currentStatus === "UNDER_REVIEW" || currentStatus === "PROPOSAL_SENT" || currentStatus === "CONFIRMED") {
        return NextResponse.json({ error: "Cannot complete a project that has not been started yet." }, { status: 400 });
      }
      if (currentStatus === "COMPLETED") {
        return NextResponse.json({ error: "Project is already completed." }, { status: 400 });
      }
    }

    // Prepare update payload
    let updatedDescription = description !== undefined ? description : (currentProject.description || "");

    if (targetStatus === "IN_PROGRESS" || targetStatus === "ACTIVE") {
      if (!updatedDescription.includes("[Started At]:")) {
        updatedDescription += `\n[Started At]: ${new Date().toISOString()}`;
      }
    } else if (targetStatus === "COMPLETED") {
      if (!updatedDescription.includes("[Completed At]:")) {
        updatedDescription += `\n[Completed At]: ${new Date().toISOString()}`;
      }
      if (updatedDescription.includes("[Progress]:")) {
        updatedDescription = updatedDescription.replace(/\[Progress\]:\s*\d+%/, "[Progress]: 100%");
      } else {
        updatedDescription += "\n[Progress]: 100%";
      }
    }

    if (rejection_reason && !updatedDescription.includes("[Rejection Reason]:")) {
      updatedDescription += `\n[Rejection Reason]: ${rejection_reason}`;
    }

    const updatePayload: Record<string, any> = {
      status: targetStatus,
      description: updatedDescription,
      updated_at: new Date().toISOString(),
    };

    if (total_budget !== undefined) updatePayload.total_budget = total_budget;

    const { data, error } = await (admin.from("project_requests") as any)
      .update(updatePayload)
      .eq("id", id)
      .select();

    if (error) {
      console.error("API PATCH /api/projects DB error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Sync worker count in project_requirements if [Workers]: (\d+) is present in description
    const workersMatch = updatedDescription.match(/\[Workers\]:\s*(\d+)/);
    if (workersMatch) {
      const configuredWorkers = Number(workersMatch[1]);
      try {
        const { data: existingReqs } = await (admin.from("project_requirements") as any)
          .select("id")
          .eq("project_request_id", id);
        if (existingReqs && existingReqs.length > 0) {
          await (admin.from("project_requirements") as any)
            .update({ required_workers_count: configuredWorkers })
            .eq("project_request_id", id);
        } else {
          const { data: skills } = await (admin.from("skills") as any).select("id").limit(1);
          const defaultSkillId = skills?.[0]?.id || "9f757d17-0f01-4d11-8d0f-601a832f8aba";
          await (admin.from("project_requirements") as any).insert({
            project_request_id: id,
            skill_id: defaultSkillId,
            required_workers_count: configuredWorkers,
          });
        }
      } catch (reqSyncErr) {
        console.warn("Could not sync project_requirements count:", reqSyncErr);
      }
    }

    return NextResponse.json({
      success: true,
      project: data[0],
    });
  } catch (err: unknown) {
    console.error("API PATCH /api/projects handler error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

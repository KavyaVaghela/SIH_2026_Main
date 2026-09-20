/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProjectRequirementFulfillment } from "@/lib/projects/fulfillment";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId,
      action,
      workerId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e",
      progressPercentage,
      workSummary,
      materialExpense = 0,
      photoUrl,
    } = body;

    if (!projectId) {
      return NextResponse.json({ error: "Missing required field: projectId" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch target project record
    const { data: projectData, error: projErr } = await (admin.from("project_requests") as any)
      .select("*")
      .eq("id", projectId)
      .single();

    if (projErr || !projectData) {
      return NextResponse.json({ error: "Project request not found" }, { status: 404 });
    }

    // 1. ACTION: START_PROJECT
    if (action === "START_PROJECT") {
      const fulfillment = await getProjectRequirementFulfillment(projectId);
      if (fulfillment.fulfilledWorkers < fulfillment.requiredWorkers) {
        return NextResponse.json(
          {
            error: `Cannot start project: Required workers count (${fulfillment.requiredWorkers}) is not fully fulfilled (Current: ${fulfillment.fulfilledWorkers}/${fulfillment.requiredWorkers}).`,
            fulfilledWorkers: fulfillment.fulfilledWorkers,
            requiredWorkers: fulfillment.requiredWorkers,
          },
          { status: 400 }
        );
      }

      let description = projectData.description || "";
      const nowIso = new Date().toISOString();
      if (!description.includes("[Started At]:")) {
        description += `\n[Started At]: ${nowIso}`;
      }

      const updatePayload: Record<string, unknown> = {
        status: "IN_PROGRESS",
        description,
        updated_at: nowIso,
      };

      const { data: startedProj, error: startErr } = await (admin.from("project_requests") as any)
        .update(updatePayload)
        .eq("id", projectId)
        .select()
        .single();

      if (startErr) {
        return NextResponse.json({ error: startErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Project successfully started.",
        project: startedProj,
      });
    }

    // 2. ACTION: COMPLETE_PROJECT
    if (action === "COMPLETE_PROJECT") {
      let description = projectData.description || "";
      const nowIso = new Date().toISOString();
      if (!description.includes("[Completed At]:")) {
        description += `\n[Completed At]: ${nowIso}`;
      }
      if (description.includes("[Progress]:")) {
        description = description.replace(/\[Progress\]:\s*\d+%/, `[Progress]: 100%`);
      } else {
        description += `\n[Progress]: 100%`;
      }

      const updatePayload: Record<string, unknown> = {
        status: "COMPLETED",
        description,
        updated_at: nowIso,
      };

      const { data: completedProj, error: compErr } = await (admin.from("project_requests") as any)
        .update(updatePayload)
        .eq("id", projectId)
        .select()
        .single();

      if (compErr) {
        return NextResponse.json({ error: compErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Project marked as COMPLETED and READY_FOR_FINAL_BILLING.",
        project: completedProj,
      });
    }

    // 3. ACTION: PROGRESS SUBMISSION (Default / Progress)
    const progress = Number(progressPercentage);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      return NextResponse.json({ error: "Progress percentage must be an integer between 0 and 100" }, { status: 400 });
    }

    if (!workSummary || !workSummary.trim()) {
      return NextResponse.json({ error: "Work summary is required for progress submission" }, { status: 400 });
    }

    // Verify worker authorization on this project
    const { data: allocations } = await (admin.from("project_allocations") as any)
      .select("*")
      .or(`project_request_id.eq.${projectId},requirement_id.eq.${projectId}`)
      .eq("worker_id", workerId);

    const isAssigned = allocations && allocations.some((a: any) => a.status === "assigned" || a.status === "ACCEPTED");
    if (!isAssigned && allocations && allocations.length > 0) {
      return NextResponse.json({ error: "Worker is not authorized or allocated to this active project." }, { status: 403 });
    }

    // Server-side progress check: Progress cannot decrease
    const currentProgress = Number(projectData.progress_percentage || 0);
    const finalProgress = Math.max(currentProgress, progress);

    let description = projectData.description || "";
    if (description.includes("[Progress]:")) {
      description = description.replace(/\[Progress\]:\s*\d+%/, `[Progress]: ${finalProgress}%`);
    } else {
      description += `\n[Progress]: ${finalProgress}%`;
    }

    let newStatus = projectData.status;
    const nowIso = new Date().toISOString();

    if (finalProgress === 100 && (newStatus === "IN_PROGRESS" || newStatus === "ACTIVE")) {
      newStatus = "COMPLETED";
      if (!description.includes("[Completed At]:")) {
        description += `\n[Completed At]: ${nowIso}`;
      }
    }

    // Update project_requests record
    const updatePayload: Record<string, unknown> = {
      description,
      status: newStatus,
      updated_at: nowIso,
    };

    const { data: updatedProject, error: updateErr } = await (admin.from("project_requests") as any)
      .update(updatePayload)
      .eq("id", projectId)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Insert into project_checkpoints (graceful try/catch)
    try {
      await (admin.from("project_checkpoints") as any).insert({
        project_id: projectId,
        worker_id: workerId,
        progress: finalProgress,
        work_summary: workSummary.trim(),
        checkpoint_date: new Date().toISOString().split("T")[0],
      });
    } catch {
      // Graceful fallback if checkpoints table pending
    }

    // Record expense if material expense provided (separate from customer payment)
    if (Number(materialExpense) > 0) {
      try {
        await (admin.from("project_expenses") as any).insert({
          project_request_id: projectId,
          submitted_by: workerId,
          title: `Execution Material Expense (${finalProgress}%)`,
          description: `[Summary]: ${workSummary.trim()}`,
          amount: Number(materialExpense),
          receipt_url: photoUrl || null,
          status: "APPROVED",
        });
      } catch {
        // Graceful fallback
      }
    }

    return NextResponse.json({
      success: true,
      progressPercentage: finalProgress,
      project: updatedProject,
    });
  } catch (err: unknown) {
    console.error("API POST /api/projects/progress handler error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

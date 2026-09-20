import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/emergency/auth-helper";
import { EmergencyTaskRepository } from "@/lib/emergency/task-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { createAdminClient } from "@/lib/supabase/admin";

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

    const { id: taskId } = await context.params;
    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID parameter is required." },
        { status: 400 }
      );
    }

    const task = await EmergencyTaskRepository.getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: "Emergency task not found." },
        { status: 404 }
      );
    }

    const team = await EmergencyTeamRepository.getTeamByIncidentId(task.incident_id);
    if (!team) {
      return NextResponse.json(
        { error: "No response team found for this incident." },
        { status: 404 }
      );
    }

    // Resolve current worker profile if role is WORKER
    let currentWorkerId: string | null = null;
    if (authUser.role === "WORKER") {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workerRec } = await (supabase.from("workers") as any)
        .select("id")
        .eq("profile_id", authUser.id)
        .maybeSingle();

      if (!workerRec) {
        return NextResponse.json(
          { error: "Worker profile not found." },
          { status: 404 }
        );
      }
      currentWorkerId = workerRec.id;

      // Check if worker is part of the team
      const isMember = (team.members || []).some((m) => m.worker_id === currentWorkerId);
      if (!isMember) {
        return NextResponse.json(
          { error: "Forbidden: You are not a member of the response team for this incident." },
          { status: 403 }
        );
      }
    } else if (authUser.role !== "FEDERATION_ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Only response team members and federation admins may update tasks." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, assignedWorkerId, completionNotes } = body;

    const isTeamLead = currentWorkerId ? team.team_lead_worker_id === currentWorkerId : false;
    const isFederationAdmin = authUser.role === "FEDERATION_ADMIN";

    if (action === "ASSIGN" || action === "REASSIGN") {
      // Only Team Lead or Federation Admin can assign/reassign tasks
      if (!isTeamLead && !isFederationAdmin) {
        return NextResponse.json(
          { error: "Forbidden: Only the Team Lead can assign tasks to team members." },
          { status: 403 }
        );
      }

      if (!assignedWorkerId) {
        return NextResponse.json(
          { error: "assignedWorkerId is required for task assignment." },
          { status: 400 }
        );
      }

      // Verify assignedWorkerId is an active member of this team
      const isTargetMember = (team.members || []).some(
        (m) => m.worker_id === assignedWorkerId && (m.status === "ACTIVE" || m.status === "ASSIGNED")
      );
      if (!isTargetMember) {
        return NextResponse.json(
          { error: "The target worker is not an active member of this emergency response team." },
          { status: 400 }
        );
      }

      const assignResult = await EmergencyTaskRepository.assignTask({
        taskId,
        assignedWorkerId,
        assigningWorkerId: currentWorkerId || authUser.id,
      });

      if (!assignResult.success) {
        return NextResponse.json(
          { error: assignResult.error },
          { status: assignResult.code || 400 }
        );
      }

      const progress = await EmergencyTaskRepository.calculateProgress(task.incident_id);

      return NextResponse.json({
        success: true,
        action: "ASSIGN",
        task: assignResult.task,
        progress,
      });
    }

    if (action === "START") {
      // Worker can start only if assigned to them, or if they are Team Lead / Federation Admin
      const isAssignedWorker = task.assigned_worker_id === currentWorkerId;
      if (!isAssignedWorker && !isTeamLead && !isFederationAdmin) {
        return NextResponse.json(
          { error: "Forbidden: You can only start tasks that are assigned to you." },
          { status: 403 }
        );
      }

      const startResult = await EmergencyTaskRepository.startTask({
        taskId,
        workerId: currentWorkerId || authUser.id,
      });

      if (!startResult.success) {
        return NextResponse.json(
          { error: startResult.error },
          { status: startResult.code || 400 }
        );
      }

      const progress = await EmergencyTaskRepository.calculateProgress(task.incident_id);

      return NextResponse.json({
        success: true,
        action: "START",
        task: startResult.task,
        progress,
      });
    }

    if (action === "COMPLETE") {
      // Worker can complete only if assigned to them, or if they are Team Lead / Federation Admin
      const isAssignedWorker = task.assigned_worker_id === currentWorkerId;
      if (!isAssignedWorker && !isTeamLead && !isFederationAdmin) {
        return NextResponse.json(
          { error: "Forbidden: You can only complete tasks that are assigned to you." },
          { status: 403 }
        );
      }

      const completeResult = await EmergencyTaskRepository.completeTask({
        taskId,
        workerId: currentWorkerId || authUser.id,
        completionNotes,
      });

      if (!completeResult.success) {
        return NextResponse.json(
          { error: completeResult.error },
          { status: completeResult.code || 400 }
        );
      }

      const progress = await EmergencyTaskRepository.calculateProgress(task.incident_id);

      return NextResponse.json({
        success: true,
        action: "COMPLETE",
        task: completeResult.task,
        progress,
      });
    }

    return NextResponse.json(
      { error: `Invalid action '${action}'. Valid actions are ASSIGN, START, COMPLETE.` },
      { status: 400 }
    );
  } catch (err: unknown) {
    console.error("PATCH /api/emergency/tasks/[id] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

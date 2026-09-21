import { createAdminClient } from "@/lib/supabase/admin";
import { InitialResponseTask } from "@/lib/emergency/response-matrix-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";

export type EmergencyTaskStatus = "PENDING" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type AdditionalWorkerRequestStatus = "PENDING_FEDERATION_REVIEW" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface EmergencyIncidentTaskRecord {
  id: string;
  incident_id: string;
  team_id: string;
  title: string;
  description: string;
  task_order: number;
  status: EmergencyTaskStatus;
  assigned_worker_id: string | null;
  assigned_role: string | null;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  completed_at: string | null;
  completion_notes: string | null;
  assigned_worker_name?: string;
  assigned_worker_phone?: string;
}

export interface EmergencyAdditionalWorkerRequestRecord {
  id: string;
  incident_id: string;
  team_id: string;
  requested_by_worker_id: string;
  reason: string;
  requested_role: string;
  requested_skill: string | null;
  requested_worker_count: number;
  count?: number;
  status: AdditionalWorkerRequestStatus;
  created_at: string;
  updated_at: string;
  requester_name?: string;
}

export interface IncidentTaskProgress {
  incident_id: string;
  total: number;
  totalTasks: number;
  pending: number;
  pendingTasks: number;
  assigned: number;
  inProgress: number;
  inProgressTasks: number;
  completed: number;
  completedTasks: number;
  cancelled: number;
  percentage: number;
  completionPercentage: number;
  progressPercentage: number;
}

import {
  getStoredTask,
  setStoredTask,
  listStoredTasks,
  getStoredAdditionalRequest,
  setStoredAdditionalRequest,
  listStoredAdditionalRequests,
} from "@/lib/emergency/persistence";

// In-memory repositories for resilient local testing and fallback
const inMemoryTasks = new Map<string, EmergencyIncidentTaskRecord>();
const inMemoryRequests = new Map<string, EmergencyAdditionalWorkerRequestRecord>();

export class EmergencyTaskRepository {
  /**
   * Idempotently initializes incident tasks from matrix initial_tasks when a team is formed
   */
  static async createInitialTasksForIncident(
    incidentId: string,
    teamId: string,
    initialTasks: InitialResponseTask[]
  ): Promise<EmergencyIncidentTaskRecord[]> {
    // 1. Check if tasks already exist for this incident (Idempotency / Prevent duplicates)
    const existing = await this.listTasksForIncident(incidentId);
    if (existing.length > 0) {
      return existing;
    }

    const now = new Date().toISOString();
    const createdTasks: EmergencyIncidentTaskRecord[] = [];

    // 2. Sort and create tasks according to predefined matrix sequence
    const sortedTasks = [...initialTasks].sort((a, b) => a.order - b.order);

    for (const initTask of sortedTasks) {
      const taskId = crypto.randomUUID();
      const taskRecord: EmergencyIncidentTaskRecord = {
        id: taskId,
        incident_id: incidentId,
        team_id: teamId,
        title: initTask.title,
        description: initTask.instruction,
        task_order: initTask.order,
        status: "PENDING",
        assigned_worker_id: null,
        assigned_role: null,
        created_at: now,
        updated_at: now,
        started_at: null,
        completed_at: null,
        completion_notes: null,
      };

      inMemoryTasks.set(taskId, taskRecord);
      setStoredTask(taskRecord);
      createdTasks.push(taskRecord);

      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("emergency_incident_tasks") as any).upsert({
          id: taskRecord.id,
          incident_id: taskRecord.incident_id,
          team_id: taskRecord.team_id,
          title: taskRecord.title,
          description: taskRecord.description,
          task_order: taskRecord.task_order,
          status: taskRecord.status,
          assigned_worker_id: taskRecord.assigned_worker_id,
          assigned_role: taskRecord.assigned_role,
          created_at: taskRecord.created_at,
          updated_at: taskRecord.updated_at,
        });
      } catch {
        // Fallback seamlessly to memory
      }
    }

    return createdTasks;
  }

  /**
   * Lists all tasks for an incident ordered by task_order
   */
  static async listTasksForIncident(incidentId: string): Promise<EmergencyIncidentTaskRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_incident_tasks") as any)
        .select(`
          *,
          workers (
            id,
            profiles ( full_name, phone )
          )
        `)
        .eq("incident_id", incidentId)
        .order("task_order", { ascending: true });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((t: any) => ({
          ...t,
          assigned_worker_name: t.workers?.profiles?.full_name,
          assigned_worker_phone: t.workers?.profiles?.phone,
        }));
      }
    } catch {
      // Memory check
    }

    const allTasks = [...Array.from(inMemoryTasks.values()), ...listStoredTasks()];
    const unique = new Map<string, EmergencyIncidentTaskRecord>();
    for (const t of allTasks) {
      if (t.incident_id === incidentId) unique.set(t.id, t);
    }
    return Array.from(unique.values()).sort((a, b) => a.task_order - b.task_order);
  }

  /**
   * Lists tasks assigned to a specific worker
   */
  static async listTasksForWorker(workerId: string): Promise<EmergencyIncidentTaskRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_incident_tasks") as any)
        .select(`
          *,
          emergency_incidents (
            id,
            emergency_id,
            category_name,
            emergency_type,
            severity,
            location
          )
        `)
        .eq("assigned_worker_id", workerId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as EmergencyIncidentTaskRecord[];
      }
    } catch {
      // Memory check
    }

    return Array.from(inMemoryTasks.values())
      .filter((t) => t.assigned_worker_id === workerId)
      .sort((a, b) => a.task_order - b.task_order);
  }

  /**
   * Retrieves single task by ID
   */
  static async getTaskById(taskId: string): Promise<EmergencyIncidentTaskRecord | null> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_incident_tasks") as any)
        .select("*")
        .eq("id", taskId)
        .maybeSingle();

      if (!error && data) {
        return data as EmergencyIncidentTaskRecord;
      }
    } catch {
      // Memory check
    }

    return inMemoryTasks.get(taskId) || getStoredTask(taskId) || null;
  }

  /**
   * Assigns or reassigns a task to a response team member (Team Lead only)
   */
  static async assignTask(params: {
    taskId: string;
    assignedWorkerId: string;
    assigningWorkerId: string;
    assignedRole?: string;
  }): Promise<{ success: boolean; code: number; error?: string; task?: EmergencyIncidentTaskRecord }> {
    const { taskId, assignedWorkerId, assigningWorkerId, assignedRole } = params;

    const task = await this.getTaskById(taskId);
    if (!task) {
      return { success: false, code: 404, error: "Task not found." };
    }

    // Verify Team Lead authorization
    const team = await EmergencyTeamRepository.getTeamById(task.team_id);
    if (!team) {
      return { success: false, code: 404, error: "Emergency response team not found." };
    }

    if (team.team_lead_worker_id !== assigningWorkerId) {
      return {
        success: false,
        code: 403,
        error: "Forbidden: Only the designated Team Lead may assign or reassign tasks.",
      };
    }

    // Verify assigned worker is an active member of this team
    const members = await EmergencyTeamRepository.listTeamMembers(team.id);
    const targetMember = members.find((m) => m.worker_id === assignedWorkerId);
    if (!targetMember) {
      return {
        success: false,
        code: 400,
        error: "Cannot assign task: Target worker is not a member of this Emergency Response Team.",
      };
    }

    // Update task
    const now = new Date().toISOString();
    const updated: EmergencyIncidentTaskRecord = {
      ...task,
      assigned_worker_id: assignedWorkerId,
      assigned_role: assignedRole || targetMember.role,
      status: "ASSIGNED",
      updated_at: now,
      assigned_worker_name: targetMember.worker_name,
      assigned_worker_phone: targetMember.worker_phone,
    };

    inMemoryTasks.set(taskId, updated);
    setStoredTask(updated);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incident_tasks") as any)
        .update({
          assigned_worker_id: updated.assigned_worker_id,
          assigned_role: updated.assigned_role,
          status: updated.status,
          updated_at: updated.updated_at,
        })
        .eq("id", taskId);
    } catch {
      // Memory fallback
    }

    return { success: true, code: 200, task: updated };
  }

  /**
   * Starts a task (Assigned Worker or Team Lead)
   */
  static async startTask(params: {
    taskId: string;
    workerId: string;
  }): Promise<{ success: boolean; code: number; error?: string; task?: EmergencyIncidentTaskRecord }> {
    const { taskId, workerId } = params;

    const task = await this.getTaskById(taskId);
    if (!task) {
      return { success: false, code: 404, error: "Task not found." };
    }

    const team = await EmergencyTeamRepository.getTeamById(task.team_id);
    const isTeamLead = team?.team_lead_worker_id === workerId;
    const isAssigned = task.assigned_worker_id === workerId;

    if (!isAssigned && !isTeamLead) {
      return {
        success: false,
        code: 403,
        error: "Forbidden: You cannot start a task assigned to another worker.",
      };
    }

    // Lifecycle validation
    if (task.status === "COMPLETED") {
      return {
        success: false,
        code: 409,
        error: "Cannot start a task that has already been completed.",
      };
    }

    if (task.status === "IN_PROGRESS") {
      return {
        success: false,
        code: 409,
        error: "Task is already in progress.",
      };
    }

    const now = new Date().toISOString();
    const updated: EmergencyIncidentTaskRecord = {
      ...task,
      status: "IN_PROGRESS",
      started_at: task.started_at || now,
      updated_at: now,
    };

    inMemoryTasks.set(taskId, updated);
    setStoredTask(updated);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incident_tasks") as any)
        .update({
          status: updated.status,
          started_at: updated.started_at,
          updated_at: updated.updated_at,
        })
        .eq("id", taskId);
    } catch {
      // Memory fallback
    }

    return { success: true, code: 200, task: updated };
  }

  /**
   * Completes a task with optional completion notes (Assigned Worker or Team Lead)
   */
  static async completeTask(params: {
    taskId: string;
    workerId: string;
    completionNotes?: string;
  }): Promise<{ success: boolean; code: number; error?: string; task?: EmergencyIncidentTaskRecord }> {
    const { taskId, workerId, completionNotes } = params;

    const task = await this.getTaskById(taskId);
    if (!task) {
      return { success: false, code: 404, error: "Task not found." };
    }

    const team = await EmergencyTeamRepository.getTeamById(task.team_id);
    const isTeamLead = team?.team_lead_worker_id === workerId;
    const isAssigned = task.assigned_worker_id === workerId;

    if (!isAssigned && !isTeamLead) {
      return {
        success: false,
        code: 403,
        error: "Forbidden: You cannot complete a task assigned to another worker.",
      };
    }

    // Lifecycle validation
    if (task.status === "PENDING") {
      return {
        success: false,
        code: 400,
        error: "Cannot complete an unassigned task directly. Task must be assigned and commenced.",
      };
    }

    if (task.status === "COMPLETED") {
      return {
        success: false,
        code: 409,
        error: "Task is already completed.",
      };
    }

    const now = new Date().toISOString();
    const updated: EmergencyIncidentTaskRecord = {
      ...task,
      status: "COMPLETED",
      completed_at: now,
      completion_notes: completionNotes || task.completion_notes || null,
      updated_at: now,
    };

    inMemoryTasks.set(taskId, updated);
    setStoredTask(updated);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incident_tasks") as any)
        .update({
          status: updated.status,
          completed_at: updated.completed_at,
          completion_notes: updated.completion_notes,
          updated_at: updated.updated_at,
        })
        .eq("id", taskId);
    } catch {
      // Memory fallback
    }

    return { success: true, code: 200, task: updated };
  }

  /**
   * Calculates deterministic progress metrics for an incident's emergency tasks
   */
  static async calculateProgress(incidentId: string): Promise<IncidentTaskProgress> {
    const tasks = await this.listTasksForIncident(incidentId);
    const total = tasks.length;
    const pending = tasks.filter((t) => t.status === "PENDING").length;
    const assigned = tasks.filter((t) => t.status === "ASSIGNED").length;
    const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
    const completed = tasks.filter((t) => t.status === "COMPLETED").length;
    const cancelled = tasks.filter((t) => t.status === "CANCELLED").length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      incident_id: incidentId,
      total,
      totalTasks: total,
      pending,
      pendingTasks: pending,
      assigned,
      inProgress,
      inProgressTasks: inProgress,
      completed,
      completedTasks: completed,
      cancelled,
      percentage,
      completionPercentage: percentage,
      progressPercentage: percentage,
    };
  }

  /**
   * Submits an additional worker request (Team Lead only)
   */
  static async createAdditionalWorkerRequest(params: {
    incidentId: string;
    teamId: string;
    requestedByWorkerId: string;
    reason: string;
    requestedRole: string;
    requestedSkill?: string;
    requestedWorkerCount: number;
  }): Promise<{
    success: boolean;
    code: number;
    error?: string;
    request?: EmergencyAdditionalWorkerRequestRecord;
  }> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = params as any;
    const incidentId = params.incidentId || p.incident_id;
    const teamId = params.teamId || p.team_id;
    const requestedByWorkerId = params.requestedByWorkerId || p.requested_by_worker_id;
    const reason = params.reason || p.reason;
    const requestedRole = params.requestedRole || params.requestedSkill || p.skill || p.role || "Specialist";
    const requestedSkill = params.requestedSkill || p.skill || requestedRole;
    const requestedWorkerCount = params.requestedWorkerCount || p.count || 1;

    // Verify Team Lead
    let team = await EmergencyTeamRepository.getTeamById(teamId);
    if (!team && incidentId) {
      team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
    }
    if (!team) {
      return { success: false, code: 404, error: "Emergency response team not found." };
    }

    if (team.team_lead_worker_id !== requestedByWorkerId) {
      return {
        success: false,
        code: 403,
        error: "Forbidden: Only the designated Team Lead may request additional emergency workforce.",
      };
    }

    if (!reason || reason.trim().length < 5) {
      return {
        success: false,
        code: 400,
        error: "A clear operational justification reason is required (minimum 5 characters).",
      };
    }

    if (requestedWorkerCount < 1) {
      return {
        success: false,
        code: 400,
        error: "Requested worker count must be at least 1.",
      };
    }

    const now = new Date().toISOString();
    const reqId = crypto.randomUUID();
    const reqRecord: EmergencyAdditionalWorkerRequestRecord = {
      id: reqId,
      incident_id: incidentId,
      team_id: teamId,
      requested_by_worker_id: requestedByWorkerId,
      reason: reason.trim(),
      requested_role: requestedRole.trim(),
      requested_skill: requestedSkill?.trim() || null,
      requested_worker_count: requestedWorkerCount,
      count: requestedWorkerCount,
      status: "PENDING_FEDERATION_REVIEW",
      created_at: now,
      updated_at: now,
    };

    inMemoryRequests.set(reqId, reqRecord);
    setStoredAdditionalRequest(reqRecord);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_additional_worker_requests") as any).insert({
        id: reqRecord.id,
        incident_id: reqRecord.incident_id,
        team_id: reqRecord.team_id,
        requested_by_worker_id: reqRecord.requested_by_worker_id,
        reason: reqRecord.reason,
        requested_role: reqRecord.requested_role,
        requested_skill: reqRecord.requested_skill,
        requested_worker_count: reqRecord.requested_worker_count,
        status: reqRecord.status,
        created_at: reqRecord.created_at,
        updated_at: reqRecord.updated_at,
      });
    } catch {
      // Memory fallback
    }

    return { success: true, code: 201, request: reqRecord };
  }

  /**
   * Lists additional worker requests for an incident
   */
  static async listAdditionalWorkerRequests(
    incidentId: string
  ): Promise<EmergencyAdditionalWorkerRequestRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_additional_worker_requests") as any)
        .select(`
          *,
          workers (
            profiles ( full_name )
          )
        `)
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((r: any) => ({
          ...r,
          requester_name: r.workers?.profiles?.full_name,
        }));
      }
    } catch {
      // Memory check
    }

    const allReqs = [...Array.from(inMemoryRequests.values()), ...listStoredAdditionalRequests()];
    const unique = new Map<string, EmergencyAdditionalWorkerRequestRecord>();
    for (const r of allReqs) {
      if (!incidentId || r.incident_id === incidentId) unique.set(r.id, r);
    }
    return Array.from(unique.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Retrieves an additional worker request by ID with memory fallback
   */
  static async getAdditionalWorkerRequestById(
    requestId: string
  ): Promise<EmergencyAdditionalWorkerRequestRecord | null> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_additional_worker_requests") as any)
        .select(`
          *,
          workers (
            profiles ( full_name )
          )
        `)
        .eq("id", requestId)
        .maybeSingle();

      if (!error && data) {
        const row = data as { workers?: { profiles?: { full_name?: string } } };
        return {
          ...data,
          requester_name: row.workers?.profiles?.full_name,
        } as EmergencyAdditionalWorkerRequestRecord;
      }
    } catch {
      // Memory fallback
    }

    return inMemoryRequests.get(requestId) || getStoredAdditionalRequest(requestId) || null;
  }

  /**
   * Updates an additional worker request in memory and database
   */
  static async updateAdditionalWorkerRequest(
    request: EmergencyAdditionalWorkerRequestRecord
  ): Promise<void> {
    inMemoryRequests.set(request.id, request);
    setStoredAdditionalRequest(request);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_additional_worker_requests") as any)
        .update({
          status: request.status,
          updated_at: request.updated_at,
        })
        .eq("id", request.id);
    } catch {
      // Memory fallback
    }
  }

  /**
   * Directly creates an emergency task in memory and database
   */
  static async createTask(task: EmergencyIncidentTaskRecord): Promise<EmergencyIncidentTaskRecord> {
    inMemoryTasks.set(task.id, task);
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incident_tasks") as any).insert({
        id: task.id,
        incident_id: task.incident_id,
        team_id: task.team_id,
        title: task.title,
        description: task.description,
        task_order: task.task_order,
        status: task.status,
        assigned_worker_id: task.assigned_worker_id,
        assigned_role: task.assigned_role,
        created_at: task.created_at,
        updated_at: task.updated_at,
      });
    } catch {
      // Memory fallback
    }
    return task;
  }

  /**
   * Updates an emergency task in memory and database
   */
  static async updateTask(
    taskId: string,
    updates: Partial<EmergencyIncidentTaskRecord>
  ): Promise<EmergencyIncidentTaskRecord | null> {
    const task = await this.getTaskById(taskId);
    if (!task) return null;
    const updated = { ...task, ...updates, updated_at: new Date().toISOString() };
    inMemoryTasks.set(taskId, updated);
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incident_tasks") as any)
        .update(updates)
        .eq("id", taskId);
    } catch {
      // Memory fallback
    }
    return updated;
  }
}

import { createAdminClient } from "@/lib/supabase/admin";
import {
  EmergencyIncidentRepository,
  EmergencyIncidentRecord,
} from "@/lib/emergency/incident-store";
import {
  EmergencyTeamRepository,
  EmergencyResponseTeamRecord,
  EmergencyTeamMemberRecord,
} from "@/lib/emergency/team-store";
import {
  EmergencyTaskRepository,
  EmergencyIncidentTaskRecord,
  EmergencyAdditionalWorkerRequestRecord,
  IncidentTaskProgress,
} from "@/lib/emergency/task-store";
import {
  EmergencyResponseMatrixRepository,
  EmergencyResponseMatrixRecord,
} from "@/lib/emergency/response-matrix-store";
import type {
  EmergencyIncidentSeverity,
  EmergencyIncidentStatus,
} from "@/supabase/types/database.types";

export interface EmergencyAuditLogRecord {
  id: string;
  incident_id: string;
  federation_id: string;
  actor_id: string;
  action_type: string;
  previous_state: Record<string, unknown>;
  new_state: Record<string, unknown>;
  notes: string | null;
  created_at: string;
  actor_name?: string;
  actor_role?: string;
}

export interface EmergencySupportRequestRecord {
  id: string;
  incident_id: string;
  requesting_federation_id: string;
  requested_by_admin_id: string;
  request_type: "ADDITIONAL_TEAM" | "EXTERNAL_FEDERATION_SUPPORT" | "SPECIALIZED_UNIT";
  target_federation_id: string | null;
  requested_roles: string[];
  requested_worker_count: number;
  reason: string;
  status: "PENDING_REVIEW" | "ACCEPTED" | "DECLINED" | "CANCELLED";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface FederationIncidentSummary {
  id: string;
  emergency_id: string;
  category_name: string;
  emergency_type: string;
  response_matrix_code: string | null;
  severity: EmergencyIncidentSeverity;
  status: string;
  location: string;
  created_at: string;
  updated_at: string;
  description: string;
  team_status: string | null;
  required_worker_count: number;
  accepted_worker_count: number;
  shortage_count: number;
  has_shortage: boolean;
  team_lead_worker_id: string | null;
  team_lead_name: string | null;
  task_progress: IncidentTaskProgress | null;
  pending_requests_count: number;
  is_archived?: boolean;
}

export interface FederationEligibleWorkerSummary {
  id: string;
  profile_id: string;
  full_name: string;
  phone: string;
  profession: string;
  hourly_rate: number;
  verification_status: string;
  availability_status: string;
  service_radius_km: number;
}

import {
  addStoredAuditLog,
  getStoredAuditLogs,
  getStoredSupportRequest,
  setStoredSupportRequest,
  listStoredSupportRequests,
} from "@/lib/emergency/persistence";

export class EmergencyControlCenterRepository {
  /**
   * Records an audit log entry for federation emergency actions
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async recordAuditLog(params: any): Promise<EmergencyAuditLogRecord> {
    const incidentId = params.incidentId || params.incident_id;
    const federationId = params.federationId || params.federation_id;
    const actorId = params.actorId || params.actor_id;
    const actionType = params.actionType || params.action_type;
    const previousState = params.previousState || params.previous_state || {};
    const newState = params.newState || params.new_state || {};
    const notes = params.notes || null;
    const now = new Date().toISOString();
    const logId = crypto.randomUUID();

    const record: EmergencyAuditLogRecord = {
      id: logId,
      incident_id: incidentId,
      federation_id: federationId,
      actor_id: actorId,
      action_type: actionType,
      previous_state: previousState,
      new_state: newState,
      notes: notes || null,
      created_at: now,
    };

    // Store in global persistence
    addStoredAuditLog(incidentId, record);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_audit_logs") as any).insert({
        id: record.id,
        incident_id: record.incident_id,
        federation_id: record.federation_id,
        actor_id: record.actor_id,
        action_type: record.action_type,
        previous_state: record.previous_state,
        new_state: record.new_state,
        notes: record.notes,
        created_at: record.created_at,
      });
    } catch {
      // Memory fallback
    }

    return record;
  }

  /**
   * Lists chronological audit logs for an emergency incident
   */
  static async listAuditLogs(incidentId: string): Promise<EmergencyAuditLogRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_audit_logs") as any)
        .select(
          `
          *,
          profiles:actor_id (
            full_name,
            role
          )
        `
        )
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((d: any) => ({
          ...d,
          actor_name: d.profiles?.full_name || "Federation Administrator",
          actor_role: d.profiles?.role || "FEDERATION_ADMIN",
        }));
      }
    } catch {
      // Memory fallback
    }

    return getStoredAuditLogs(incidentId);
  }

  static async listAuditLogsForIncident(incidentId: string): Promise<EmergencyAuditLogRecord[]> {
    return this.listAuditLogs(incidentId);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createAuditLog(params: any): Promise<EmergencyAuditLogRecord> {
    return this.recordAuditLog(params);
  }

  /**
   * Lists emergency incidents strictly scoped to a federation
   */
  static async listIncidentsForFederation(
    federationId: string,
    filters?: {
      status?: string;
      severity?: string;
      category?: string;
      search?: string;
      hasShortage?: boolean;
      includeArchived?: boolean;
    }
  ): Promise<FederationIncidentSummary[]> {
    let incidents: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from("emergency_incidents") as any)
        .select("*")
        .eq("federation_id", federationId)
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "ALL" && filters.status !== "ARCHIVED") {
        query = query.eq("status", filters.status);
      } else if (!filters?.includeArchived && (!filters?.status || filters.status === "ALL")) {
        query = query.neq("status", "CANCELLED");
      }
      if (filters?.severity && filters.severity !== "ALL") {
        query = query.eq("severity", filters.severity);
      }
      if (filters?.category && filters.category !== "ALL") {
        query = query.eq("category_name", filters.category);
      }

      const { data, error } = await query;
      if (!error && data) {
        incidents = data;
      }
    } catch {
      // Memory fallback
    }

    if (incidents.length === 0) {
      // Fallback: check in-memory incidents from EmergencyIncidentRepository
      const memoryIncidents = await EmergencyIncidentRepository.listIncidents({ federationId });
      incidents = memoryIncidents;
      if (filters?.status && filters.status !== "ALL" && filters.status !== "ARCHIVED") {
        incidents = incidents.filter((inc) => inc.status === filters.status);
      } else if (!filters?.includeArchived && (!filters?.status || filters.status === "ALL")) {
        incidents = incidents.filter((inc) => inc.status !== "CANCELLED");
      }
      if (filters?.severity && filters.severity !== "ALL") {
        incidents = incidents.filter((inc) => inc.severity === filters.severity);
      }
      if (filters?.category && filters.category !== "ALL") {
        incidents = incidents.filter((inc) => inc.category_name === filters.category);
      }
    }

    // Double safeguard: ensure cancelled incidents never leak into default active view
    if (!filters?.includeArchived && (!filters?.status || filters.status === "ALL")) {
      incidents = incidents.filter((inc) => inc.status !== "CANCELLED");
    }

    // Filter by archive status
    if (filters?.status === "ARCHIVED") {
      incidents = incidents.filter((inc) => inc.metadata?.is_archived === true);
    } else if (!filters?.includeArchived) {
      // By default, exclude archived incidents from active list
      incidents = incidents.filter((inc) => !inc.metadata?.is_archived);
    }

    if (filters?.search) {
      const s = filters.search.toLowerCase();
      incidents = incidents.filter(
        (inc) =>
          inc.emergency_id?.toLowerCase().includes(s) ||
          inc.emergency_type?.toLowerCase().includes(s) ||
          inc.location?.toLowerCase().includes(s)
      );
    }

    // Enrich each incident in parallel with operational team, tasks, and shortage metrics
    const rawSummaries = await Promise.all(
      incidents.map(async (inc) => {
        const [team, progress, additionalRequests] = await Promise.all([
          EmergencyTeamRepository.getTeamByIncidentId(inc.id),
          EmergencyTaskRepository.calculateProgress(inc.id),
          EmergencyTaskRepository.listAdditionalWorkerRequests(inc.id),
        ]);

        const pendingReqs = additionalRequests.filter(
          (r) => r.status === "PENDING_FEDERATION_REVIEW"
        );

        // Matrix lookup for baseline staffing requirement
        let requiredCount = team?.required_worker_count || 0;
        if (!requiredCount && inc.emergency_type) {
          const matrix = await EmergencyResponseMatrixRepository.findByEmergencyType(
            inc.emergency_type
          );
          requiredCount = matrix?.recommended_worker_count || 1;
        }

        const acceptedCount = team?.accepted_worker_count || 0;
        const shortageCount = Math.max(0, requiredCount - acceptedCount);
        const hasShortage =
          shortageCount > 0 && inc.status !== "RESOLVED" && inc.status !== "CLOSED" && inc.status !== "CANCELLED";

        if (filters?.hasShortage !== undefined) {
          if (filters.hasShortage && !hasShortage) return null;
          if (!filters.hasShortage && hasShortage) return null;
        }

        // Team Lead lookup
        let teamLeadName: string | null = null;
        if (team?.team_lead_worker_id && team.members) {
          const leadMember = team.members.find((m) => m.worker_id === team.team_lead_worker_id);
          teamLeadName = leadMember?.worker_name || null;
        }

        return {
          id: inc.id,
          emergency_id: inc.emergency_id,
          category_name: inc.category_name,
          emergency_type: inc.emergency_type,
          response_matrix_code: inc.response_matrix_code,
          severity: inc.severity,
          status: inc.status,
          location: inc.location,
          created_at: inc.created_at,
          updated_at: inc.updated_at,
          description: inc.description,
          team_status: team?.status || null,
          required_worker_count: requiredCount,
          accepted_worker_count: acceptedCount,
          shortage_count: shortageCount,
          has_shortage: hasShortage,
          team_lead_worker_id: team?.team_lead_worker_id || null,
          team_lead_name: teamLeadName,
          task_progress: progress.total > 0 ? progress : null,
          pending_requests_count: pendingReqs.length,
          is_archived: inc.metadata?.is_archived === true,
        };
      })
    );

    const summaries = rawSummaries.filter(Boolean) as FederationIncidentSummary[];

    return summaries;
  }

  /**
   * Retrieves complete operational control detail packet for an incident
   */
  static async getIncidentControlDetail(params: {
    incidentId: string;
    federationId: string;
    isSuperAdmin?: boolean;
  }): Promise<{
    incident: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    responseMatrix: EmergencyResponseMatrixRecord | null;
    team: EmergencyResponseTeamRecord | null;
    teams: EmergencyResponseTeamRecord[];
    tasks: EmergencyIncidentTaskRecord[];
    taskProgress: IncidentTaskProgress | null;
    shortage: {
      required: number;
      accepted: number;
      missing: number;
      hasShortage: boolean;
      pendingAdditionalRequests: number;
    };
    additionalRequests: EmergencyAdditionalWorkerRequestRecord[];
    supportRequests: EmergencySupportRequestRecord[];
    eligibleWorkers: FederationEligibleWorkerSummary[];
    auditLogs: EmergencyAuditLogRecord[];
  } | null> {
    const { incidentId, federationId, isSuperAdmin = false } = params;

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) return null;

    // Strict Federation Scoping Check
    const incFedId = (incident.federation_id || "").trim().toLowerCase();
    const adminFedId = (federationId || "").trim().toLowerCase();
    if (!isSuperAdmin && (!incFedId || !adminFedId || incFedId !== adminFedId)) {
      return null;
    }

    // Fetch customer info and independent emergency repositories in parallel
    const [
      custProfRes,
      responseMatrix,
      team,
      teams,
      tasks,
      additionalRequests,
      supportRequests,
      auditLogs,
    ] = await Promise.all([
      (async () => {
        try {
          const supabase = createAdminClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data } = await (supabase.from("profiles") as any)
            .select("full_name, phone, email")
            .eq("id", incident.customer_id)
            .maybeSingle();
          return data;
        } catch {
          return null;
        }
      })(),
      EmergencyResponseMatrixRepository.findByEmergencyType(incident.emergency_type),
      EmergencyTeamRepository.getTeamByIncidentId(incidentId),
      EmergencyTeamRepository.listTeamsForIncident(incidentId),
      EmergencyTaskRepository.listTasksForIncident(incidentId),
      EmergencyTaskRepository.listAdditionalWorkerRequests(incidentId),
      this.listSupportRequestsForIncident(incidentId),
      this.listAuditLogs(incidentId),
    ]);

    const customerInfo = custProfRes
      ? {
          fullName: custProfRes.full_name,
          phone: custProfRes.phone,
          email: custProfRes.email,
        }
      : {};

    const [taskProgress, teamMembers] = await Promise.all([
      tasks.length > 0 ? EmergencyTaskRepository.calculateProgress(incidentId) : null,
      team ? EmergencyTeamRepository.listTeamMembers(team.id) : [],
    ]);
    const excludedWorkerIds = teamMembers
      .filter((m) => m.status !== "RELEASED")
      .map((m) => m.worker_id);
    const targetFedId = incident.federation_id || federationId;
    const eligibleWorkers = await this.getFederationEligibleWorkers({
      federationId: targetFedId,
      skills: responseMatrix?.required_skills,
      incident,
      responseMatrix,
      excludedWorkerIds,
    });

    const required = team?.required_worker_count || responseMatrix?.recommended_worker_count || 1;
    const accepted = team?.accepted_worker_count || 0;
    const missing = Math.max(0, required - accepted);
    const hasShortage =
      missing > 0 && incident.status !== "RESOLVED" && incident.status !== "CLOSED";
    const pendingAdd = additionalRequests.filter(
      (r) => r.status === "PENDING_FEDERATION_REVIEW"
    ).length;

    return {
      incident: {
        ...incident,
        emergencyId: incident.emergency_id,
        categoryName: incident.category_name,
        emergencyType: incident.emergency_type,
        customerName: customerInfo.fullName || "Customer",
        customerPhone: customerInfo.phone || "N/A",
        customerEmail: customerInfo.email || "N/A",
      },
      responseMatrix,
      team: team || null,
      teams,
      tasks,
      taskProgress,
      shortage: {
        required,
        accepted,
        missing,
        hasShortage,
        pendingAdditionalRequests: pendingAdd,
      },
      additionalRequests,
      supportRequests,
      eligibleWorkers,
      auditLogs,
    };
  }

  /**
   * Modifies emergency incident severity and records audit log
   */
  static async changeSeverity(params: {
    incidentId: string;
    federationId: string;
    actorId: string;
    newSeverity: EmergencyIncidentSeverity;
    reason?: string;
    isSuperAdmin?: boolean;
  }): Promise<{
    success: boolean;
    code: number;
    error?: string;
    incident?: EmergencyIncidentRecord;
  }> {
    const { incidentId, federationId, actorId, newSeverity, reason, isSuperAdmin = false } = params;

    const allowedSeverities: EmergencyIncidentSeverity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (!allowedSeverities.includes(newSeverity)) {
      return {
        success: false,
        code: 400,
        error: `Invalid severity level: '${newSeverity}'. Must be LOW, MEDIUM, HIGH, or CRITICAL.`,
      };
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return { success: false, code: 404, error: "Emergency incident not found." };
    }

    if (!isSuperAdmin && incident.federation_id !== federationId) {
      return {
        success: false,
        code: 403,
        error:
          "Forbidden: You do not have administrative authority over this incident's federation.",
      };
    }

    const previousSeverity = incident.severity;
    if (previousSeverity === newSeverity) {
      return { success: true, code: 200, incident };
    }

    // Update incident severity in repository & database
    const now = new Date().toISOString();
    incident.severity = newSeverity;
    incident.updated_at = now;

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incidents") as any)
        .update({
          severity: newSeverity,
          updated_at: now,
        })
        .eq("id", incidentId);
    } catch {
      // Memory fallback
    }

    // Record Audit Log
    await this.recordAuditLog({
      incidentId,
      federationId,
      actorId,
      actionType: "SEVERITY_CHANGED",
      previousState: { severity: previousSeverity },
      newState: { severity: newSeverity },
      notes: reason || `Severity modified from ${previousSeverity} to ${newSeverity}`,
    });

    return { success: true, code: 200, incident };
  }

  /**
   * Reviews an additional worker request (Approve / Reject)
   */
  static async reviewAdditionalWorkerRequest(params: {
    requestId: string;
    federationId: string;
    actorId: string;
    action: "APPROVE" | "REJECT";
    reason?: string;
    isSuperAdmin?: boolean;
  }): Promise<{
    success: boolean;
    code: number;
    error?: string;
    request?: EmergencyAdditionalWorkerRequestRecord;
  }> {
    const { requestId, federationId, actorId, action, reason, isSuperAdmin = false } = params;

    if (action !== "APPROVE" && action !== "REJECT") {
      return { success: false, code: 400, error: "Invalid action. Must be APPROVE or REJECT." };
    }

    if (action === "REJECT" && (!reason || reason.trim().length < 3)) {
      return {
        success: false,
        code: 400,
        error: "A clear rejection reason is mandatory when rejecting support requests.",
      };
    }

    // Find request
    const request = await EmergencyTaskRepository.getAdditionalWorkerRequestById(requestId);

    if (!request) {
      return { success: false, code: 404, error: "Additional worker request not found." };
    }

    // Scoping: verify incident federation
    const incident = await EmergencyIncidentRepository.findById(request.incident_id);
    if (!incident) {
      return { success: false, code: 404, error: "Associated emergency incident not found." };
    }

    if (!isSuperAdmin && incident.federation_id !== federationId) {
      return {
        success: false,
        code: 403,
        error: "Forbidden: You cannot review requests for incidents outside your federation.",
      };
    }

    if (request.status !== "PENDING_FEDERATION_REVIEW") {
      return {
        success: false,
        code: 409,
        error: `Request has already been reviewed (Current Status: ${request.status}).`,
      };
    }

    const previousStatus = request.status;
    const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
    const now = new Date().toISOString();

    const updatedRequest: EmergencyAdditionalWorkerRequestRecord = {
      ...request,
      status: newStatus,
      updated_at: now,
    };

    await EmergencyTaskRepository.updateAdditionalWorkerRequest(updatedRequest);

    // Record Audit Log
    await this.recordAuditLog({
      incidentId: request.incident_id,
      federationId,
      actorId,
      actionType:
        action === "APPROVE" ? "ADDITIONAL_WORKER_APPROVED" : "ADDITIONAL_WORKER_REJECTED",
      previousState: { status: previousStatus, requestId },
      newState: {
        status: newStatus,
        count: request.requested_worker_count,
        role: request.requested_role,
      },
      notes:
        reason ||
        (action === "APPROVE"
          ? "Approved by Federation Administrator"
          : "Rejected by Federation Administrator"),
    });

    return { success: true, code: 200, request: updatedRequest };
  }

  /**
   * Adds an eligible worker to an emergency response team
   */
  static async addWorkerToTeam(params: {
    incidentId: string;
    federationId: string;
    actorId: string;
    workerId: string;
    role: string;
    isSuperAdmin?: boolean;
  }): Promise<{
    success: boolean;
    code: number;
    error?: string;
    member?: EmergencyTeamMemberRecord;
  }> {
    const { incidentId, federationId, actorId, workerId, role, isSuperAdmin = false } = params;

    if (!workerId || !role) {
      return { success: false, code: 400, error: "workerId and role are required." };
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return { success: false, code: 404, error: "Emergency incident not found." };
    }

    if (!isSuperAdmin && incident.federation_id !== federationId) {
      return {
        success: false,
        code: 403,
        error: "Forbidden: Incident belongs to another federation.",
      };
    }

    let team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
    if (!team) {
      // If team doesn't exist yet (e.g. initial staffing shortage), form initial team
      const responseMatrix = await EmergencyResponseMatrixRepository.findByEmergencyType(
        incident.emergency_type
      );
      const teamId = crypto.randomUUID();
      const now = new Date().toISOString();
      const initialTeam: EmergencyResponseTeamRecord = {
        id: teamId,
        incident_id: incidentId,
        federation_id: incident.federation_id || federationId,
        team_type: "PRIMARY",
        status: "FORMING",
        team_lead_worker_id: null,
        requires_team_lead: responseMatrix?.team_lead_required ?? true,
        required_worker_count: responseMatrix?.recommended_worker_count || 1,
        accepted_worker_count: 0,
        created_at: now,
        updated_at: now,
        members: [],
      };
      team = await EmergencyTeamRepository.registerTeam(initialTeam, []);

      // Initialize initial tasks from matrix if available
      if (responseMatrix?.initial_tasks && responseMatrix.initial_tasks.length > 0) {
        await EmergencyTaskRepository.createInitialTasksForIncident(
          incidentId,
          teamId,
          responseMatrix.initial_tasks
        );
      }
    }

    // Verify worker eligibility in federation
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: workerRec } = await (supabase.from("workers") as any)
      .select(
        `
        id,
        federation_id,
        verification_status,
        account_status,
        availability_status,
        profession,
        profiles ( full_name, phone )
      `
      )
      .eq("id", workerId)
      .maybeSingle();

    if (!workerRec) {
      return { success: false, code: 404, error: "Worker not found." };
    }

    if (!isSuperAdmin && workerRec.federation_id !== federationId) {
      return {
        success: false,
        code: 403,
        error: "Worker belongs to a different cooperative federation.",
      };
    }

    if (String(workerRec.verification_status).toLowerCase() !== "verified") {
      return {
        success: false,
        code: 400,
        error: "Worker is not verified for emergency deployment.",
      };
    }

    if (String(workerRec.account_status).toUpperCase() !== "ACTIVE") {
      return { success: false, code: 400, error: "Worker account is suspended or inactive." };
    }

    // Check duplicate membership
    const members = await EmergencyTeamRepository.listTeamMembers(team.id);
    const existingMember = members.find((m) => m.worker_id === workerId && m.status !== "RELEASED");
    if (existingMember) {
      return {
        success: false,
        code: 409,
        error: "Worker is already an active member of this emergency response team.",
      };
    }

    // Insert new member
    const now = new Date().toISOString();
    const newMemberId = crypto.randomUUID();
    const isTeamLead =
      role.toLowerCase().includes("lead") ||
      (!team.team_lead_worker_id && (team.requires_team_lead ?? false) && members.length === 0);
    const newMember: EmergencyTeamMemberRecord = {
      id: newMemberId,
      team_id: team.id,
      incident_id: incidentId,
      worker_id: workerId,
      role,
      is_team_lead: isTeamLead,
      status: "ACTIVE",
      accepted_at: now,
      created_at: now,
      updated_at: now,
      worker_name: workerRec.profiles?.full_name,
      worker_phone: workerRec.profiles?.phone,
      profession: workerRec.profession,
    };

    if (isTeamLead && !team.team_lead_worker_id) {
      team.team_lead_worker_id = workerId;
    }

    // Update in-memory team store
    await EmergencyTeamRepository.addMember(team.id, newMember);

    // List authoritative deduplicated members
    const currentMembers = await EmergencyTeamRepository.listTeamMembers(team.id);

    // Increment accepted worker count on team
    const newAcceptedCount = currentMembers.filter(
      (m) => m.status !== "RELEASED" && m.status !== "NO_SHOW"
    ).length;
    const newRequiredCount = Math.max(team.required_worker_count, newAcceptedCount);
    const isTeamFormed = newAcceptedCount >= newRequiredCount;

    team.accepted_worker_count = newAcceptedCount;
    team.required_worker_count = newRequiredCount;
    team.status = isTeamFormed ? "FORMED" : "FORMING";
    team.updated_at = now;

    await EmergencyTeamRepository.registerTeam(team, currentMembers);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_response_team_members") as any).insert({
        id: newMember.id,
        team_id: newMember.team_id,
        incident_id: newMember.incident_id,
        worker_id: newMember.worker_id,
        role: newMember.role,
        is_team_lead: newMember.is_team_lead,
        status: newMember.status,
        accepted_at: newMember.accepted_at,
        created_at: newMember.created_at,
        updated_at: newMember.updated_at,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_response_teams") as any)
        .update({
          accepted_worker_count: newAcceptedCount,
          required_worker_count: newRequiredCount,
          status: team.status,
          team_lead_worker_id: team.team_lead_worker_id,
          updated_at: now,
        })
        .eq("id", team.id);
    } catch {
      // Fallback
    }

    // Update incident status
    try {
      const incidentStatus: EmergencyIncidentStatus = isTeamFormed ? "ACTIVE" : "TEAM_FORMING";
      await EmergencyIncidentRepository.updateIncidentStatus(incidentId, incidentStatus, actorId);
    } catch {
      // Fallback
    }

    // Synchronize worker dispatch pool status so worker dashboard sees this assignment
    try {
      const { EmergencyDispatchRepository } = await import("@/lib/emergency/dispatch-store");
      const existingDispatch = await EmergencyDispatchRepository.findDispatch(incidentId, workerId);
      if (existingDispatch) {
        await EmergencyDispatchRepository.updateDispatchStatus(
          existingDispatch.id,
          "ACCEPTED",
          now
        );
      } else {
        const dispatchRecord = {
          id: crypto.randomUUID(),
          incident_id: incidentId,
          worker_id: workerId,
          federation_id: federationId,
          required_role: role,
          matched_skills: [workerRec.profession || role],
          eligibility_score: 90,
          eligibility_reasons: { reason: "Direct Federation Administrator deployment" },
          status: "ACCEPTED" as const,
          offered_at: now,
          responded_at: now,
          notes: `Directly deployed by federation administrator ${actorId}`,
          created_at: now,
          updated_at: now,
          worker_name: workerRec.profiles?.full_name,
          profession: workerRec.profession,
        };
        await EmergencyDispatchRepository.recordDirectAssignment(dispatchRecord);
      }
    } catch {
      // Fallback
    }

    // Record Audit Log
    await this.recordAuditLog({
      incidentId,
      federationId,
      actorId,
      actionType: "WORKER_ADDED",
      previousState: { acceptedWorkerCount: members.length },
      newState: {
        addedWorkerId: workerId,
        role,
        workerName: newMember.worker_name,
        teamStatus: team.status,
      },
      notes: `Worker ${newMember.worker_name || workerId} added to emergency response team as ${role}`,
    });

    return { success: true, code: 201, member: newMember };
  }

  /**
   * Replaces a worker on an emergency response team
   */
  static async replaceWorkerOnTeam(params: {
    incidentId: string;
    federationId: string;
    actorId: string;
    existingWorkerId: string;
    replacementWorkerId: string;
    reason: string;
    isSuperAdmin?: boolean;
  }): Promise<{
    success: boolean;
    code: number;
    error?: string;
    member?: EmergencyTeamMemberRecord;
  }> {
    const {
      incidentId,
      federationId,
      actorId,
      existingWorkerId,
      replacementWorkerId,
      reason,
      isSuperAdmin = false,
    } = params;

    if (!existingWorkerId || !replacementWorkerId || !reason) {
      return {
        success: false,
        code: 400,
        error: "existingWorkerId, replacementWorkerId, and reason are required.",
      };
    }

    if (existingWorkerId === replacementWorkerId) {
      return {
        success: false,
        code: 400,
        error: "Replacement worker must be different from existing worker.",
      };
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return { success: false, code: 404, error: "Emergency incident not found." };
    }

    if (!isSuperAdmin && incident.federation_id !== federationId) {
      return {
        success: false,
        code: 403,
        error: "Forbidden: Incident belongs to another federation.",
      };
    }

    const team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
    if (!team) {
      return { success: false, code: 404, error: "No response team found for this incident." };
    }

    // Verify existing member
    const members = await EmergencyTeamRepository.listTeamMembers(team.id);
    const existingMember = members.find(
      (m) => m.worker_id === existingWorkerId && m.status !== "RELEASED"
    );
    if (!existingMember) {
      return {
        success: false,
        code: 404,
        error: "Target existing worker is not an active member of this team.",
      };
    }

    // Verify replacement worker
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: repWorkerRec } = await (supabase.from("workers") as any)
      .select(
        `
        id,
        federation_id,
        verification_status,
        account_status,
        availability_status,
        profession,
        profiles ( full_name, phone )
      `
      )
      .eq("id", replacementWorkerId)
      .maybeSingle();

    if (!repWorkerRec) {
      return { success: false, code: 404, error: "Replacement worker not found." };
    }

    if (!isSuperAdmin && repWorkerRec.federation_id !== federationId) {
      return {
        success: false,
        code: 403,
        error: "Replacement worker belongs to a different federation.",
      };
    }

    if (String(repWorkerRec.verification_status).toLowerCase() !== "verified") {
      return { success: false, code: 400, error: "Replacement worker is not verified." };
    }

    // Check if replacement is already on team
    if (members.some((m) => m.worker_id === replacementWorkerId && m.status !== "RELEASED")) {
      return { success: false, code: 409, error: "Replacement worker is already on this team." };
    }

    const now = new Date().toISOString();
    const wasLead = existingMember.is_team_lead;

    const newMemberId = crypto.randomUUID();
    const replacementMember: EmergencyTeamMemberRecord = {
      id: newMemberId,
      team_id: team.id,
      incident_id: incidentId,
      worker_id: replacementWorkerId,
      role: existingMember.role,
      is_team_lead: wasLead,
      status: "ACTIVE",
      accepted_at: now,
      created_at: now,
      updated_at: now,
      worker_name: repWorkerRec.profiles?.full_name,
      worker_phone: repWorkerRec.profiles?.phone,
      profession: repWorkerRec.profession,
    };

    // 1. Update in-memory team state
    await EmergencyTeamRepository.updateMember(team.id, existingMember.id, {
      status: "RELEASED",
      updated_at: now,
    });
    await EmergencyTeamRepository.addMember(team.id, replacementMember);
    if (wasLead) {
      await EmergencyTeamRepository.updateTeam(team.id, {
        team_lead_worker_id: replacementWorkerId,
        updated_at: now,
      });
    }

    // 2. Try updating database tables
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_response_team_members") as any)
        .update({
          status: "RELEASED",
          updated_at: now,
        })
        .eq("id", existingMember.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_response_team_members") as any).insert({
        id: replacementMember.id,
        team_id: replacementMember.team_id,
        incident_id: replacementMember.incident_id,
        worker_id: replacementMember.worker_id,
        role: replacementMember.role,
        is_team_lead: replacementMember.is_team_lead,
        status: replacementMember.status,
        accepted_at: replacementMember.accepted_at,
        created_at: replacementMember.created_at,
        updated_at: replacementMember.updated_at,
      });

      // 3. Reassign tasks from existing worker to replacement worker
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incident_tasks") as any)
        .update({
          assigned_worker_id: replacementWorkerId,
          updated_at: now,
        })
        .eq("incident_id", incidentId)
        .eq("assigned_worker_id", existingWorkerId)
        .in("status", ["ASSIGNED", "IN_PROGRESS"]);

      // 4. Update team lead if existing was lead
      if (wasLead) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("emergency_response_teams") as any)
          .update({
            team_lead_worker_id: replacementWorkerId,
            updated_at: now,
          })
          .eq("id", team.id);
      }
    } catch {
      // Fallback seamlessly
    }

    // Record Audit Log
    await this.recordAuditLog({
      incidentId,
      federationId,
      actorId,
      actionType: "WORKER_REPLACED",
      previousState: { releasedWorkerId: existingWorkerId, role: existingMember.role, wasLead },
      newState: { replacementWorkerId, role: existingMember.role, isLead: wasLead },
      notes: reason,
    });

    return { success: true, code: 200, member: replacementMember };
  }

  /**
   * Modifies the incident response plan (Add Task, Cancel Task, Update Notes)
   */
  static async modifyResponsePlan(params: {
    incidentId: string;
    federationId: string;
    actorId: string;
    action: "ADD_TASK" | "CANCEL_TASK" | "UPDATE_NOTES";
    payload: Record<string, unknown>;
    isSuperAdmin?: boolean;
  }): Promise<{ success: boolean; code: number; error?: string; result?: unknown }> {
    const { incidentId, federationId, actorId, action, payload, isSuperAdmin = false } = params;

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return { success: false, code: 404, error: "Emergency incident not found." };
    }

    if (!isSuperAdmin && incident.federation_id !== federationId) {
      return {
        success: false,
        code: 403,
        error: "Forbidden: Incident belongs to another federation.",
      };
    }

    const team = await EmergencyTeamRepository.getTeamByIncidentId(incidentId);
    const now = new Date().toISOString();

    if (action === "ADD_TASK") {
      const { title, description, assignedRole, assignedWorkerId } = payload;
      if (!title || typeof title !== "string") {
        return { success: false, code: 400, error: "Task title is required." };
      }

      const tasks = await EmergencyTaskRepository.listTasksForIncident(incidentId);
      const nextOrder = tasks.length > 0 ? Math.max(...tasks.map((t) => t.task_order)) + 1 : 1;

      const newTaskId = crypto.randomUUID();
      const newTask: EmergencyIncidentTaskRecord = {
        id: newTaskId,
        incident_id: incidentId,
        team_id: team?.id || "00000000-0000-0000-0000-000000000000",
        title: title.trim(),
        description: typeof description === "string" ? description.trim() : "",
        task_order: nextOrder,
        status: assignedWorkerId ? "ASSIGNED" : "PENDING",
        assigned_worker_id: (assignedWorkerId as string) || null,
        assigned_role: (assignedRole as string) || null,
        created_at: now,
        updated_at: now,
        started_at: null,
        completed_at: null,
        completion_notes: null,
      };

      await EmergencyTaskRepository.createTask(newTask);

      // Record audit
      await this.recordAuditLog({
        incidentId,
        federationId,
        actorId,
        actionType: "TASK_MODIFIED",
        previousState: {},
        newState: { action: "ADD_TASK", taskId: newTask.id, title: newTask.title },
        notes: `Operational task added by Federation Admin: ${newTask.title}`,
      });

      return { success: true, code: 201, result: newTask };
    }

    if (action === "CANCEL_TASK") {
      const { taskId, reason } = payload;
      if (!taskId || typeof taskId !== "string") {
        return { success: false, code: 400, error: "taskId is required to cancel a task." };
      }

      const task = await EmergencyTaskRepository.getTaskById(taskId);
      if (!task || task.incident_id !== incidentId) {
        return { success: false, code: 404, error: "Task not found for this incident." };
      }

      await EmergencyTaskRepository.updateTask(taskId, {
        status: "CANCELLED",
        completion_notes: reason ? `Cancelled: ${reason}` : "Cancelled by Federation Administrator",
      });

      // Record audit
      await this.recordAuditLog({
        incidentId,
        federationId,
        actorId,
        actionType: "TASK_MODIFIED",
        previousState: { taskId, status: task.status },
        newState: { taskId, status: "CANCELLED" },
        notes: (reason as string) || "Task cancelled by Federation Administrator",
      });

      return { success: true, code: 200, result: { id: taskId, status: "CANCELLED" } };
    }

    if (action === "UPDATE_NOTES") {
      const { notes } = payload;
      if (typeof notes !== "string") {
        return { success: false, code: 400, error: "notes string is required." };
      }

      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("emergency_incidents") as any)
          .update({
            danger_details: notes,
            updated_at: now,
          })
          .eq("id", incidentId);
      } catch {
        // Memory fallback
      }

      await this.recordAuditLog({
        incidentId,
        federationId,
        actorId,
        actionType: "RESPONSE_PLAN_MODIFIED",
        previousState: {},
        newState: { notes },
        notes: "Operational notes updated by Federation Administrator",
      });

      return { success: true, code: 200, result: { danger_details: notes } };
    }

    return { success: false, code: 400, error: "Unsupported response plan action." };
  }

  /**
   * Initiates an additional team or external federation support request
   */
  static async createSupportRequest(params: {
    incidentId: string;
    requestingFederationId: string;
    requestedByAdminId: string;
    requestType: "ADDITIONAL_TEAM" | "EXTERNAL_FEDERATION_SUPPORT" | "SPECIALIZED_UNIT";
    targetFederationId?: string;
    requestedRoles: string[];
    requestedWorkerCount: number;
    reason: string;
    adminNotes?: string;
  }): Promise<{
    success: boolean;
    code: number;
    error?: string;
    request?: EmergencySupportRequestRecord;
  }> {
    const {
      incidentId,
      requestingFederationId,
      requestedByAdminId,
      requestType,
      targetFederationId = null,
      requestedRoles,
      requestedWorkerCount,
      reason,
      adminNotes = null,
    } = params;

    if (!reason || reason.trim().length < 5) {
      return {
        success: false,
        code: 400,
        error: "A clear justification reason is required (minimum 5 characters).",
      };
    }

    if (requestedWorkerCount < 1) {
      return { success: false, code: 400, error: "Requested worker count must be at least 1." };
    }

    const now = new Date().toISOString();
    const reqId = crypto.randomUUID();

    const requestRecord: EmergencySupportRequestRecord = {
      id: reqId,
      incident_id: incidentId,
      requesting_federation_id: requestingFederationId,
      requested_by_admin_id: requestedByAdminId,
      request_type: requestType,
      target_federation_id: targetFederationId,
      requested_roles: requestedRoles,
      requested_worker_count: requestedWorkerCount,
      reason: reason.trim(),
      status: "PENDING_REVIEW",
      admin_notes: adminNotes,
      created_at: now,
      updated_at: now,
    };

    setStoredSupportRequest(requestRecord);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_support_requests") as any).insert({
        id: requestRecord.id,
        incident_id: requestRecord.incident_id,
        requesting_federation_id: requestRecord.requesting_federation_id,
        requested_by_admin_id: requestRecord.requested_by_admin_id,
        request_type: requestRecord.request_type,
        target_federation_id: requestRecord.target_federation_id,
        requested_roles: requestRecord.requested_roles,
        requested_worker_count: requestRecord.requested_worker_count,
        reason: requestRecord.reason,
        status: requestRecord.status,
        admin_notes: requestRecord.admin_notes,
        created_at: requestRecord.created_at,
        updated_at: requestRecord.updated_at,
      });
    } catch {
      // Memory fallback
    }

    // Record audit
    await this.recordAuditLog({
      incidentId,
      federationId: requestingFederationId,
      actorId: requestedByAdminId,
      actionType: "SUPPORT_REQUESTED",
      previousState: {},
      newState: {
        requestType,
        count: requestedWorkerCount,
        roles: requestedRoles,
        targetFederationId,
      },
      notes: reason,
    });

    return { success: true, code: 201, request: requestRecord };
  }

  /**
   * Lists support requests for an incident
   */
  static async listSupportRequestsForIncident(
    incidentId: string
  ): Promise<EmergencySupportRequestRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_support_requests") as any)
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as EmergencySupportRequestRecord[];
      }
    } catch {
      // Memory fallback
    }

    return listStoredSupportRequests().filter((r) => !incidentId || r.incident_id === incidentId);
  }

  /**
   * Retrieves a single support request by ID
   */
  static async findSupportRequestById(
    requestId: string
  ): Promise<EmergencySupportRequestRecord | null> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_support_requests") as any)
        .select("*")
        .eq("id", requestId)
        .maybeSingle();

      if (!error && data) {
        return data as EmergencySupportRequestRecord;
      }
    } catch {
      // Memory fallback
    }

    return getStoredSupportRequest(requestId);
  }

  /**
   * Discovers eligible verified active workers in a federation available for assignment
   */
  static async getFederationEligibleWorkers(
    paramsOrFedId:
      | string
      | {
          federationId: string;
          skills?: string[];
          incident?: EmergencyIncidentRecord;
          responseMatrix?: EmergencyResponseMatrixRecord | null;
          excludedWorkerIds?: string[];
        },
    legacySkills?: string[]
  ): Promise<FederationEligibleWorkerSummary[]> {
    const federationId = (
      typeof paramsOrFedId === "string"
        ? paramsOrFedId
        : paramsOrFedId.incident?.federation_id || paramsOrFedId.federationId || ""
    ).trim();
    const skills =
      typeof paramsOrFedId === "string" ? legacySkills : paramsOrFedId.skills || legacySkills;
    const incident = typeof paramsOrFedId === "object" ? paramsOrFedId.incident : undefined;
    const responseMatrix =
      typeof paramsOrFedId === "object" ? paramsOrFedId.responseMatrix : undefined;
    const excludedWorkerIds =
      typeof paramsOrFedId === "object" ? paramsOrFedId.excludedWorkerIds : undefined;

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("workers") as any)
        .select(
          `
          id,
          profile_id,
          federation_id,
          profession,
          hourly_rate,
          experience_years,
          verification_status,
          account_status,
          availability_status,
          service_radius_km,
          current_latitude,
          current_longitude,
          profiles ( full_name, phone, email ),
          worker_skills (
            skill_id,
            proficiency_level,
            skills ( id, name )
          ),
          worker_certifications (
            id,
            certification_id,
            certificate_number,
            is_verified,
            status,
            expiry_date,
            certifications ( title )
          )
        `
        )
        .eq("federation_id", federationId)
        .eq("verification_status", "verified")
        .eq("account_status", "ACTIVE")
        .eq("availability_status", "AVAILABLE")
        .limit(50);

      if (!error && data && data.length > 0) {
        const { EmergencyDispatchRepository } = await import("@/lib/emergency/dispatch-store");

        let resolvedMatrix = responseMatrix;
        if (!resolvedMatrix && incident) {
          resolvedMatrix = await EmergencyResponseMatrixRepository.findByEmergencyType(
            incident.emergency_type
          );
        }

        const eligibleList: (FederationEligibleWorkerSummary & { score?: number })[] = [];

        for (const w of data) {
          if (excludedWorkerIds && excludedWorkerIds.includes(w.id)) {
            continue;
          }

          if (incident && resolvedMatrix) {
            const evalResult = await EmergencyDispatchRepository.evaluateWorkerEligibility(
              w,
              incident,
              resolvedMatrix,
              { excludedWorkerIds, targetFederationId: federationId }
            );

            if (evalResult.isEligible) {
              eligibleList.push({
                id: w.id,
                profile_id: w.profile_id,
                full_name: w.profiles?.full_name || "Cooperative Worker",
                phone: w.profiles?.phone || "N/A",
                profession: w.profession,
                hourly_rate: w.hourly_rate || 0,
                verification_status: w.verification_status,
                availability_status: w.availability_status,
                service_radius_km: w.service_radius_km || 15,
                score: evalResult.score,
              });
            }
          } else {
            // Fallback matching against skills/profession if incident is not provided
            const wSkills: string[] = Array.isArray(w.worker_skills)
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                w.worker_skills.map((ws: any) => ws.skills?.name || "").filter(Boolean)
              : [];
            if (w.profession) wSkills.push(w.profession);

            const targetSkills = (skills || []).map((s) => s.toLowerCase().trim());
            let isMatch = targetSkills.length === 0;

            if (!isMatch) {
              isMatch = targetSkills.some((ts) =>
                wSkills.some((ws) => {
                  const normWs = ws.toLowerCase().trim();
                  return (
                    normWs === ts ||
                    normWs.includes(ts) ||
                    ts.includes(normWs) ||
                    (normWs === "plumber" && ts.includes("plumb")) ||
                    (normWs === "electrician" && (ts.includes("electr") || ts.includes("power")))
                  );
                })
              );
            }

            if (isMatch) {
              eligibleList.push({
                id: w.id,
                profile_id: w.profile_id,
                full_name: w.profiles?.full_name || "Cooperative Worker",
                phone: w.profiles?.phone || "N/A",
                profession: w.profession,
                hourly_rate: w.hourly_rate || 0,
                verification_status: w.verification_status,
                availability_status: w.availability_status,
                service_radius_km: w.service_radius_km || 15,
                score: 50,
              });
            }
          }
        }

        // Sort by evaluation score descending
        eligibleList.sort((a, b) => (b.score || 0) - (a.score || 0));
        return eligibleList.map((item) => {
          delete item.score;
          return item;
        });
      }
    } catch {
      // Fallback
    }

    return [];
  }
}

import { createAdminClient } from "@/lib/supabase/admin";
import type { EmergencyIncidentStatus, EmergencyIncidentSeverity } from "@/supabase/types/database.types";
import {
  EmergencyResponseMatrixRepository,
  EmergencyResponseMatrixRecord,
} from "@/lib/emergency/response-matrix-store";

export interface EmergencyIncidentRecord {
  id: string;
  emergency_id: string;
  customer_id: string;
  federation_id: string | null;
  category_name: string;
  emergency_type: string;
  response_matrix_code?: string | null;
  severity: EmergencyIncidentSeverity;
  status: EmergencyIncidentStatus;
  location: string;
  address_details: Record<string, unknown>;
  description: string;
  evidence_photos: string[];
  approx_people_affected: number;
  immediate_danger: boolean;
  danger_details: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Task 8 Verification & Resolution Fields
  is_verified?: boolean;
  verified_at?: string | null;
  verified_by_worker_id?: string | null;
  verification_code?: string;
  verification_token?: string;
  resolution_requested_at?: string | null;
  resolution_requested_by_worker_id?: string | null;
  resolution_summary?: string | null;
  completed_work?: string | null;
  remaining_concerns?: string | null;
  resolution_evidence_photos?: string[];
  resolved_at?: string | null;
  closed_at?: string | null;
  closed_by_admin_id?: string | null;
  closure_notes?: string | null;
}

import {
  getStoredIncident,
  setStoredIncident,
  listStoredIncidents,
} from "@/lib/emergency/persistence";

export class EmergencyIncidentRepository {
  /**
   * Inserts an incident into Supabase emergency_incidents with in-memory persistence fallback
   */
  static async insertIncident(record: EmergencyIncidentRecord): Promise<EmergencyIncidentRecord> {
    // Task 8: Ensure verification token & code are generated for the customer
    if (!record.verification_code) {
      try {
        const { EmergencyVerificationRepository } = await import("@/lib/emergency/verification-store");
        const v = await EmergencyVerificationRepository.generateVerification(record.id);
        record.verification_code = v.verification_code;
        record.verification_token = v.verification_token;
      } catch {
        // In-memory fallback code
        record.verification_code = `EMG-${record.emergency_id.slice(-4)}`;
      }
    }

    setStoredIncident(record);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_incidents") as any)
        .insert({
          id: record.id,
          emergency_id: record.emergency_id,
          customer_id: record.customer_id,
          federation_id: record.federation_id,
          category_name: record.category_name,
          emergency_type: record.emergency_type,
          response_matrix_code: record.response_matrix_code || null,
          severity: record.severity,
          status: record.status,
          location: record.location,
          address_details: record.address_details,
          description: record.description,
          evidence_photos: record.evidence_photos,
          approx_people_affected: record.approx_people_affected,
          immediate_danger: record.immediate_danger,
          danger_details: record.danger_details,
          metadata: record.metadata,
          created_at: record.created_at,
          updated_at: record.updated_at,
        })
        .select()
        .maybeSingle();

      if (!error && data) {
        return data as EmergencyIncidentRecord;
      }
    } catch {
      // Fallback seamlessly to in-memory record
    }

    return record;
  }

  /**
   * Retrieves an incident by internal UUID or human-readable Emergency ID
   */
  static async findById(idOrEmergencyId: string): Promise<EmergencyIncidentRecord | null> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_incidents") as any)
        .select("*")
        .or(`id.eq.${idOrEmergencyId},emergency_id.eq.${idOrEmergencyId}`)
        .maybeSingle();

      if (!error && data) {
        setStoredIncident(data);
        return data as EmergencyIncidentRecord;
      }
    } catch {
      // Fall through to memory
    }

    return getStoredIncident(idOrEmergencyId);
  }

  /**
   * Retrieves incidents for a specific customer or all incidents for admins
   */
  static async listIncidents(filters?: {
    customerId?: string;
    federationId?: string;
    status?: EmergencyIncidentStatus;
  }): Promise<EmergencyIncidentRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from("emergency_incidents") as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.customerId) {
        query = query.eq("customer_id", filters.customerId);
      }
      if (filters?.federationId) {
        query = query.eq("federation_id", filters.federationId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        for (const item of data) {
          setStoredIncident(item);
        }
        return data as EmergencyIncidentRecord[];
      }
    } catch {
      // Fall through to memory
    }

    let records = listStoredIncidents();
    if (filters?.customerId) {
      records = records.filter((r) => r.customer_id === filters.customerId);
    }
    if (filters?.federationId) {
      const targetFed = filters.federationId.trim().toLowerCase();
      records = records.filter(
        (r) => (r.federation_id || "").trim().toLowerCase() === targetFed
      );
    }
    if (filters?.status) {
      records = records.filter((r) => r.status === filters.status);
    }

    return records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Updates an incident status - strictly controlled by role
   */
  static async updateIncidentStatus(
    id: string,
    newStatus: EmergencyIncidentStatus,
    updatedByRole: string
  ): Promise<{ success: boolean; error?: string; record?: EmergencyIncidentRecord }> {
    if (updatedByRole === "CUSTOMER") {
      return {
        success: false,
        error: "Customers are strictly forbidden from modifying incident status.",
      };
    }

    const existing = await this.findById(id);
    if (!existing) {
      return { success: false, error: "Incident not found" };
    }

    const updated: EmergencyIncidentRecord = {
      ...existing,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    setStoredIncident(updated);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incidents") as any)
        .update({ status: newStatus, updated_at: updated.updated_at })
        .eq("id", existing.id);
    } catch {
      // Quiet fallback
    }

    return { success: true, record: updated };
  }

  /**
   * Resolves the deterministic Response Matrix entry for an incident
   */
  static async getIncidentResponseMatrix(
    idOrEmergencyId: string
  ): Promise<EmergencyResponseMatrixRecord | null> {
    const incident = await this.findById(idOrEmergencyId);
    if (!incident) return null;

    if (incident.response_matrix_code) {
      const byCode = await EmergencyResponseMatrixRepository.findByCode(incident.response_matrix_code);
      if (byCode) return byCode;
    }

    return EmergencyResponseMatrixRepository.findByEmergencyType(incident.emergency_type);
  }

  /**
   * Team Lead requests resolution for an emergency incident
   */
  static async requestResolution(params: {
    incidentId: string;
    workerId: string;
    resolutionSummary: string;
    completedWork: string;
    remainingConcerns?: string;
    resolutionEvidencePhotos?: string[];
  }): Promise<{ success: boolean; record?: EmergencyIncidentRecord; error?: string; statusCode?: number }> {
    const { incidentId, workerId, resolutionSummary, completedWork, remainingConcerns, resolutionEvidencePhotos } = params;

    const incident = await this.findById(incidentId);
    if (!incident) {
      return { success: false, error: "Emergency incident not found.", statusCode: 404 };
    }

    if (incident.status === "CLOSED") {
      return { success: false, error: "Cannot request resolution on an already closed emergency.", statusCode: 400 };
    }

    // Verify worker is member / Team Lead of this incident
    const { EmergencyTeamRepository } = await import("@/lib/emergency/team-store");
    const team = await EmergencyTeamRepository.getTeamByIncidentId(incident.id);
    if (!team) {
      return { success: false, error: "No response team found for this incident.", statusCode: 400 };
    }

    const isMember = (team.members || []).some((m) => m.worker_id === workerId);
    if (!isMember) {
      return { success: false, error: "Forbidden: Only assigned team members may request resolution.", statusCode: 403 };
    }

    const now = new Date().toISOString();
    const updated: EmergencyIncidentRecord = {
      ...incident,
      status: "RESOLVED",
      resolution_requested_at: now,
      resolution_requested_by_worker_id: workerId,
      resolution_summary: resolutionSummary.trim(),
      completed_work: completedWork.trim(),
      remaining_concerns: remainingConcerns?.trim() || null,
      resolution_evidence_photos: resolutionEvidencePhotos || [],
      resolved_at: now,
      updated_at: now,
    };

    setStoredIncident(updated);

    // Update team field status to READY_FOR_RESOLUTION
    await EmergencyTeamRepository.updateFieldStatus(team.id, "READY_FOR_RESOLUTION");

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incidents") as any)
        .update({
          status: "RESOLVED",
          resolution_requested_at: now,
          resolution_requested_by_worker_id: workerId,
          resolution_summary: updated.resolution_summary,
          completed_work: updated.completed_work,
          remaining_concerns: updated.remaining_concerns,
          resolution_evidence_photos: updated.resolution_evidence_photos,
          resolved_at: now,
          updated_at: now,
        })
        .eq("id", incident.id);
    } catch {
      // In-memory fallback
    }

    // Audit log
    try {
      if (incident.federation_id) {
        const { EmergencyControlCenterRepository } = await import("@/lib/emergency/control-center-store");
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: workerRec } = await (supabase.from("workers") as any)
          .select("profile_id")
          .eq("id", workerId)
          .maybeSingle();

        const actorProfileId = workerRec?.profile_id || workerId;
        await EmergencyControlCenterRepository.createAuditLog({
          incident_id: incident.id,
          federation_id: incident.federation_id,
          actor_id: actorProfileId,
          action_type: "RESOLUTION_REQUESTED",
          previous_state: { status: incident.status, team_field_status: team.field_status },
          new_state: { status: "RESOLVED", team_field_status: "READY_FOR_RESOLUTION", resolution_summary: updated.resolution_summary },
          notes: `Resolution requested by worker ${workerId}: ${resolutionSummary}`,
        });
      }
    } catch {
      // Resilient
    }

    return { success: true, record: updated };
  }

  /**
   * Federation Admin reviews resolution and closes or reopens the incident
   */
  static async reviewClosure(params: {
    incidentId: string;
    adminProfileId: string;
    action: "APPROVE" | "REOPEN";
    closureNotes?: string;
  }): Promise<{ success: boolean; record?: EmergencyIncidentRecord; error?: string; statusCode?: number }> {
    const { incidentId, adminProfileId, action, closureNotes } = params;

    const incident = await this.findById(incidentId);
    if (!incident) {
      return { success: false, error: "Emergency incident not found.", statusCode: 404 };
    }

    const now = new Date().toISOString();
    let newStatus: EmergencyIncidentStatus = incident.status;
    let updated: EmergencyIncidentRecord;

    const { EmergencyTeamRepository } = await import("@/lib/emergency/team-store");
    const team = await EmergencyTeamRepository.getTeamByIncidentId(incident.id);

    if (action === "APPROVE") {
      newStatus = "CLOSED";
      updated = {
        ...incident,
        status: newStatus,
        closed_at: now,
        closed_by_admin_id: adminProfileId,
        closure_notes: closureNotes?.trim() || "Incident resolution verified and closed by Federation Admin.",
        updated_at: now,
      };

      if (team) {
        await EmergencyTeamRepository.updateTeam(team.id, {
          status: "DISBANDED",
          field_status: "RESOLVED",
          updated_at: now,
        });
        const members = await EmergencyTeamRepository.listTeamMembers(team.id);
        for (const m of members) {
          if (m.status !== "RELEASED" && m.status !== "NO_SHOW") {
            await EmergencyTeamRepository.updateMember(team.id, m.id, {
              status: "RELEASED",
              updated_at: now,
            });
          }
        }
      }
    } else {
      // REOPEN / Request Further Work
      newStatus = "ACTIVE";
      updated = {
        ...incident,
        status: newStatus,
        closure_notes: closureNotes?.trim() || "Further work requested by Federation Admin.",
        updated_at: now,
      };

      if (team) {
        await EmergencyTeamRepository.updateFieldStatus(team.id, "WORK_IN_PROGRESS");
      }
    }

    setStoredIncident(updated);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incidents") as any)
        .update({
          status: newStatus,
          closed_at: updated.closed_at || null,
          closed_by_admin_id: updated.closed_by_admin_id || null,
          closure_notes: updated.closure_notes,
          updated_at: now,
        })
        .eq("id", incident.id);
    } catch {
      // Fallback
    }

    // Audit log
    try {
      if (incident.federation_id) {
        const { EmergencyControlCenterRepository } = await import("@/lib/emergency/control-center-store");
        await EmergencyControlCenterRepository.createAuditLog({
          incident_id: incident.id,
          federation_id: incident.federation_id,
          actor_id: adminProfileId,
          action_type: action === "APPROVE" ? "EMERGENCY_CLOSED" : "EMERGENCY_REOPENED",
          previous_state: { status: incident.status },
          new_state: { status: newStatus, closure_notes: updated.closure_notes },
          notes: action === "APPROVE" ? `Emergency resolution approved and closed.` : `Emergency reopened for further work. Notes: ${closureNotes || "None"}`,
        });
      }
    } catch {
      // Resilient
    }

    return { success: true, record: updated };
  }

  /**
   * Federation Admin cancels an active emergency incident
   */
  static async cancelIncident(params: {
    incidentId: string;
    adminProfileId: string;
    reason: string;
  }): Promise<{ success: boolean; record?: EmergencyIncidentRecord; error?: string; statusCode?: number }> {
    const { incidentId, adminProfileId, reason } = params;
    if (!reason || reason.trim().length === 0) {
      return { success: false, error: "Cancellation reason is required.", statusCode: 400 };
    }

    const incident = await this.findById(incidentId);
    if (!incident) {
      return { success: false, error: "Emergency incident not found.", statusCode: 404 };
    }

    if (incident.status === "CLOSED" || incident.status === "CANCELLED") {
      return {
        success: false,
        error: `Cannot cancel an incident that is already ${incident.status.toLowerCase()}.`,
        statusCode: 400,
      };
    }

    const now = new Date().toISOString();
    const newStatus: EmergencyIncidentStatus = "CANCELLED";

    const updatedMetadata = {
      ...(incident.metadata || {}),
      is_cancelled: true,
      cancellation_reason: reason.trim(),
      cancelled_at: now,
      cancelled_by: adminProfileId,
    };

    const updated: EmergencyIncidentRecord = {
      ...incident,
      status: newStatus,
      metadata: updatedMetadata,
      updated_at: now,
    };

    setStoredIncident(updated);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incidents") as any)
        .update({
          status: newStatus,
          metadata: updatedMetadata,
          updated_at: now,
        })
        .eq("id", incident.id);
    } catch {
      // In-memory fallback
    }

    // Disband teams and release all assigned workers
    try {
      const { EmergencyTeamRepository } = await import("@/lib/emergency/team-store");
      const teams = await EmergencyTeamRepository.listTeamsForIncident(incident.id);
      for (const t of teams) {
        await EmergencyTeamRepository.updateTeam(t.id, {
          status: "DISBANDED",
          field_status: "RESOLVED",
          updated_at: now,
        });
        const members = await EmergencyTeamRepository.listTeamMembers(t.id);
        for (const m of members) {
          if (m.status !== "RELEASED" && m.status !== "NO_SHOW") {
            await EmergencyTeamRepository.updateMember(t.id, m.id, {
              status: "RELEASED",
              updated_at: now,
            });
          }
        }
      }
    } catch {
      // Resilient
    }

    // Withdraw pending dispatches in pool
    try {
      const { EmergencyDispatchRepository } = await import("@/lib/emergency/dispatch-store");
      const dispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incident.id);
      for (const d of dispatches) {
        if (d.status === "DISPATCHED") {
          await EmergencyDispatchRepository.updateDispatchStatus(d.id, "WITHDRAWN", now);
        }
      }
    } catch {
      // Resilient
    }

    // Cancel pending and active incident tasks
    try {
      const { EmergencyTaskRepository } = await import("@/lib/emergency/task-store");
      const tasks = await EmergencyTaskRepository.listTasksForIncident(incident.id);
      for (const task of tasks) {
        if (task.status !== "COMPLETED" && task.status !== "CANCELLED") {
          await EmergencyTaskRepository.updateTask(task.id, {
            status: "CANCELLED",
            completion_notes: `Incident cancelled: ${reason.trim()}`,
            completed_at: now,
          });
        }
      }
    } catch {
      // Resilient
    }

    // Cancel pending additional worker requests
    try {
      const { EmergencyTaskRepository } = await import("@/lib/emergency/task-store");
      const addReqs = await EmergencyTaskRepository.listAdditionalWorkerRequests(incident.id);
      for (const req of addReqs) {
        if (req.status === "PENDING_FEDERATION_REVIEW") {
          await EmergencyTaskRepository.updateAdditionalWorkerRequest({
            ...req,
            status: "CANCELLED",
            updated_at: now,
          });
        }
      }
    } catch {
      // Resilient
    }

    // Audit log
    try {
      if (incident.federation_id) {
        const { EmergencyControlCenterRepository } = await import("@/lib/emergency/control-center-store");
        await EmergencyControlCenterRepository.createAuditLog({
          incident_id: incident.id,
          federation_id: incident.federation_id,
          actor_id: adminProfileId,
          action_type: "EMERGENCY_CANCELLED",
          previous_state: { status: incident.status },
          new_state: { status: "CANCELLED", reason: reason.trim() },
          notes: `Emergency cancelled by Federation Administrator: ${reason.trim()}`,
        });
      }
    } catch {
      // Resilient
    }

    return { success: true, record: updated };
  }

  /**
   * Federation Admin archives a completed emergency incident from the active view
   */
  static async archiveIncident(params: {
    incidentId: string;
    adminProfileId: string;
  }): Promise<{ success: boolean; record?: EmergencyIncidentRecord; error?: string; statusCode?: number }> {
    const { incidentId, adminProfileId } = params;

    const incident = await this.findById(incidentId);
    if (!incident) {
      return { success: false, error: "Emergency incident not found.", statusCode: 404 };
    }

    if (incident.status !== "CLOSED" && incident.status !== "RESOLVED" && incident.status !== "CANCELLED") {
      return {
        success: false,
        error: "Only resolved, closed, or cancelled emergencies can be archived.",
        statusCode: 400,
      };
    }

    const now = new Date().toISOString();
    const updatedMetadata = {
      ...(incident.metadata || {}),
      is_archived: true,
      archived_at: now,
      archived_by: adminProfileId,
    };

    const updated: EmergencyIncidentRecord = {
      ...incident,
      metadata: updatedMetadata,
      updated_at: now,
    };

    setStoredIncident(updated);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incidents") as any)
        .update({
          metadata: updatedMetadata,
          updated_at: now,
        })
        .eq("id", incident.id);
    } catch {
      // Fallback
    }

    // Audit log
    try {
      if (incident.federation_id) {
        const { EmergencyControlCenterRepository } = await import("@/lib/emergency/control-center-store");
        await EmergencyControlCenterRepository.createAuditLog({
          incident_id: incident.id,
          federation_id: incident.federation_id,
          actor_id: adminProfileId,
          action_type: "EMERGENCY_ARCHIVED",
          previous_state: { is_archived: false },
          new_state: { is_archived: true },
          notes: "Emergency incident archived and removed from active control center list.",
        });
      }
    } catch {
      // Resilient
    }

    return { success: true, record: updated };
  }

  /**
   * Maps detailed internal status into a safe customer-facing status string
   */
  static getCustomerSafeStatus(
    incident: EmergencyIncidentRecord,
    team?: { status?: string; field_status?: string } | null
  ): string {
    if (incident.status === "CANCELLED") return "Emergency Cancelled";
    if (incident.status === "CLOSED") return "Closed";
    if (incident.status === "RESOLVED") return "Emergency Resolved";
    if (incident.status === "STAFFING_SHORTAGE") return "Additional Support Required";
    if (incident.status === "AWAITING_RESPONSE") return "Awaiting Response";
    if (incident.status === "DISPATCHING") return "Dispatching Responders";
    if (incident.status === "TEAM_FORMING") return "Response Team Forming";

    if (incident.status === "ACTIVE") {
      const fieldStatus = team?.field_status || "DISPATCHED";
      if (fieldStatus === "ARRIVING") return "Team Arriving";
      if (fieldStatus === "ON_SITE") return "On Site";
      if (fieldStatus === "WORK_IN_PROGRESS") return "Work In Progress";
      if (fieldStatus === "READY_FOR_RESOLUTION") return "Emergency Resolved";
      if (fieldStatus === "AWAITING_SUPPORT") return "Additional Support Required";
      return "Team Dispatched";
    }

    return "Processing Emergency";
  }
}

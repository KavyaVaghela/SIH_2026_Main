import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import { EmergencyTeamRepository } from "@/lib/emergency/team-store";
import { EmergencyControlCenterRepository } from "@/lib/emergency/control-center-store";

export type EmergencyVerificationStatus = "PENDING" | "VERIFIED" | "EXPIRED" | "REVOKED";

export interface EmergencyVerificationRecord {
  id: string;
  incident_id: string;
  verification_token: string;
  verification_code: string;
  status: EmergencyVerificationStatus;
  verified_at: string | null;
  verified_by_worker_id: string | null;
  team_id: string | null;
  expires_at: string;
  created_at: string;
}

export interface EmergencyCheckInRecord {
  id: string;
  incident_id: string;
  team_id: string;
  worker_id: string;
  check_in_time: string;
  status: "CHECKED_IN" | "LATE" | "EXCUSED";
  verification_method: string;
  created_at: string;
  worker_name?: string;
  worker_role?: string;
}

import {
  getStoredVerification,
  setStoredVerification,
  setStoredCheckIn,
  listStoredCheckIns,
} from "@/lib/emergency/persistence";

// In-memory caches for test/development resilience
const inMemoryVerificationStore = new Map<string, EmergencyVerificationRecord>(); // keyed by incident_id and id
const inMemoryCheckInStore = new Map<string, EmergencyCheckInRecord>(); // keyed by team_id:worker_id and id

export class EmergencyVerificationRepository {
  /**
   * Generates a deterministic, cryptographically secure verification token and human-readable code
   * for an emergency incident. ONE EMERGENCY -> ONE VERIFICATION -> MULTIPLE WORKERS.
   */
  static async generateVerification(
    incidentId: string,
    teamId?: string | null
  ): Promise<EmergencyVerificationRecord> {
    // Check if an active verification already exists for this incident
    const existing = await this.getVerificationByIncidentId(incidentId);
    if (existing && existing.status === "PENDING" && new Date(existing.expires_at) > new Date()) {
      return existing;
    }

    const id = crypto.randomUUID();
    const token = crypto.randomBytes(32).toString("hex"); // 64 chars
    // 8-character human-readable alphanumeric code: "EMG-" + 4 uppercase chars/digits
    const codeSuffix = crypto.randomBytes(3).toString("hex").toUpperCase().slice(0, 4);
    const code = `EMG-${codeSuffix}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours validity

    const record: EmergencyVerificationRecord = {
      id,
      incident_id: incidentId,
      verification_token: token,
      verification_code: code,
      status: "PENDING",
      verified_at: null,
      verified_by_worker_id: null,
      team_id: teamId || null,
      expires_at: expiresAt,
      created_at: now.toISOString(),
    };

    inMemoryVerificationStore.set(incidentId, record);
    inMemoryVerificationStore.set(id, record);
    inMemoryVerificationStore.set(token, record);
    inMemoryVerificationStore.set(code, record);
    setStoredVerification(record);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_verifications") as any).upsert({
        id: record.id,
        incident_id: record.incident_id,
        verification_token: record.verification_token,
        verification_code: record.verification_code,
        status: record.status,
        expires_at: record.expires_at,
        created_at: record.created_at,
      });

      // Update incident with verification code & token
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incidents") as any)
        .update({
          verification_code: record.verification_code,
          verification_token: record.verification_token,
        })
        .eq("id", incidentId);
    } catch {
      // In-memory fallback
    }

    // Update in-memory incident if present
    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (incident) {
      incident.metadata = {
        ...incident.metadata,
        verification_code: code,
        verification_token: token,
      };
    }

    return record;
  }

  /**
   * Retrieves active verification record for an incident
   */
  static async getVerificationByIncidentId(
    incidentId: string
  ): Promise<EmergencyVerificationRecord | null> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_verifications") as any)
        .select("*")
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return data as EmergencyVerificationRecord;
      }
    } catch {
      // In-memory fallback
    }

    return inMemoryVerificationStore.get(incidentId) || getStoredVerification(incidentId) || null;
  }

  /**
   * Verifies an emergency incident on scene.
   * Only an authorized response team member or Team Lead can verify.
   * One verification verifies the incident for all workers.
   */
  static async verifyEmergency(
    incidentId: string,
    tokenOrCode: string,
    workerId: string
  ): Promise<{
    success: boolean;
    verification?: EmergencyVerificationRecord;
    error?: string;
    statusCode?: number;
  }> {
    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return { success: false, error: "Emergency incident not found.", statusCode: 404 };
    }

    if (incident.status === "CLOSED") {
      return {
        success: false,
        error: "Cannot verify a closed emergency incident.",
        statusCode: 400,
      };
    }

    // 1. Verify caller authorization: Worker must be an active member of this incident's team
    const team = await EmergencyTeamRepository.getTeamByIncidentId(incident.id);
    if (!team) {
      return {
        success: false,
        error: "No response team found formed for this incident.",
        statusCode: 400,
      };
    }

    const isMember = (team.members || []).some((m) => m.worker_id === workerId);
    if (!isMember) {
      return {
        success: false,
        error: "Forbidden: Only assigned team members can verify emergency arrival.",
        statusCode: 403,
      };
    }

    // 2. Retrieve verification record
    let verification = await this.getVerificationByIncidentId(incident.id);
    if (!verification) {
      // Auto-generate if missing
      verification = await this.generateVerification(incident.id, team.id);
    }

    if (verification.status === "VERIFIED") {
      return {
        success: false,
        error: "Emergency incident is already verified.",
        statusCode: 409,
      };
    }

    if (verification.status === "EXPIRED" || new Date(verification.expires_at) <= new Date()) {
      return {
        success: false,
        error: "Verification token or code has expired.",
        statusCode: 410,
      };
    }

    // 3. Match token or human-readable code (case-insensitive)
    const normalizedInput = tokenOrCode.trim().toUpperCase();
    const tokenMatch = verification.verification_token.toUpperCase() === normalizedInput;
    const codeMatch = verification.verification_code.toUpperCase() === normalizedInput;

    if (!tokenMatch && !codeMatch) {
      return {
        success: false,
        error: "Invalid emergency verification code or token.",
        statusCode: 400,
      };
    }

    // 4. Verification Succeeded — Update State
    const now = new Date().toISOString();
    verification.status = "VERIFIED";
    verification.verified_at = now;
    verification.verified_by_worker_id = workerId;
    verification.team_id = team.id;

    inMemoryVerificationStore.set(incident.id, verification);
    inMemoryVerificationStore.set(verification.id, verification);
    setStoredVerification(verification);

    // Update incident
    incident.metadata = {
      ...incident.metadata,
      is_verified: true,
      verified_at: now,
      verified_by_worker_id: workerId,
    };

    // Update team field status to ON_SITE
    await EmergencyTeamRepository.updateFieldStatus(team.id, "ON_SITE");

    // Persist to Supabase
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_verifications") as any)
        .update({
          status: "VERIFIED",
          verified_at: now,
          verified_by_worker_id: workerId,
          team_id: team.id,
        })
        .eq("id", verification.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_incidents") as any)
        .update({
          is_verified: true,
          verified_at: now,
          verified_by_worker_id: workerId,
        })
        .eq("id", incident.id);
    } catch {
      // In-memory fallback
    }

    // Auto check-in the verifying worker
    await this.recordWorkerCheckIn(incident.id, team.id, workerId, "QR_VERIFICATION");

    // Audit Log
    try {
      if (incident.federation_id) {
        // Resolve worker profile id
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
          action_type: "EMERGENCY_VERIFIED",
          previous_state: { is_verified: false, team_field_status: team.field_status || "DISPATCHED" },
          new_state: { is_verified: true, verified_at: now, team_field_status: "ON_SITE" },
          notes: `Emergency verified on scene via code/QR by worker ${workerId}.`,
        });
      }
    } catch {
      // Audit log resilient
    }

    return { success: true, verification };
  }

  /**
   * Records a worker check-in for an emergency response team.
   */
  static async recordWorkerCheckIn(
    incidentId: string,
    teamId: string,
    workerId: string,
    method: string = "QR_EMERGENCY_VERIFICATION"
  ): Promise<{ success: boolean; checkIn?: EmergencyCheckInRecord; error?: string; statusCode?: number }> {
    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return { success: false, error: "Emergency incident not found.", statusCode: 404 };
    }

    const team = await EmergencyTeamRepository.getTeamById(teamId);
    if (!team || team.incident_id !== incident.id) {
      return { success: false, error: "Response team not found for this incident.", statusCode: 404 };
    }

    const member = (team.members || []).find((m) => m.worker_id === workerId);
    if (!member) {
      return {
        success: false,
        error: "Forbidden: Worker is not assigned to this emergency response team.",
        statusCode: 403,
      };
    }

    // Check if emergency has been verified
    const verification = await this.getVerificationByIncidentId(incident.id);
    const isVerified = verification?.status === "VERIFIED" || incident.metadata?.is_verified === true;
    if (!isVerified) {
      return {
        success: false,
        error: "Emergency must be verified on scene before individual check-in.",
        statusCode: 400,
      };
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const key = `${teamId}:${workerId}`;

    const checkIn: EmergencyCheckInRecord = {
      id,
      incident_id: incidentId,
      team_id: teamId,
      worker_id: workerId,
      check_in_time: now,
      status: "CHECKED_IN",
      verification_method: method,
      created_at: now,
      worker_name: member.worker_name,
      worker_role: member.role,
    };

    inMemoryCheckInStore.set(key, checkIn);
    inMemoryCheckInStore.set(id, checkIn);
    setStoredCheckIn(key, checkIn);

    // Update member status to ACTIVE
    member.status = "ACTIVE";
    member.updated_at = now;

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_check_ins") as any).upsert({
        id: checkIn.id,
        incident_id: checkIn.incident_id,
        team_id: checkIn.team_id,
        worker_id: checkIn.worker_id,
        check_in_time: checkIn.check_in_time,
        status: checkIn.status,
        verification_method: checkIn.verification_method,
        created_at: checkIn.created_at,
      });

      // Update member status in DB
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_response_team_members") as any)
        .update({ status: "ACTIVE", updated_at: now })
        .eq("team_id", teamId)
        .eq("worker_id", workerId);
    } catch {
      // Fallback
    }

    // Audit Log
    try {
      if (incident.federation_id) {
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
          action_type: "WORKER_CHECKED_IN",
          previous_state: { member_status: "ASSIGNED" },
          new_state: { member_status: "ACTIVE", check_in_time: now, verification_method: method },
          notes: `Worker ${member.worker_name || workerId} (${member.role}) checked in on scene.`,
        });
      }
    } catch {
      // Audit log resilient
    }

    return { success: true, checkIn };
  }

  /**
   * Lists all check-in records for an incident.
   */
  static async listCheckInsForIncident(incidentId: string): Promise<EmergencyCheckInRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_check_ins") as any)
        .select("*")
        .eq("incident_id", incidentId)
        .order("check_in_time", { ascending: true });

      if (!error && Array.isArray(data)) {
        return data as EmergencyCheckInRecord[];
      }
    } catch {
      // Memory fallback
    }

    const records: EmergencyCheckInRecord[] = [];
    const allCheckIns = [...Array.from(inMemoryCheckInStore.values()), ...listStoredCheckIns()];
    for (const item of allCheckIns) {
      if (item.incident_id === incidentId && !records.some((r) => r.id === item.id)) {
        records.push(item);
      }
    }
    return records;
  }
}

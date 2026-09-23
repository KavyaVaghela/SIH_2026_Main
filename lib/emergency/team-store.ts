import { createAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import {
  EmergencyIncidentRepository,
} from "@/lib/emergency/incident-store";
import {
  EmergencyDispatchRepository,
} from "@/lib/emergency/dispatch-store";
import { EmergencyTaskRepository } from "@/lib/emergency/task-store";

export type EmergencyResponseTeamStatus = "FORMING" | "FORMED" | "ACTIVE" | "STANDBY" | "DISBANDED";
export type EmergencyTeamMemberStatus =
  | "ASSIGNED"
  | "CHECK-IN_PENDING"
  | "ACTIVE"
  | "STANDBY"
  | "NO_SHOW"
  | "REPLACEMENT_REQUIRED"
  | "RELEASED";

export type EmergencyResponseTeamType = "PRIMARY" | "SECONDARY" | "SPECIALIZED_UNIT" | "SUPPORT";

export type EmergencyTeamFieldStatus =
  | "DISPATCHED"
  | "ARRIVING"
  | "ON_SITE"
  | "WORK_IN_PROGRESS"
  | "AWAITING_SUPPORT"
  | "READY_FOR_RESOLUTION"
  | "RESOLVED";

export interface EmergencyResponseTeamRecord {
  id: string;
  incident_id: string;
  federation_id: string;
  status: EmergencyResponseTeamStatus;
  team_lead_worker_id: string | null;
  requires_team_lead: boolean;
  required_worker_count: number;
  accepted_worker_count: number;
  created_at: string;
  updated_at: string;
  team_type?: EmergencyResponseTeamType;
  parent_team_id?: string | null;
  field_status?: EmergencyTeamFieldStatus;
  // Optional enriched fields
  members?: EmergencyTeamMemberRecord[];
  incident_emergency_id?: string;
  incident_category?: string;
  incident_type?: string;
  incident_location?: string;
}

export interface EmergencyTeamMemberRecord {
  id: string;
  team_id: string;
  incident_id: string;
  worker_id: string;
  role: string;
  is_team_lead: boolean;
  status: EmergencyTeamMemberStatus;
  accepted_at: string;
  created_at: string;
  updated_at: string;
  // Optional enriched fields
  worker_name?: string;
  worker_phone?: string;
  profession?: string;
}

export interface WorkerDispatchResponseResult {
  success: boolean;
  code: number;
  status?: "ACCEPTED" | "DECLINED";
  error?: string;
  dispatchId?: string;
  incidentId?: string;
  teamFormed?: boolean;
  teamId?: string;
  team?: EmergencyResponseTeamRecord;
  acceptedCount?: number;
  requiredCount?: number;
  teamLeadWorkerId?: string | null;
}

import {
  getStoredTeam,
  setStoredTeam,
  getStoredTeamMembers,
  setStoredTeamMembers,
} from "@/lib/emergency/persistence";

// In-memory repositories for resilient local testing and fallback
const inMemoryTeams = new Map<string, EmergencyResponseTeamRecord>();
const inMemoryIncidentTeams = new Map<string, EmergencyResponseTeamRecord[]>();
const inMemoryTeamMembers = new Map<string, EmergencyTeamMemberRecord[]>();

// Mutex lock per incident to guarantee race-safety in-memory
const incidentLocks = new Map<string, Promise<void>>();

async function acquireIncidentLock(incidentId: string): Promise<() => void> {
  while (incidentLocks.has(incidentId)) {
    await incidentLocks.get(incidentId);
  }
  let unlock: () => void = () => {};
  const lockPromise = new Promise<void>((resolve) => {
    unlock = () => {
      incidentLocks.delete(incidentId);
      resolve();
    };
  });
  incidentLocks.set(incidentId, lockPromise);
  return unlock;
}

export function deduplicateMembers(members: EmergencyTeamMemberRecord[]): EmergencyTeamMemberRecord[] {
  const map = new Map<string, EmergencyTeamMemberRecord>();
  for (const m of members) {
    if (!m.worker_id) continue;
    const existing = map.get(m.worker_id);
    if (!existing) {
      map.set(m.worker_id, m);
    } else {
      // If existing is inactive/released, prefer an active or assigned record
      if (existing.status === "RELEASED" || existing.status === "NO_SHOW") {
        if (m.status !== "RELEASED" && m.status !== "NO_SHOW") {
          map.set(m.worker_id, m);
        }
      }
    }
  }
  return Array.from(map.values());
}

export class EmergencyTeamRepository {
  /**
   * Atomically processes a worker's ACCEPT or DECLINE response to an emergency dispatch
   */
  static async respondToDispatch(params: {
    dispatchId: string;
    workerId: string;
    response: "ACCEPT" | "DECLINE";
  }): Promise<WorkerDispatchResponseResult> {
    const { dispatchId, workerId, response } = params;

    // 1. Parameter validation
    if (response !== "ACCEPT" && response !== "DECLINE") {
      return {
        success: false,
        code: 400,
        error: "Invalid response action. Must be ACCEPT or DECLINE.",
      };
    }

    // 2. Try remote PostgreSQL atomic RPC first if available
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: rpcData, error: rpcErr } = await (supabase.rpc as any)("respond_to_emergency_dispatch", {
        p_dispatch_id: dispatchId,
        p_worker_id: workerId,
        p_response: response,
      });

      if (!rpcErr && rpcData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = rpcData as any;
        return {
          success: result.success,
          code: result.code || (result.success ? 200 : 400),
          status: result.status,
          error: result.error,
          dispatchId: result.dispatch_id,
          incidentId: result.incident_id,
          teamFormed: result.team_formed,
          teamId: result.team_id,
          acceptedCount: result.accepted_count,
          requiredCount: result.required_count,
          teamLeadWorkerId: result.team_lead_worker_id,
        };
      }
    } catch {
      // Fallback seamlessly to authoritative in-memory transaction
    }

    // 3. Fallback: Authoritative in-memory atomic transaction with incident locking
    // Fetch dispatch record
    const dispatch = await EmergencyDispatchRepository.findDispatchById(dispatchId);
    if (!dispatch) {
      return {
        success: false,
        code: 404,
        error: "Emergency dispatch record not found.",
      };
    }

    // Acquire lock for this incident to guarantee race-safety across concurrent requests
    const unlock = await acquireIncidentLock(dispatch.incident_id);

    try {
      // Worker ownership authorization check
      if (dispatch.worker_id !== workerId) {
        return {
          success: false,
          code: 403,
          error: "Unauthorized: Worker may only respond to opportunities dispatched to themselves.",
        };
      }

      // Check current dispatch status
      if (dispatch.status === "ACCEPTED") {
        return {
          success: false,
          code: 409,
          error: "You have already accepted this emergency opportunity.",
        };
      }

      if (dispatch.status === "DECLINED") {
        return {
          success: false,
          code: 409,
          error: "You have already declined this emergency opportunity.",
        };
      }

      if (dispatch.status === "EXPIRED" || dispatch.status === "WITHDRAWN") {
        return {
          success: false,
          code: 410,
          error: `This emergency opportunity is no longer available (status: ${dispatch.status}).`,
        };
      }

      const now = new Date().toISOString();

      // Branch: Worker DECLINE
      if (response === "DECLINE") {
        await EmergencyDispatchRepository.updateDispatchStatus(dispatchId, "DECLINED", now);
        return {
          success: true,
          code: 200,
          status: "DECLINED",
          dispatchId: dispatch.id,
          incidentId: dispatch.incident_id,
        };
      }

      // Branch: Worker ACCEPT
      const incident = await EmergencyIncidentRepository.findById(dispatch.incident_id);
      if (!incident) {
        return {
          success: false,
          code: 404,
          error: "Emergency incident associated with dispatch not found.",
        };
      }

      if (incident.status === "RESOLVED" || incident.status === "CLOSED") {
        return {
          success: false,
          code: 409,
          error: "Emergency incident has already been resolved or closed.",
        };
      }

      // Resolve Response Matrix
      const matrix = await EmergencyIncidentRepository.getIncidentResponseMatrix(incident.id);
      const requiredCount = matrix?.recommended_worker_count || 1;
      const requiresTeamLead = matrix?.team_lead_required || false;

      // Count currently accepted workers for this incident
      const currentDispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incident.id);
      const acceptedDispatches = currentDispatches.filter((d) => d.status === "ACCEPTED");
      const currentAcceptedCount = acceptedDispatches.length;

      // ATOMIC OVERSTAFFING GUARD:
      // If required capacity is already fulfilled, reject further acceptances with 409 Conflict
      if (currentAcceptedCount >= requiredCount) {
        return {
          success: false,
          code: 409,
          error: "Staffing capacity for this emergency incident has already been fulfilled.",
          acceptedCount: currentAcceptedCount,
          requiredCount,
        };
      }

      // Mark this worker as ACCEPTED
      await EmergencyDispatchRepository.updateDispatchStatus(dispatchId, "ACCEPTED", now);
      const newAcceptedCount = currentAcceptedCount + 1;

      // TEAM FORMATION RULE:
      // Form team ONLY when all required workers have accepted
      if (newAcceptedCount >= requiredCount) {
        // Fetch all dispatches for this incident including this newly accepted one
        const updatedDispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incident.id);
        const allAcceptedRaw = updatedDispatches.filter((d) => d.status === "ACCEPTED" || d.id === dispatchId);

        // Deduplicate accepted dispatches by worker_id (ONE worker = ONE response-team membership)
        const uniqueDispatchesByWorker = new Map<string, typeof allAcceptedRaw[0]>();
        for (const d of allAcceptedRaw) {
          if (!uniqueDispatchesByWorker.has(d.worker_id)) {
            uniqueDispatchesByWorker.set(d.worker_id, d);
          }
        }
        const allAccepted = Array.from(uniqueDispatchesByWorker.values());

        // Deterministic Team Lead Identification:
        // Find if any accepted worker was dispatched under Team Lead role
        const teamLeadDispatch = allAccepted.find(
          (d) => d.required_role.toLowerCase().includes("team lead") || d.required_role.toLowerCase().includes("lead")
        );
        const teamLeadWorkerId = teamLeadDispatch ? teamLeadDispatch.worker_id : null;

        // Create or get team record
        let team = inMemoryTeams.get(incident.id);
        const teamId = team ? team.id : crypto.randomUUID();

        team = {
          id: teamId,
          incident_id: incident.id,
          federation_id: incident.federation_id || dispatch.federation_id,
          status: "FORMED",
          team_lead_worker_id: teamLeadWorkerId,
          requires_team_lead: requiresTeamLead,
          required_worker_count: requiredCount,
          accepted_worker_count: newAcceptedCount,
          created_at: team ? team.created_at : now,
          updated_at: now,
          incident_emergency_id: incident.emergency_id,
          incident_category: incident.category_name,
          incident_type: incident.emergency_type,
          incident_location: incident.location,
        };

        inMemoryTeams.set(incident.id, team);
        inMemoryTeams.set(teamId, team);

        // Populate team members
        const members: EmergencyTeamMemberRecord[] = allAccepted.map((d) => {
          const isLead = Boolean(teamLeadWorkerId && d.worker_id === teamLeadWorkerId);
          return {
            id: crypto.randomUUID(),
            team_id: teamId,
            incident_id: incident.id,
            worker_id: d.worker_id,
            role: d.required_role,
            is_team_lead: isLead,
            status: "ASSIGNED",
            accepted_at: d.responded_at || now,
            created_at: now,
            updated_at: now,
            worker_name: d.worker_name,
            worker_phone: d.worker_phone,
            profession: d.profession,
          };
        });

        inMemoryTeamMembers.set(teamId, members);
        team.members = members;

        // Initialize incident tasks from Response Matrix predefined tasks
        if (matrix?.initial_tasks && matrix.initial_tasks.length > 0) {
          await EmergencyTaskRepository.createInitialTasksForIncident(
            incident.id,
            teamId,
            matrix.initial_tasks
          );
        }

        // Transition Incident status to ACTIVE
        await EmergencyIncidentRepository.updateIncidentStatus(incident.id, "ACTIVE", "SERVICE_ROLE");

        // Try persisting team & members to Supabase
        try {
          const supabase = createAdminClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("emergency_response_teams") as any).upsert({
            id: team.id,
            incident_id: team.incident_id,
            federation_id: team.federation_id,
            status: team.status,
            team_lead_worker_id: team.team_lead_worker_id,
            requires_team_lead: team.requires_team_lead,
            required_worker_count: team.required_worker_count,
            accepted_worker_count: team.accepted_worker_count,
            created_at: team.created_at,
            updated_at: team.updated_at,
          });

          // Insert team members
          for (const m of members) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from("emergency_response_team_members") as any).upsert({
              id: m.id,
              team_id: m.team_id,
              incident_id: m.incident_id,
              worker_id: m.worker_id,
              role: m.role,
              is_team_lead: m.is_team_lead,
              status: m.status,
              accepted_at: m.accepted_at,
              created_at: m.created_at,
              updated_at: m.updated_at,
            });
          }
        } catch {
          // Fallback seamlessly
        }

        return {
          success: true,
          code: 200,
          status: "ACCEPTED",
          dispatchId: dispatch.id,
          incidentId: incident.id,
          teamFormed: true,
          teamId,
          team,
          acceptedCount: newAcceptedCount,
          requiredCount,
          teamLeadWorkerId,
        };
      } else {
        // Partial staffing: Do NOT form team prematurely
        // Transition incident status to TEAM_FORMING
        await EmergencyIncidentRepository.updateIncidentStatus(incident.id, "TEAM_FORMING", "SERVICE_ROLE");

        return {
          success: true,
          code: 200,
          status: "ACCEPTED",
          dispatchId: dispatch.id,
          incidentId: incident.id,
          teamFormed: false,
          acceptedCount: newAcceptedCount,
          requiredCount,
        };
      }
    } finally {
      unlock();
    }
  }

  /**
   * Retrieves an Emergency Response Team by incident ID (returns primary/first team)
   */
  static async getTeamByIncidentId(incidentId: string): Promise<EmergencyResponseTeamRecord | null> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_response_teams") as any)
        .select(`
          *,
          emergency_response_team_members (
            id,
            team_id,
            incident_id,
            worker_id,
            role,
            is_team_lead,
            status,
            accepted_at,
            workers (
              id,
              profession,
              profiles ( full_name, phone )
            )
          )
        `)
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawMembers = (data.emergency_response_team_members || []).map((m: any) => ({
          id: m.id,
          team_id: m.team_id,
          incident_id: m.incident_id,
          worker_id: m.worker_id,
          role: m.role,
          is_team_lead: m.is_team_lead,
          status: m.status,
          accepted_at: m.accepted_at,
          created_at: m.created_at || m.accepted_at,
          updated_at: m.updated_at || m.accepted_at,
          worker_name: m.workers?.profiles?.full_name,
          worker_phone: m.workers?.profiles?.phone,
          profession: m.workers?.profession,
        }));

        return {
          ...data,
          members: deduplicateMembers(rawMembers),
        };
      }
    } catch {
      // Memory check
    }

    const team = inMemoryTeams.get(incidentId) || getStoredTeam(incidentId) || null;
    if (team) {
      const rawList = inMemoryTeamMembers.get(team.id) || getStoredTeamMembers(team.id) || [];
      team.members = deduplicateMembers(rawList);
    }
    return team;
  }

  /**
   * Lists all Emergency Response Teams attached to an incident (supporting multi-team scaling)
   */
  static async listTeamsForIncident(incidentId: string): Promise<EmergencyResponseTeamRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_response_teams") as any)
        .select(`
          *,
          emergency_response_team_members (
            id,
            team_id,
            incident_id,
            worker_id,
            role,
            is_team_lead,
            status,
            accepted_at,
            workers (
              id,
              profession,
              profiles ( full_name, phone )
            )
          )
        `)
        .eq("incident_id", incidentId)
        .order("created_at", { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((d: any) => ({
          ...d,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          members: deduplicateMembers((d.emergency_response_team_members || []).map((m: any) => ({
            id: m.id,
            team_id: m.team_id,
            incident_id: m.incident_id,
            worker_id: m.worker_id,
            role: m.role,
            is_team_lead: m.is_team_lead,
            status: m.status,
            accepted_at: m.accepted_at,
            created_at: m.created_at || m.accepted_at,
            updated_at: m.updated_at || m.accepted_at,
            worker_name: m.workers?.profiles?.full_name,
            worker_phone: m.workers?.profiles?.phone,
            profession: m.workers?.profession,
          }))),
        }));
      }
    } catch {
      // Memory fallback
    }

    const incTeams = inMemoryIncidentTeams.get(incidentId) || [];
    if (incTeams.length > 0) {
      return incTeams.map((t) => ({
        ...t,
        members: deduplicateMembers(inMemoryTeamMembers.get(t.id) || t.members || []),
      }));
    }

    const primary = inMemoryTeams.get(incidentId);
    if (primary) {
      primary.members = deduplicateMembers(inMemoryTeamMembers.get(primary.id) || []);
      return [primary];
    }

    return [];
  }

  /**
   * Retrieves an Emergency Response Team by team ID
   */
  static async getTeamById(teamId: string): Promise<EmergencyResponseTeamRecord | null> {
    const team = inMemoryTeams.get(teamId) || getStoredTeam(teamId) || null;
    if (team) {
      team.members = inMemoryTeamMembers.get(team.id) || getStoredTeamMembers(team.id) || [];
      return team;
    }

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_response_teams") as any)
        .select(`
          *,
          emergency_response_team_members (
            id,
            team_id,
            incident_id,
            worker_id,
            role,
            is_team_lead,
            status,
            accepted_at,
            workers (
              id,
              profession,
              profiles ( full_name, phone )
            )
          )
        `)
        .eq("id", teamId)
        .maybeSingle();

      if (!error && data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const members = (data.emergency_response_team_members || []).map((m: any) => ({
          id: m.id,
          team_id: m.team_id,
          incident_id: m.incident_id,
          worker_id: m.worker_id,
          role: m.role,
          is_team_lead: m.is_team_lead,
          status: m.status,
          accepted_at: m.accepted_at,
          created_at: m.created_at || m.accepted_at,
          updated_at: m.updated_at || m.accepted_at,
          worker_name: m.workers?.profiles?.full_name,
          worker_phone: m.workers?.profiles?.phone,
          profession: m.workers?.profession,
        }));

        return {
          ...data,
          members,
        };
      }
    } catch {
      // Memory check
    }

    return null;
  }

  /**
   * Lists all members of a team
   */
  static async listTeamMembers(teamId: string): Promise<EmergencyTeamMemberRecord[]> {
    const team = await this.getTeamById(teamId);
    const raw = team?.members || inMemoryTeamMembers.get(teamId) || [];
    return deduplicateMembers(raw);
  }

  /**
   * Finds the currently active Emergency Response Team for a worker
   */
  static async getActiveTeamForWorker(workerId: string): Promise<EmergencyResponseTeamRecord | null> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_response_team_members") as any)
        .select(`
          team_id,
          status,
          emergency_response_teams!inner (
            id,
            incident_id,
            status
          )
        `)
        .eq("worker_id", workerId)
        .in("status", ["ASSIGNED", "ACTIVE"])
        .in("emergency_response_teams.status", ["FORMING", "FORMED", "ACTIVE"])
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          const t = await this.getTeamById(row.team_id);
          if (t && t.incident_id) {
            const inc = await EmergencyIncidentRepository.findById(t.incident_id);
            if (inc && inc.status !== "CLOSED" && inc.status !== "RESOLVED" && inc.status !== "CANCELLED") {
              const members = await this.listTeamMembers(t.id);
              const m = members.find((mem) => mem.worker_id === workerId);
              if (m && (m.status === "ASSIGNED" || m.status === "ACTIVE")) {
                return t;
              }
            }
          }
        }
      }
    } catch {
      // Memory fallback
    }

    // In-memory fallback
    for (const [teamId, members] of inMemoryTeamMembers.entries()) {
      const member = members.find((m) => m.worker_id === workerId && (m.status === "ACTIVE" || m.status === "ASSIGNED"));
      if (member) {
        const team = inMemoryTeams.get(teamId) || inMemoryTeams.get(member.incident_id);
        if (team && (team.status === "FORMING" || team.status === "FORMED" || team.status === "ACTIVE")) {
          const inc = await EmergencyIncidentRepository.findById(team.incident_id);
          if (inc && inc.status !== "CLOSED" && inc.status !== "RESOLVED" && inc.status !== "CANCELLED") {
            return await this.getTeamById(team.id);
          }
        }
      }
    }

    return null;
  }

  /**
   * Registers or updates an Emergency Response Team in memory and database
   */
  static async registerTeam(
    team: EmergencyResponseTeamRecord,
    members: EmergencyTeamMemberRecord[] = []
  ): Promise<EmergencyResponseTeamRecord> {
    const distinctMembers = deduplicateMembers(members);
    team.members = distinctMembers;
    const activeCount = distinctMembers.filter((m) => m.status !== "RELEASED" && m.status !== "NO_SHOW").length;
    if (activeCount > 0) {
      team.accepted_worker_count = activeCount;
    }
    if (team.team_type === "PRIMARY" || !inMemoryTeams.has(team.incident_id)) {
      inMemoryTeams.set(team.incident_id, team);
    }
    inMemoryTeams.set(team.id, team);
    inMemoryTeamMembers.set(team.id, distinctMembers);
    setStoredTeam(team);
    setStoredTeamMembers(team.id, distinctMembers);

    const incTeams = inMemoryIncidentTeams.get(team.incident_id) || [];
    const existingIdx = incTeams.findIndex((t) => t.id === team.id);
    if (existingIdx >= 0) {
      incTeams[existingIdx] = team;
    } else {
      incTeams.push(team);
    }
    inMemoryIncidentTeams.set(team.incident_id, incTeams);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_response_teams") as any).upsert({
        id: team.id,
        incident_id: team.incident_id,
        federation_id: team.federation_id,
        status: team.status,
        team_lead_worker_id: team.team_lead_worker_id,
        requires_team_lead: team.requires_team_lead,
        required_worker_count: team.required_worker_count,
        accepted_worker_count: team.accepted_worker_count,
        created_at: team.created_at,
        updated_at: team.updated_at,
        team_type: team.team_type || "PRIMARY",
        parent_team_id: team.parent_team_id || null,
      });

      for (const m of members) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("emergency_response_team_members") as any).upsert({
          id: m.id,
          team_id: m.team_id,
          incident_id: m.incident_id,
          worker_id: m.worker_id,
          role: m.role,
          is_team_lead: m.is_team_lead,
          status: m.status,
          accepted_at: m.accepted_at,
          created_at: m.created_at,
          updated_at: m.updated_at,
        });
      }
    } catch {
      // Memory fallback
    }

    return team;
  }

  /**
   * Creates a controlled additional response team attached to an incident
   */
  static async createAdditionalTeam(params: {
    incidentId: string;
    federationId: string;
    teamType?: EmergencyResponseTeamType;
    parentTeamId?: string | null;
    requiredWorkerCount: number;
    requiresTeamLead?: boolean;
    teamLeadWorkerId?: string | null;
    status?: EmergencyResponseTeamStatus;
    reason?: string;
    actorId?: string;
  }): Promise<EmergencyResponseTeamRecord> {
    const {
      incidentId,
      federationId,
      teamType = "SECONDARY",
      parentTeamId = null,
      requiredWorkerCount,
      requiresTeamLead = false,
      teamLeadWorkerId = null,
      status = "FORMING",
      reason = "Additional team deployed for emergency response capacity scaling",
    } = params;

    const teamId = crypto.randomUUID();
    const now = new Date().toISOString();

    const teamRecord: EmergencyResponseTeamRecord = {
      id: teamId,
      incident_id: incidentId,
      federation_id: federationId,
      status,
      team_lead_worker_id: teamLeadWorkerId,
      requires_team_lead: requiresTeamLead,
      required_worker_count: Math.max(1, requiredWorkerCount),
      accepted_worker_count: teamLeadWorkerId ? 1 : 0,
      created_at: now,
      updated_at: now,
      team_type: teamType,
      parent_team_id: parentTeamId,
      members: [],
    };

    const members: EmergencyTeamMemberRecord[] = [];
    if (teamLeadWorkerId) {
      members.push({
        id: crypto.randomUUID(),
        team_id: teamId,
        incident_id: incidentId,
        worker_id: teamLeadWorkerId,
        role: "Team Lead",
        is_team_lead: true,
        status: "ACTIVE",
        accepted_at: now,
        created_at: now,
        updated_at: now,
      });
      teamRecord.members = members;
    }

    await this.registerTeam(teamRecord, members);

    // Record audit if control center repository is available
    try {
      const { EmergencyControlCenterRepository } = await import("@/lib/emergency/control-center-store");
      await EmergencyControlCenterRepository.recordAuditLog({
        incidentId,
        federationId,
        actorId: params.actorId || federationId,
        actionType: "ADDITIONAL_TEAM_CREATED",
        previousState: {},
        newState: {
          teamId,
          teamType,
          requiredCount: teamRecord.required_worker_count,
          leadWorkerId: teamLeadWorkerId,
        },
        notes: reason,
      });
    } catch {
      // Quiet fallback
    }

    return teamRecord;
  }

  /**
   * Adds a member to an emergency response team
   */
  static async addMember(teamId: string, member: EmergencyTeamMemberRecord): Promise<void> {
    const list = inMemoryTeamMembers.get(teamId) || getStoredTeamMembers(teamId) || [];
    const existingIdx = list.findIndex((m) => m.worker_id === member.worker_id);
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...member };
    } else {
      list.push(member);
    }
    const distinct = deduplicateMembers(list);
    inMemoryTeamMembers.set(teamId, distinct);
    setStoredTeamMembers(teamId, distinct);
    const team = inMemoryTeams.get(teamId) || inMemoryTeams.get(member.incident_id) || getStoredTeam(teamId);
    if (team) {
      team.members = distinct;
      team.accepted_worker_count = distinct.filter((m) => m.status !== "RELEASED" && m.status !== "NO_SHOW").length;
      team.required_worker_count = Math.max(team.required_worker_count, team.accepted_worker_count);
      setStoredTeam(team);
    }
  }

  /**
   * Updates an existing member on an emergency response team
   */
  static async updateMember(
    teamId: string,
    memberId: string,
    updates: Partial<EmergencyTeamMemberRecord>
  ): Promise<void> {
    const list = inMemoryTeamMembers.get(teamId) || getStoredTeamMembers(teamId) || [];
    const idx = list.findIndex((m) => m.id === memberId || m.worker_id === memberId);
    const now = new Date().toISOString();
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_at: updates.updated_at || now };
      inMemoryTeamMembers.set(teamId, list);
      setStoredTeamMembers(teamId, list);
    }
    const team = inMemoryTeams.get(teamId) || getStoredTeam(teamId);
    if (team) {
      team.members = list;
      setStoredTeam(team);
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("emergency_response_team_members") as any)
          .update({
            ...(updates.status ? { status: updates.status } : {}),
            ...(updates.role ? { role: updates.role } : {}),
            updated_at: updates.updated_at || now,
          })
          .or(`id.eq.${memberId},and(team_id.eq.${teamId},worker_id.eq.${memberId})`);
      } catch {
        // Memory fallback
      }
    }
  }

  /**
   * Updates an existing emergency response team record
   */
  static async updateTeam(
    teamId: string,
    updates: Partial<EmergencyResponseTeamRecord>
  ): Promise<void> {
    const team = inMemoryTeams.get(teamId) || getStoredTeam(teamId);
    const now = new Date().toISOString();
    if (team) {
      Object.assign(team, updates, { updated_at: updates.updated_at || now });
      inMemoryTeams.set(teamId, team);
      if (team.incident_id) {
        inMemoryTeams.set(team.incident_id, team);
      }
      setStoredTeam(team);
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("emergency_response_teams") as any)
          .update({
            ...(updates.status ? { status: updates.status } : {}),
            ...(updates.field_status ? { field_status: updates.field_status } : {}),
            ...(updates.team_lead_worker_id !== undefined ? { team_lead_worker_id: updates.team_lead_worker_id } : {}),
            updated_at: updates.updated_at || now,
          })
          .eq("id", teamId);
      } catch {
        // Memory fallback
      }
    }
  }

  /**
   * Updates field response status for a team (DISPATCHED -> ARRIVING -> ON_SITE -> WORK_IN_PROGRESS etc.)
   */
  static async updateFieldStatus(
    teamId: string,
    fieldStatus: EmergencyTeamFieldStatus
  ): Promise<EmergencyResponseTeamRecord | null> {
    const team = await this.getTeamById(teamId);
    if (!team) return null;

    team.field_status = fieldStatus;
    team.updated_at = new Date().toISOString();

    inMemoryTeams.set(team.id, team);
    inMemoryTeams.set(team.incident_id, team);
    setStoredTeam(team);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("emergency_response_teams") as any)
          .update({
            field_status: fieldStatus,
            updated_at: team.updated_at,
          })
          .eq("id", teamId);
      } catch {
        // In-memory fallback
      }
    }

    return team;
  }
}

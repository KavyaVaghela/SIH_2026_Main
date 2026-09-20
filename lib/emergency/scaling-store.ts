import { createAdminClient } from "@/lib/supabase/admin";
import { EmergencyIncidentRepository } from "@/lib/emergency/incident-store";
import {
  EmergencyTeamRepository,
  EmergencyResponseTeamRecord,
  EmergencyTeamMemberRecord,
} from "@/lib/emergency/team-store";
import {
  EmergencyDispatchRepository,
  EmergencyDispatchPoolRecord,
  WorkerEligibilityEvaluationOptions,
} from "@/lib/emergency/dispatch-store";
import { EmergencyTaskRepository } from "@/lib/emergency/task-store";
import {
  EmergencyControlCenterRepository,
  EmergencySupportRequestRecord,
} from "@/lib/emergency/control-center-store";

// ============================================================================
// Types & Configuration for Task 7 Resilience and Scaling
// ============================================================================

export type EscalationStage =
  | "STAGE_1_NORMAL_DISPATCH"
  | "STAGE_2_RETRY_ELIGIBLE"
  | "STAGE_3_ADDITIONAL_WORKERS_REQUESTED"
  | "STAGE_4_ADDITIONAL_TEAM_REQUIRED"
  | "STAGE_5_CROSS_FEDERATION_SUPPORT"
  | "STAGE_6_CRITICAL_SHORTAGE_ESCALATION";

export interface EmergencyTimeRulesConfig {
  id?: string;
  federation_id?: string | null;
  normal_start_time: string; // e.g. "08:00"
  normal_end_time: string; // e.g. "18:00"
  peak_start_time: string; // e.g. "18:00"
  peak_end_time: string; // e.g. "22:00"
  night_start_time: string; // e.g. "22:00"
  night_end_time: string; // e.g. "08:00"
  normal_radius_multiplier: number; // default 1.0
  peak_radius_multiplier: number; // default 1.5
  night_radius_multiplier: number; // default 1.25
  max_emergency_radius_km: number; // default 50.0 km
  on_call_required_for_night: boolean; // default true
  offer_expiration_minutes: number; // default 5 minutes
  is_active: boolean; // default true
  created_at?: string;
  updated_at?: string;

  // Backward compatibility properties
  normalHoursStart?: number;
  normalHoursEnd?: number;
  peakHoursStart?: number;
  peakHoursEnd?: number;
  normalRadiusKm?: number;
  peakRadiusMultiplier?: number;
  nightRadiusMultiplier?: number;
  maxEmergencyRadiusKm?: number;
  offerExpirationMinutes?: number;
  [key: string]: unknown;
}

export const DEFAULT_TIME_RULES_CONFIG: EmergencyTimeRulesConfig = {
  normal_start_time: "08:00",
  normal_end_time: "18:00",
  peak_start_time: "18:00",
  peak_end_time: "22:00",
  night_start_time: "22:00",
  night_end_time: "08:00",
  normal_radius_multiplier: 1.0,
  peak_radius_multiplier: 1.5,
  night_radius_multiplier: 1.25,
  max_emergency_radius_km: 50.0,
  on_call_required_for_night: true,
  offer_expiration_minutes: 5,
  is_active: true,

  // Legacy aliases
  normalHoursStart: 8,
  normalHoursEnd: 18,
  peakHoursStart: 18,
  peakHoursEnd: 22,
  normalRadiusKm: 25,
  peakRadiusMultiplier: 1.5,
  nightRadiusMultiplier: 1.25,
  maxEmergencyRadiusKm: 50,
  offerExpirationMinutes: 5,
};

export const DEFAULT_TIME_RULES = DEFAULT_TIME_RULES_CONFIG;

export interface TimeRuleEvaluationResult {
  window: "NORMAL" | "PEAK" | "NIGHT_ON_CALL";
  currentHour: number;
  radiusMultiplier: number;
  maxRadiusKm: number;
  isNightOnCall: boolean;
  offerExpirationMinutes: number;
}

export interface ShortageEscalationEvaluation {
  incidentId: string;
  emergencyId: string;
  totalRequiredWorkers: number;
  totalAcceptedWorkers: number;
  totalActiveWorkers: number;
  missingWorkers: number;
  hasShortage: boolean;
  missingRoles: string[];
  activeTeamsCount: number;
  teams: EmergencyResponseTeamRecord[];
  currentStage: EscalationStage;
  dispatchesCount: number;
  declinedCount: number;
  expiredCount: number;
  canEscalate: boolean;
  recommendedAction: string;
}

// In-memory cache for escalation stages per incident
const inMemoryEscalationStages = new Map<string, EscalationStage>();

// In-memory store for configurable time rules (keyed by federationId or "GLOBAL")
const inMemoryTimeRules = new Map<string, EmergencyTimeRulesConfig>();
inMemoryTimeRules.set("GLOBAL", { ...DEFAULT_TIME_RULES_CONFIG });

/**
 * Parses "HH:MM" into minutes since midnight (0 - 1439)
 */
function parseHHMMToMinutes(hhmm: string): number {
  if (!hhmm) return 0;
  const parts = hhmm.trim().split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return Math.min(1439, Math.max(0, h * 60 + m));
}

/**
 * Determines if a target minute (0-1439) falls inside [startHHMM, endHHMM),
 * safely handling overnight wrap-around (e.g. 22:00 to 08:00).
 */
function isMinuteInWindow(targetMinutes: number, startHHMM: string, endHHMM: string): boolean {
  const start = parseHHMMToMinutes(startHHMM);
  const end = parseHHMMToMinutes(endHHMM);

  if (start <= end) {
    return targetMinutes >= start && targetMinutes < end;
  }
  // Overnight window crossing midnight
  return targetMinutes >= start || targetMinutes < end;
}

/**
 * Normalizes user-supplied or database config into standard EmergencyTimeRulesConfig
 */
function normalizeTimeRulesConfig(
  raw: Partial<EmergencyTimeRulesConfig> & Record<string, unknown>
): EmergencyTimeRulesConfig {
  const normalStart =
    (raw.normal_start_time as string) ||
    (raw.normalHoursStart !== undefined ? `${String(raw.normalHoursStart).padStart(2, "0")}:00` : "08:00");
  const normalEnd =
    (raw.normal_end_time as string) ||
    (raw.normalHoursEnd !== undefined ? `${String(raw.normalHoursEnd).padStart(2, "0")}:00` : "18:00");
  const peakStart =
    (raw.peak_start_time as string) ||
    (raw.peakHoursStart !== undefined ? `${String(raw.peakHoursStart).padStart(2, "0")}:00` : "18:00");
  const peakEnd =
    (raw.peak_end_time as string) ||
    (raw.peakHoursEnd !== undefined ? `${String(raw.peakHoursEnd).padStart(2, "0")}:00` : "22:00");
  const nightStart = (raw.night_start_time as string) || "22:00";
  const nightEnd = (raw.night_end_time as string) || "08:00";

  const normalMult = Number(raw.normal_radius_multiplier ?? 1.0);
  const peakMult = Number(raw.peak_radius_multiplier ?? raw.peakRadiusMultiplier ?? 1.5);
  const nightMult = Number(raw.night_radius_multiplier ?? raw.nightRadiusMultiplier ?? 1.25);
  const maxRadius = Number(raw.max_emergency_radius_km ?? raw.maxEmergencyRadiusKm ?? 50.0);
  const onCallNight = (raw.on_call_required_for_night as boolean) ?? true;
  const expMin = Number(raw.offer_expiration_minutes ?? raw.offerExpirationMinutes ?? 5);
  const active = (raw.is_active as boolean) ?? true;

  return {
    id: raw.id as string | undefined,
    federation_id: (raw.federation_id as string) || null,
    normal_start_time: normalStart,
    normal_end_time: normalEnd,
    peak_start_time: peakStart,
    peak_end_time: peakEnd,
    night_start_time: nightStart,
    night_end_time: nightEnd,
    normal_radius_multiplier: isNaN(normalMult) ? 1.0 : normalMult,
    peak_radius_multiplier: isNaN(peakMult) ? 1.5 : peakMult,
    night_radius_multiplier: isNaN(nightMult) ? 1.25 : nightMult,
    max_emergency_radius_km: isNaN(maxRadius) ? 50.0 : maxRadius,
    on_call_required_for_night: onCallNight,
    offer_expiration_minutes: isNaN(expMin) ? 5 : expMin,
    is_active: active,

    // Legacy aliases
    normalHoursStart: parseInt(normalStart.split(":")[0], 10),
    normalHoursEnd: parseInt(normalEnd.split(":")[0], 10),
    peakHoursStart: parseInt(peakStart.split(":")[0], 10),
    peakHoursEnd: parseInt(peakEnd.split(":")[0], 10),
    normalRadiusKm: isNaN(maxRadius) ? 25 : Math.min(25, maxRadius),
    peakRadiusMultiplier: isNaN(peakMult) ? 1.5 : peakMult,
    nightRadiusMultiplier: isNaN(nightMult) ? 1.25 : nightMult,
    maxEmergencyRadiusKm: isNaN(maxRadius) ? 50.0 : maxRadius,
    offerExpirationMinutes: isNaN(expMin) ? 5 : expMin,
  };
}

export class EmergencyScalingRepository {
  /**
   * Validates a time rules configuration structure
   */
  static validateTimeRulesConfig(
    config: Partial<EmergencyTimeRulesConfig> & Record<string, unknown>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

    const timeFields = [
      { key: "normal_start_time", label: "Normal window start" },
      { key: "normal_end_time", label: "Normal window end" },
      { key: "peak_start_time", label: "Peak window start" },
      { key: "peak_end_time", label: "Peak window end" },
      { key: "night_start_time", label: "Night window start" },
      { key: "night_end_time", label: "Night window end" },
    ];

    for (const tf of timeFields) {
      const val = config[tf.key as keyof typeof config];
      if (val !== undefined && typeof val === "string") {
        if (!timeRegex.test(val.trim())) {
          errors.push(`Invalid format for ${tf.label}: expected HH:MM (got "${val}")`);
        }
      }
    }

    const multiplierFields = [
      { key: "normal_radius_multiplier", label: "Normal radius multiplier" },
      { key: "peak_radius_multiplier", label: "Peak radius multiplier" },
      { key: "night_radius_multiplier", label: "Night radius multiplier" },
    ];

    for (const mf of multiplierFields) {
      const val = config[mf.key as keyof typeof config];
      if (val !== undefined) {
        const num = Number(val);
        if (isNaN(num) || num < 0) {
          errors.push(`Invalid multiplier for ${mf.label}: must be non-negative (got ${val})`);
        }
      }
    }

    const maxR = config.max_emergency_radius_km ?? config.maxEmergencyRadiusKm;
    if (maxR !== undefined) {
      const num = Number(maxR);
      if (isNaN(num) || num <= 0 || num > 200) {
        errors.push(`Invalid maximum emergency radius: must be between 1 and 200 km (got ${maxR})`);
      }
    }

    const expMin = config.offer_expiration_minutes ?? config.offerExpirationMinutes;
    if (expMin !== undefined) {
      const num = Number(expMin);
      if (isNaN(num) || num < 1 || num > 120) {
        errors.push(`Invalid offer expiration minutes: must be between 1 and 120 (got ${expMin})`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Retrieves active time rules configuration (federation-specific or global)
   */
  static async getTimeRulesConfig(federationId?: string): Promise<EmergencyTimeRulesConfig> {
    const key = federationId || "GLOBAL";
    if (inMemoryTimeRules.has(key)) {
      return inMemoryTimeRules.get(key)!;
    }
    if (federationId && inMemoryTimeRules.has("GLOBAL")) {
      return inMemoryTimeRules.get("GLOBAL")!;
    }

    // Attempt to load from database
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from("emergency_time_rules_config") as any).select("*").eq("is_active", true);
      if (federationId) {
        query = query.eq("federation_id", federationId);
      } else {
        query = query.is("federation_id", null);
      }
      const { data, error } = await query.maybeSingle();
      if (!error && data) {
        const normalized = normalizeTimeRulesConfig(data);
        inMemoryTimeRules.set(key, normalized);
        return normalized;
      }
    } catch {
      // Fallback
    }

    const fallback = { ...DEFAULT_TIME_RULES_CONFIG };
    inMemoryTimeRules.set(key, fallback);
    return fallback;
  }

  /**
   * Saves or overrides time rules configuration (database + memory backed)
   */
  static async saveTimeRulesConfig(
    params: Partial<EmergencyTimeRulesConfig> & { federationId?: string }
  ): Promise<{ success: boolean; config?: EmergencyTimeRulesConfig; error?: string }> {
    const validation = this.validateTimeRulesConfig(params);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join("; ") };
    }

    const key = params.federationId || "GLOBAL";
    const existing = inMemoryTimeRules.get(key) || DEFAULT_TIME_RULES_CONFIG;
    const merged = normalizeTimeRulesConfig({ ...existing, ...params, federation_id: params.federationId || null });

    inMemoryTimeRules.set(key, merged);

    // Persist to database if available
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_time_rules_config") as any).upsert(
        {
          federation_id: merged.federation_id,
          normal_start_time: merged.normal_start_time,
          normal_end_time: merged.normal_end_time,
          peak_start_time: merged.peak_start_time,
          peak_end_time: merged.peak_end_time,
          night_start_time: merged.night_start_time,
          night_end_time: merged.night_end_time,
          normal_radius_multiplier: merged.normal_radius_multiplier,
          peak_radius_multiplier: merged.peak_radius_multiplier,
          night_radius_multiplier: merged.night_radius_multiplier,
          max_emergency_radius_km: merged.max_emergency_radius_km,
          on_call_required_for_night: merged.on_call_required_for_night,
          offer_expiration_minutes: merged.offer_expiration_minutes,
          is_active: merged.is_active,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "federation_id" }
      );
    } catch {
      // Memory persistence guaranteed
    }

    return { success: true, config: merged };
  }

  /**
   * Resets in-memory time rules cache to system defaults
   */
  static resetTimeRulesConfig(federationId?: string): void {
    if (federationId) {
      inMemoryTimeRules.delete(federationId);
    } else {
      inMemoryTimeRules.clear();
      inMemoryTimeRules.set("GLOBAL", { ...DEFAULT_TIME_RULES_CONFIG });
    }
  }

  /**
   * 1. Deterministic Time-Based Evaluation (Normal, Night/On-call, Peak)
   * Reads from configurable rules and evaluates current time window.
   */
  static evaluateTimeRules(
    date: Date = new Date(),
    configOrFederationId?: EmergencyTimeRulesConfig | string
  ): TimeRuleEvaluationResult {
    let config: EmergencyTimeRulesConfig;

    if (configOrFederationId && typeof configOrFederationId === "object") {
      config = normalizeTimeRulesConfig(configOrFederationId);
    } else {
      const key = typeof configOrFederationId === "string" ? configOrFederationId : "GLOBAL";
      config = inMemoryTimeRules.get(key) || DEFAULT_TIME_RULES_CONFIG;
    }

    const currentHour = date.getHours();
    const currentMinutes = currentHour * 60 + date.getMinutes();

    // 1. Peak window check
    if (isMinuteInWindow(currentMinutes, config.peak_start_time, config.peak_end_time)) {
      return {
        window: "PEAK",
        currentHour,
        radiusMultiplier: config.peak_radius_multiplier,
        maxRadiusKm: config.max_emergency_radius_km,
        isNightOnCall: false,
        offerExpirationMinutes: Math.max(3, config.offer_expiration_minutes - 2),
      };
    }

    // 2. Night / On-call window check
    if (isMinuteInWindow(currentMinutes, config.night_start_time, config.night_end_time)) {
      return {
        window: "NIGHT_ON_CALL",
        currentHour,
        radiusMultiplier: config.night_radius_multiplier,
        maxRadiusKm: config.max_emergency_radius_km,
        isNightOnCall: config.on_call_required_for_night,
        offerExpirationMinutes: config.offer_expiration_minutes + 5,
      };
    }

    // 3. Normal window (default)
    return {
      window: "NORMAL",
      currentHour,
      radiusMultiplier: config.normal_radius_multiplier,
      maxRadiusKm: config.max_emergency_radius_km,
      isNightOnCall: false,
      offerExpirationMinutes: config.offer_expiration_minutes,
    };
  }

  /**
   * 2. Additional Worker Dispatch: Consumes Approved Requests
   */
  static async dispatchApprovedAdditionalWorkers(params: {
    requestId: string;
    incidentId: string;
    actorId?: string;
    options?: WorkerEligibilityEvaluationOptions;
  }): Promise<{
    success: boolean;
    dispatchedCount: number;
    dispatches: EmergencyDispatchPoolRecord[];
    error?: string;
  }> {
    const { requestId, incidentId, actorId, options = {} } = params;

    // Load request
    const requests = await EmergencyTaskRepository.listAdditionalWorkerRequests(incidentId);
    const targetRequest = requests.find((r) => r.id === requestId);

    if (!targetRequest) {
      return { success: false, dispatchedCount: 0, dispatches: [], error: "Additional worker request not found." };
    }

    if (targetRequest.status !== "APPROVED") {
      return {
        success: false,
        dispatchedCount: 0,
        dispatches: [],
        error: `Request cannot be dispatched; current status is ${targetRequest.status}, expected APPROVED.`,
      };
    }

    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      return { success: false, dispatchedCount: 0, dispatches: [], error: "Incident not found." };
    }

    // Identify already offered or assigned worker IDs
    const existingDispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incidentId);
    const existingWorkerIds = existingDispatches.map((d) => d.worker_id);

    // Merge excluded IDs
    const combinedExcluded = Array.from(new Set([...existingWorkerIds, ...(options.excludedWorkerIds || [])]));

    const requestedSkill = targetRequest.requested_skill || "General Emergency Worker";

    // Generate dispatch pool for the requested role and count
    const poolResult = await EmergencyDispatchRepository.generateDispatchPool(incidentId, {
      ...options,
      targetCount: targetRequest.requested_worker_count,
      requiredSkillsOverride: targetRequest.requested_skill ? [targetRequest.requested_skill] : undefined,
      roleRequirements: [
        {
          role: requestedSkill,
          skill: requestedSkill,
          count: targetRequest.requested_worker_count,
        },
      ],
      excludedWorkerIds: combinedExcluded,
    });

    const newDispatches = poolResult.dispatches.filter((d) => !existingWorkerIds.includes(d.worker_id));

    // Audit the additional worker dispatch
    if (newDispatches.length > 0) {
      await EmergencyControlCenterRepository.recordAuditLog({
        incidentId,
        federationId: incident.federation_id || "00000000-0000-0000-0000-000000000000",
        actorId: actorId || incident.federation_id || "SYSTEM",
        actionType: "ADDITIONAL_WORKERS_DISPATCHED",
        previousState: { requestId, status: "APPROVED" },
        newState: {
          requestId,
          dispatchedCount: newDispatches.length,
          workerIds: newDispatches.map((d) => d.worker_id),
          skill: targetRequest.requested_skill,
        },
        notes: `Dispatched ${newDispatches.length} workers for approved request: ${targetRequest.requested_skill}`,
      });
    }

    return {
      success: true,
      dispatchedCount: newDispatches.length,
      dispatches: newDispatches,
    };
  }

  /**
   * 3. Worker No-Response / Expiration & Automatic Next-Candidate Offering
   */
  static async expireUnresponsiveOffers(params: {
    incidentId?: string;
    cutoffMinutes?: number;
    actorId?: string;
  }): Promise<{
    expiredCount: number;
    nextDispatchedCount: number;
    expiredDispatches: EmergencyDispatchPoolRecord[];
    newDispatches: EmergencyDispatchPoolRecord[];
  }> {
    const { incidentId, cutoffMinutes = 5, actorId = "SYSTEM" } = params;
    const now = new Date();
    const cutoffTime = new Date(now.getTime() - cutoffMinutes * 60 * 1000);

    const expiredDispatches: EmergencyDispatchPoolRecord[] = [];
    const newDispatches: EmergencyDispatchPoolRecord[] = [];

    // Find dispatches for this incident or all open
    let dispatches: EmergencyDispatchPoolRecord[] = [];
    if (incidentId) {
      dispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incidentId);
    } else {
      // Memory scan fallback
      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data } = await (supabase.from("emergency_dispatch_pool") as any)
          .select("*")
          .eq("status", "DISPATCHED");
        if (data) dispatches = data;
      } catch {
        // Fallback
      }
    }

    // Filter stale dispatches
    const staleDispatches = dispatches.filter((d) => {
      if (d.status !== "DISPATCHED") return false;
      const offeredAt = new Date(d.offered_at);
      return offeredAt < cutoffTime;
    });

    for (const stale of staleDispatches) {
      // Mark as EXPIRED
      await EmergencyDispatchRepository.updateDispatchStatus(
        stale.id,
        "EXPIRED",
        now.toISOString()
      );
      stale.status = "EXPIRED";
      expiredDispatches.push(stale);

      // Audit offer expiration
      await EmergencyControlCenterRepository.recordAuditLog({
        incidentId: stale.incident_id,
        federationId: stale.federation_id,
        actorId,
        actionType: "WORKER_OFFER_EXPIRED",
        previousState: { dispatchId: stale.id, workerId: stale.worker_id, status: "DISPATCHED" },
        newState: { dispatchId: stale.id, status: "EXPIRED" },
        notes: `Emergency response window expired for worker ${stale.worker_id} on role ${stale.required_role}`,
      });

      // Automatically attempt to dispatch the next eligible candidate
      try {
        const allDispatches = await EmergencyDispatchRepository.listDispatchesForIncident(stale.incident_id);
        const alreadyContactedWorkerIds = allDispatches.map((d) => d.worker_id);

        const retryResult = await EmergencyDispatchRepository.generateDispatchPool(stale.incident_id, {
          targetCount: 1,
          roleRequirements: [{ role: stale.required_role, skill: stale.required_role, count: 1 }],
          excludedWorkerIds: alreadyContactedWorkerIds,
        });

        const nextOffer = retryResult.dispatches.find((d) => !alreadyContactedWorkerIds.includes(d.worker_id));
        if (nextOffer) {
          newDispatches.push(nextOffer);

          await EmergencyControlCenterRepository.recordAuditLog({
            incidentId: stale.incident_id,
            federationId: stale.federation_id,
            actorId,
            actionType: "DISPATCH_AUTO_RETRY",
            previousState: { expiredWorkerId: stale.worker_id, role: stale.required_role },
            newState: { newWorkerId: nextOffer.worker_id, newDispatchId: nextOffer.id },
            notes: `Dispatched next ranked candidate following offer expiration`,
          });
        }
      } catch {
        // Continue
      }
    }

    return {
      expiredCount: expiredDispatches.length,
      nextDispatchedCount: newDispatches.length,
      expiredDispatches,
      newDispatches,
    };
  }

  /**
   * 4. Worker Decline & Automatic Next-Candidate Offering
   */
  static async handleWorkerDeclineAndRetry(params: {
    dispatchId: string;
    workerId: string;
    reason?: string;
  }): Promise<{
    success: boolean;
    dispatchId: string;
    nextDispatch: EmergencyDispatchPoolRecord | null;
  }> {
    const { dispatchId, workerId, reason = "Worker declined emergency dispatch" } = params;

    const resp = await EmergencyTeamRepository.respondToDispatch({
      dispatchId,
      workerId,
      response: "DECLINE",
    });

    if (!resp.success) {
      return { success: false, dispatchId, nextDispatch: null };
    }

    const dispatch = await EmergencyDispatchRepository.findDispatchById(dispatchId);
    if (!dispatch) {
      return { success: true, dispatchId, nextDispatch: null };
    }

    // Audit worker decline
    await EmergencyControlCenterRepository.recordAuditLog({
      incidentId: dispatch.incident_id,
      federationId: dispatch.federation_id,
      actorId: workerId,
      actionType: "WORKER_DECLINED",
      previousState: { dispatchId, status: "DISPATCHED" },
      newState: { dispatchId, status: "DECLINED" },
      notes: reason,
    });

    // Try to offer next candidate
    let nextDispatch: EmergencyDispatchPoolRecord | null = null;
    try {
      const allDispatches = await EmergencyDispatchRepository.listDispatchesForIncident(dispatch.incident_id);
      const excludedIds = allDispatches.map((d) => d.worker_id);

      const pool = await EmergencyDispatchRepository.generateDispatchPool(dispatch.incident_id, {
        targetCount: 1,
        roleRequirements: [{ role: dispatch.required_role, skill: dispatch.required_role, count: 1 }],
        excludedWorkerIds: excludedIds,
      });

      const nextOffer = pool.dispatches.find((d) => !excludedIds.includes(d.worker_id));
      if (nextOffer) {
        nextDispatch = nextOffer;
      }
    } catch {
      // Quiet
    }

    return {
      success: true,
      dispatchId,
      nextDispatch,
    };
  }

  /**
   * 5. Worker No-Show & Controlled Replacement Workflow
   */
  static async reportWorkerNoShow(params: {
    incidentId: string;
    teamId: string;
    workerId: string;
    reason: string;
    actorId: string;
  }): Promise<{
    success: boolean;
    member: EmergencyTeamMemberRecord | null;
    replacementDispatch: EmergencyDispatchPoolRecord | null;
    error?: string;
  }> {
    const { incidentId, teamId, workerId, reason, actorId } = params;

    const team = await EmergencyTeamRepository.getTeamById(teamId);
    if (!team) {
      return { success: false, member: null, replacementDispatch: null, error: "Team not found." };
    }

    const members = await EmergencyTeamRepository.listTeamMembers(teamId);
    const targetMember = members.find((m) => m.worker_id === workerId);

    if (!targetMember) {
      return { success: false, member: null, replacementDispatch: null, error: "Worker is not a member of this team." };
    }

    // Update member status to NO_SHOW (preserving historical record)
    await EmergencyTeamRepository.updateMember(teamId, targetMember.id, {
      status: "NO_SHOW",
      updated_at: new Date().toISOString(),
    });

    targetMember.status = "NO_SHOW";

    // Audit worker no-show
    await EmergencyControlCenterRepository.recordAuditLog({
      incidentId,
      federationId: team.federation_id,
      actorId,
      actionType: "WORKER_NO_SHOW",
      previousState: { memberId: targetMember.id, workerId, status: "ACTIVE" },
      newState: { memberId: targetMember.id, status: "NO_SHOW" },
      notes: reason,
    });

    // Create replacement requirement and dispatch next eligible candidate
    let replacementDispatch: EmergencyDispatchPoolRecord | null = null;
    try {
      const allDispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incidentId);
      const activeMemberIds = members.filter((m) => m.status !== "NO_SHOW" && m.status !== "RELEASED").map((m) => m.worker_id);
      const alreadyDispatched = allDispatches.map((d) => d.worker_id);
      const excluded = Array.from(new Set([...activeMemberIds, ...alreadyDispatched, workerId]));

      const pool = await EmergencyDispatchRepository.generateDispatchPool(incidentId, {
        targetCount: 1,
        roleRequirements: [{ role: targetMember.role, skill: targetMember.role, count: 1 }],
        excludedWorkerIds: excluded,
      });

      const nextCandidate = pool.dispatches.find((d) => !excluded.includes(d.worker_id));
      if (nextCandidate) {
        replacementDispatch = nextCandidate;

        await EmergencyControlCenterRepository.recordAuditLog({
          incidentId,
          federationId: team.federation_id,
          actorId,
          actionType: "WORKER_REPLACEMENT_REQUESTED",
          previousState: { noShowWorkerId: workerId, role: targetMember.role },
          newState: { replacementWorkerId: nextCandidate.worker_id, dispatchId: nextCandidate.id },
          notes: `Dispatched candidate ${nextCandidate.worker_id} to replace no-show worker ${workerId}`,
        });
      }
    } catch {
      // Quiet
    }

    return {
      success: true,
      member: targetMember,
      replacementDispatch,
    };
  }

  /**
   * Completes replacement by attaching accepted replacement worker to the team
   */
  static async attachReplacementWorkerToTeam(params: {
    incidentId: string;
    teamId: string;
    originalWorkerId: string;
    replacementWorkerId: string;
    role: string;
    reason: string;
    actorId: string;
  }): Promise<{
    success: boolean;
    member: EmergencyTeamMemberRecord;
  }> {
    const { incidentId, teamId, originalWorkerId, replacementWorkerId, role, reason, actorId } = params;

    const team = await EmergencyTeamRepository.getTeamById(teamId);
    if (!team) {
      throw new Error(`Team not found: ${teamId}`);
    }

    const now = new Date().toISOString();
    const replacementMemberId = crypto.randomUUID();

    const newMember: EmergencyTeamMemberRecord = {
      id: replacementMemberId,
      team_id: teamId,
      incident_id: incidentId,
      worker_id: replacementWorkerId,
      role,
      is_team_lead: false,
      status: "ACTIVE",
      accepted_at: now,
      created_at: now,
      updated_at: now,
    };

    // Add replacement member
    await EmergencyTeamRepository.addMember(teamId, newMember);

    // Update original member to RELEASED
    await EmergencyTeamRepository.updateMember(teamId, originalWorkerId, {
      status: "RELEASED",
      updated_at: now,
    });

    // Audit replacement
    await EmergencyControlCenterRepository.recordAuditLog({
      incidentId,
      federationId: team.federation_id,
      actorId,
      actionType: "WORKER_REPLACED",
      previousState: { releasedWorkerId: originalWorkerId, role },
      newState: { replacementWorkerId, role, status: "ACTIVE" },
      notes: reason,
    });

    return {
      success: true,
      member: newMember,
    };
  }

  /**
   * 6. Staffing Shortage & Multi-Stage Escalation Engine
   */
  static async evaluateShortageAndEscalation(incidentId: string): Promise<ShortageEscalationEvaluation> {
    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    const matrix = await EmergencyIncidentRepository.getIncidentResponseMatrix(incident.id);
    const teams = await EmergencyTeamRepository.listTeamsForIncident(incidentId);
    const dispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incidentId);

    // Calculate worker sums
    let totalRequired = matrix?.recommended_worker_count || 1;
    let totalAccepted = 0;
    let totalActive = 0;
    const assignedRoles: string[] = [];

    for (const team of teams) {
      totalRequired = Math.max(totalRequired, team.required_worker_count);
      const members = team.members || [];
      for (const m of members) {
        if (m.status === "ACTIVE" || m.status === "ASSIGNED") {
          totalAccepted++;
          assignedRoles.push(m.role.toLowerCase());
          if (m.status === "ACTIVE") totalActive++;
        }
      }
    }

    const missingWorkers = Math.max(0, totalRequired - totalAccepted);
    const hasShortage = missingWorkers > 0;

    // Identify missing roles
    const requiredRolesList = (matrix?.worker_roles || []).flatMap((r) => Array(r.count).fill(r.role.toLowerCase()));
    const missingRoles: string[] = [];
    const poolOfAssigned = [...assignedRoles];

    for (const reqRole of requiredRolesList) {
      const idx = poolOfAssigned.findIndex((a) => a.includes(reqRole) || reqRole.includes(a));
      if (idx !== -1) {
        poolOfAssigned.splice(idx, 1);
      } else {
        missingRoles.push(reqRole);
      }
    }

    const declinedCount = dispatches.filter((d) => d.status === "DECLINED").length;
    const expiredCount = dispatches.filter((d) => d.status === "EXPIRED").length;

    // Determine current escalation stage deterministically
    let currentStage: EscalationStage = inMemoryEscalationStages.get(incidentId) || "STAGE_1_NORMAL_DISPATCH";

    if (currentStage === "STAGE_1_NORMAL_DISPATCH" && (declinedCount > 0 || expiredCount > 0)) {
      currentStage = "STAGE_2_RETRY_ELIGIBLE";
    }

    const supportRequests = await EmergencyControlCenterRepository.listSupportRequestsForIncident(incidentId);
    if (supportRequests.some((s) => s.request_type === "ADDITIONAL_TEAM")) {
      currentStage = "STAGE_4_ADDITIONAL_TEAM_REQUIRED";
    }
    if (supportRequests.some((s) => s.request_type === "EXTERNAL_FEDERATION_SUPPORT")) {
      currentStage = "STAGE_5_CROSS_FEDERATION_SUPPORT";
    }

    let recommendedAction = "Continue standard operational monitoring.";
    if (hasShortage) {
      if (currentStage === "STAGE_1_NORMAL_DISPATCH") {
        recommendedAction = "Monitor initial dispatch offers for response.";
      } else if (currentStage === "STAGE_2_RETRY_ELIGIBLE") {
        recommendedAction = "Retry remaining eligible local candidates or request Team Lead input.";
      } else if (currentStage === "STAGE_3_ADDITIONAL_WORKERS_REQUESTED") {
        recommendedAction = "Review and dispatch approved additional worker requests.";
      } else if (currentStage === "STAGE_4_ADDITIONAL_TEAM_REQUIRED") {
        recommendedAction = "Form and dispatch a secondary specialized response team.";
      } else if (currentStage === "STAGE_5_CROSS_FEDERATION_SUPPORT") {
        recommendedAction = "Await target federation review and cross-federation crew deployment.";
      } else {
        recommendedAction = "Critical shortage escalation: alert apex cooperative command.";
      }
    }

    inMemoryEscalationStages.set(incidentId, currentStage);

    return {
      incidentId: incident.id,
      emergencyId: incident.emergency_id,
      totalRequiredWorkers: totalRequired,
      totalAcceptedWorkers: totalAccepted,
      totalActiveWorkers: totalActive,
      missingWorkers,
      hasShortage,
      missingRoles,
      activeTeamsCount: teams.length,
      teams,
      currentStage,
      dispatchesCount: dispatches.length,
      declinedCount,
      expiredCount,
      canEscalate: hasShortage,
      recommendedAction,
    };
  }

  /**
   * Updates an incident's escalation stage explicitly with audit trail
   */
  static async setEscalationStage(params: {
    incidentId: string;
    targetStage: EscalationStage;
    reason: string;
    actorId: string;
    federationId: string;
  }): Promise<{ success: boolean; currentStage: EscalationStage }> {
    const { incidentId, targetStage, reason, actorId, federationId } = params;

    const previousStage = inMemoryEscalationStages.get(incidentId) || "STAGE_1_NORMAL_DISPATCH";
    inMemoryEscalationStages.set(incidentId, targetStage);

    await EmergencyControlCenterRepository.recordAuditLog({
      incidentId,
      federationId,
      actorId,
      actionType: "ESCALATION_STAGE_CHANGED",
      previousState: { stage: previousStage },
      newState: { stage: targetStage },
      notes: reason,
    });

    return { success: true, currentStage: targetStage };
  }

  /**
   * 7. Cross-Federation Support Review & Controlled Deployment
   */
  static async reviewCrossFederationSupportRequest(params: {
    requestId: string;
    targetFederationAdminId: string;
    targetFederationId: string;
    action: "ACCEPT" | "DECLINE";
    adminNotes?: string;
  }): Promise<{
    success: boolean;
    request: EmergencySupportRequestRecord | null;
    supportTeam?: EmergencyResponseTeamRecord;
    error?: string;
  }> {
    const { requestId, targetFederationAdminId, targetFederationId, action, adminNotes = null } = params;

    const targetReq = await EmergencyControlCenterRepository.findSupportRequestById(requestId);

    if (!targetReq) {
      return { success: false, request: null, error: "Support request not found." };
    }

    // Verify target federation scoping
    if (targetReq.target_federation_id && targetReq.target_federation_id !== targetFederationId) {
      return {
        success: false,
        request: targetReq,
        error: "Forbidden: You are not authorized to review a request targeted to another federation.",
      };
    }

    const now = new Date().toISOString();
    const newStatus = action === "ACCEPT" ? "ACCEPTED" : "DECLINED";
    targetReq.status = newStatus;
    targetReq.admin_notes = adminNotes;
    targetReq.updated_at = now;

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_support_requests") as any)
        .update({
          status: newStatus,
          admin_notes: adminNotes,
          updated_at: now,
        })
        .eq("id", requestId);
    } catch {
      // Memory fallback
    }

    // Audit support request review
    await EmergencyControlCenterRepository.recordAuditLog({
      incidentId: targetReq.incident_id,
      federationId: targetFederationId,
      actorId: targetFederationAdminId,
      actionType: "CROSS_FEDERATION_SUPPORT_REVIEWED",
      previousState: { requestId, status: "PENDING_REVIEW" },
      newState: { requestId, status: newStatus, action },
      notes: adminNotes || `Cross-federation support ${action.toLowerCase()}ed by Federation Admin ${targetFederationAdminId}`,
    });

    // If accepted, create a Support Team attached to the incident
    let supportTeam: EmergencyResponseTeamRecord | undefined;
    if (action === "ACCEPT") {
      supportTeam = await EmergencyTeamRepository.createAdditionalTeam({
        incidentId: targetReq.incident_id,
        federationId: targetFederationId,
        teamType: "SUPPORT",
        requiredWorkerCount: targetReq.requested_worker_count,
        status: "FORMING",
        reason: `External support crew provided by Federation ${targetFederationId}`,
        actorId: targetFederationAdminId,
      });

      // Dispatch eligible workers from the target federation
      try {
        await EmergencyDispatchRepository.generateDispatchPool(targetReq.incident_id, {
          targetFederationId: targetFederationId,
          targetCount: targetReq.requested_worker_count,
          roleRequirements: (targetReq.requested_roles || []).map((r) => ({
            role: r,
            skill: r,
            count: 1,
          })),
        });
      } catch {
        // Quiet
      }
    }

    return {
      success: true,
      request: targetReq,
      supportTeam,
    };
  }

  /**
   * 8. Radius Expansion Dispatching
   */
  static async expandEmergencyRadius(params: {
    incidentId: string;
    expansionMultiplier?: number;
    maxRadiusKm?: number;
    reason: string;
    actorId: string;
    federationId: string;
  }): Promise<{
    success: boolean;
    newDispatchesCount: number;
    dispatches: EmergencyDispatchPoolRecord[];
  }> {
    const {
      incidentId,
      expansionMultiplier = 1.5,
      maxRadiusKm = 50,
      reason,
      actorId,
      federationId,
    } = params;

    const existingDispatches = await EmergencyDispatchRepository.listDispatchesForIncident(incidentId);
    const existingIds = existingDispatches.map((d) => d.worker_id);

    const pool = await EmergencyDispatchRepository.generateDispatchPool(incidentId, {
      radiusMultiplier: expansionMultiplier,
      maxRadiusKm,
      excludedWorkerIds: existingIds,
    });

    const newlyDispatched = pool.dispatches.filter((d) => !existingIds.includes(d.worker_id));

    // Audit radius expansion
    await EmergencyControlCenterRepository.recordAuditLog({
      incidentId,
      federationId,
      actorId,
      actionType: "SEARCH_RADIUS_EXPANDED",
      previousState: { expansionMultiplier: 1.0 },
      newState: { expansionMultiplier, maxRadiusKm, newOffersCount: newlyDispatched.length },
      notes: reason,
    });

    return {
      success: true,
      newDispatchesCount: newlyDispatched.length,
      dispatches: newlyDispatched,
    };
  }
}

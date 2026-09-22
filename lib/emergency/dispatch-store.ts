import { createAdminClient } from "@/lib/supabase/admin";
import {
  EmergencyIncidentRepository,
  EmergencyIncidentRecord,
} from "@/lib/emergency/incident-store";
import {
  type EmergencyResponseMatrixRecord,
  type WorkerRoleRequirement,
} from "@/lib/emergency/response-matrix-store";

export type DispatchPoolStatus =
  "CANDIDATE" | "DISPATCHED" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "WITHDRAWN";

export interface EmergencyDispatchPoolRecord {
  id: string;
  incident_id: string;
  worker_id: string;
  federation_id: string;
  required_role: string;
  matched_skills: string[];
  eligibility_score: number;
  eligibility_reasons: Record<string, unknown>;
  status: DispatchPoolStatus;
  offered_at: string;
  responded_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Optional enriched fields for display
  worker_name?: string;
  worker_phone?: string;
  profession?: string;
  distance_km?: number;
}

export interface WorkerEligibilityEvaluation {
  workerId: string;
  workerName: string;
  profession: string;
  isEligible: boolean;
  exclusionReasons: string[];
  matchedSkills: string[];
  assignedRole: string;
  score: number;
  distanceKm: number | null;
  federationId: string;
}

export interface DispatchPoolResult {
  incidentId: string;
  emergencyId: string;
  requiredCount: number;
  dispatchedCount: number;
  isStaffingShortage: boolean;
  shortageCount: number;
  dispatches: EmergencyDispatchPoolRecord[];
  evaluatedCandidatesCount: number;
  eligibleCandidatesCount: number;
}

export interface WorkerEligibilityEvaluationOptions {
  radiusMultiplier?: number;
  maxRadiusKm?: number;
  targetFederationId?: string;
  allowCrossFederation?: boolean;
  requiredSkillsOverride?: string[];
  enforceCriticalSafety?: boolean;
  requiredQualificationCode?: string;
  excludedWorkerIds?: string[];
  targetCount?: number;
  roleRequirements?: { role: string; skill?: string; count: number }[];
  preserveStatus?: boolean;
}

// In-memory cache for fast testing & offline fallback
const inMemoryDispatchPool = new Map<string, EmergencyDispatchPoolRecord>();

/**
 * Deterministic Haversine distance calculator in KM (reusing existing project pattern)
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class EmergencyDispatchRepository {
  /**
   * Evaluates all candidates and generates an automated Dispatch Pool for an incident
   */
  static async generateDispatchPool(
    incidentId: string,
    options?: WorkerEligibilityEvaluationOptions & {
      roleRequirements?: WorkerRoleRequirement[];
      targetCount?: number;
    }
  ): Promise<DispatchPoolResult> {
    const incident = await EmergencyIncidentRepository.findById(incidentId);
    if (!incident) {
      throw new Error(`Incident not found: ${incidentId}`);
    }

    // 1. Resolve Response Matrix deterministically
    const matrix = await EmergencyIncidentRepository.getIncidentResponseMatrix(incident.id);
    if (!matrix) {
      throw new Error(
        `Response matrix could not be resolved for emergency type: ${incident.emergency_type}`
      );
    }

    const requiredCount = options?.targetCount || matrix.recommended_worker_count || 1;

    // Resolve time rules configuration dynamically if multipliers are not explicitly overridden
    const resolvedOptions: WorkerEligibilityEvaluationOptions = { ...options };
    if (
      resolvedOptions.radiusMultiplier === undefined ||
      resolvedOptions.maxRadiusKm === undefined
    ) {
      try {
        const { EmergencyScalingRepository } = await import("@/lib/emergency/scaling-store");
        const timeConfig = await EmergencyScalingRepository.getTimeRulesConfig(
          incident.federation_id || undefined
        );
        const timeEval = EmergencyScalingRepository.evaluateTimeRules(new Date(), timeConfig);
        if (resolvedOptions.radiusMultiplier === undefined) {
          resolvedOptions.radiusMultiplier = timeEval.radiusMultiplier;
        }
        if (resolvedOptions.maxRadiusKm === undefined) {
          resolvedOptions.maxRadiusKm = timeEval.maxRadiusKm;
        }
      } catch {
        resolvedOptions.radiusMultiplier = resolvedOptions.radiusMultiplier ?? 1.0;
        resolvedOptions.maxRadiusKm = resolvedOptions.maxRadiusKm ?? 50.0;
      }
    }

    // 2. Query all candidate workers and their skills/profiles/addresses
    const rawWorkers = await this.fetchAllCandidateWorkers();

    // 3. Evaluate each worker against deterministic eligibility rules
    const evaluations: WorkerEligibilityEvaluation[] = [];
    for (const rawW of rawWorkers) {
      const evalResult = await this.evaluateWorkerEligibility(
        rawW,
        incident,
        matrix,
        resolvedOptions
      );
      evaluations.push(evalResult);
    }

    // 4. Filter and rank eligible workers
    const eligibleWorkers = evaluations
      .filter((e) => e.isEligible)
      .sort((a, b) => {
        // Higher score first
        if (b.score !== a.score) return b.score - a.score;
        // Closer distance first
        const distA = a.distanceKm ?? 999;
        const distB = b.distanceKm ?? 999;
        return distA - distB;
      });

    // 5. Select workers to fulfill the required roles and worker count from Response Matrix
    const rolesToAssign = options?.roleRequirements || matrix.worker_roles;
    const selectedWorkers = this.assignRolesToCandidates(
      eligibleWorkers,
      rolesToAssign,
      requiredCount
    );

    const now = new Date().toISOString();
    const createdDispatches: EmergencyDispatchPoolRecord[] = [];

    // 6. Persist Dispatch Pool records (prevent duplicates)
    for (const cand of selectedWorkers) {
      const dispatchId = crypto.randomUUID();
      const existingKey = `${incident.id}:${cand.workerId}`;

      // Check if duplicate dispatch already exists
      const existing = await this.findDispatch(incident.id, cand.workerId);
      if (existing) {
        createdDispatches.push(existing);
        continue;
      }

      const dispatchRecord: EmergencyDispatchPoolRecord = {
        id: dispatchId,
        incident_id: incident.id,
        worker_id: cand.workerId,
        federation_id: cand.federationId,
        required_role: cand.assignedRole,
        matched_skills: cand.matchedSkills,
        eligibility_score: cand.score,
        eligibility_reasons: {
          matchedSkills: cand.matchedSkills,
          distanceKm: cand.distanceKm,
          evaluation: "Eligible under deterministic criteria",
        },
        status: "DISPATCHED",
        offered_at: now,
        responded_at: null,
        notes: `Dispatched opportunity for ${cand.assignedRole}`,
        created_at: now,
        updated_at: now,
        worker_name: cand.workerName,
        profession: cand.profession,
        distance_km: cand.distanceKm ?? undefined,
      };

      inMemoryDispatchPool.set(existingKey, dispatchRecord);
      inMemoryDispatchPool.set(dispatchId, dispatchRecord);

      try {
        const supabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from("emergency_dispatch_pool") as any)
          .insert({
            id: dispatchRecord.id,
            incident_id: dispatchRecord.incident_id,
            worker_id: dispatchRecord.worker_id,
            federation_id: dispatchRecord.federation_id,
            required_role: dispatchRecord.required_role,
            matched_skills: dispatchRecord.matched_skills,
            eligibility_score: dispatchRecord.eligibility_score,
            eligibility_reasons: dispatchRecord.eligibility_reasons,
            status: dispatchRecord.status,
            offered_at: dispatchRecord.offered_at,
            notes: dispatchRecord.notes,
            created_at: dispatchRecord.created_at,
            updated_at: dispatchRecord.updated_at,
          })
          .select()
          .maybeSingle();

        if (!error && data) {
          createdDispatches.push({
            ...dispatchRecord,
            ...data,
          });
          continue;
        }
      } catch {
        // Fallback to in-memory record
      }

      createdDispatches.push(dispatchRecord);
    }

    // 7. Shortage Detection
    const dispatchedCount = createdDispatches.length;
    const isStaffingShortage = dispatchedCount < requiredCount;
    const shortageCount = Math.max(0, requiredCount - dispatchedCount);

    // 8. Update Incident status based on staffing outcome (unless preserveStatus is requested)
    if (!options?.preserveStatus) {
      const newStatus = isStaffingShortage ? "STAFFING_SHORTAGE" : "DISPATCHING";
      await EmergencyIncidentRepository.updateIncidentStatus(
        incident.id,
        newStatus,
        "SERVICE_ROLE"
      );
    }

    return {
      incidentId: incident.id,
      emergencyId: incident.emergency_id,
      requiredCount,
      dispatchedCount,
      isStaffingShortage,
      shortageCount,
      dispatches: createdDispatches,
      evaluatedCandidatesCount: evaluations.length,
      eligibleCandidatesCount: eligibleWorkers.length,
    };
  }

  /**
   * Evaluates an individual worker's eligibility against deterministic rules
   */
  static async evaluateWorkerEligibility(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    workerData: any,
    incident: EmergencyIncidentRecord,
    matrix: EmergencyResponseMatrixRecord,
    options?: WorkerEligibilityEvaluationOptions
  ): Promise<WorkerEligibilityEvaluation> {
    const workerId = workerData.id;
    const workerName = workerData.profiles?.full_name || "Unknown Worker";
    const profession = workerData.profession || "";
    const federationId = workerData.federation_id;
    const exclusionReasons: string[] = [];
    const matchedSkills: string[] = [];

    // Excluded worker filter
    if (options?.excludedWorkerIds && options.excludedWorkerIds.includes(workerId)) {
      exclusionReasons.push("Worker is already assigned or excluded from evaluation");
    }

    // Target federation check (for cross-federation or scoped dispatch)
    if (options?.targetFederationId && workerData.federation_id !== options.targetFederationId) {
      exclusionReasons.push(
        `Worker belongs to federation ${workerData.federation_id}, required: ${options.targetFederationId}`
      );
    }

    // Rule 1: Verification Status
    if (workerData.verification_status !== "verified") {
      exclusionReasons.push(`Worker is not verified (status: ${workerData.verification_status})`);
    }

    // Rule 2: Account Status
    if (workerData.account_status !== "ACTIVE") {
      exclusionReasons.push(`Worker account is not ACTIVE (status: ${workerData.account_status})`);
    }

    // Rule 3: Availability Status
    if (workerData.availability_status !== "AVAILABLE") {
      exclusionReasons.push(
        `Worker availability status is not AVAILABLE (status: ${workerData.availability_status})`
      );
    }

    // Rule 4: Required Skills Match
    const workerSkillsList: string[] = Array.isArray(workerData.worker_skills)
      ? workerData.worker_skills
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .map((ws: any) => ws.skills?.name || "")
          .filter(Boolean)
      : [];

    if (profession) {
      workerSkillsList.push(profession);
    }

    const skillsToMatch =
      options?.requiredSkillsOverride && options.requiredSkillsOverride.length > 0
        ? options.requiredSkillsOverride
        : matrix.required_skills;

    // Compare worker skills against required skills
    for (const reqSkill of skillsToMatch) {
      const normalizedReq = reqSkill.toLowerCase().trim();
      const hasSkill = workerSkillsList.some((ws) => {
        const normWs = ws.toLowerCase().trim();
        return (
          normWs === normalizedReq ||
          normWs.includes(normalizedReq) ||
          normalizedReq.includes(normWs) ||
          (normWs === "plumber" &&
            (normalizedReq.includes("plumb") ||
              normalizedReq.includes("pipe") ||
              normalizedReq.includes("water") ||
              normalizedReq.includes("drain"))) ||
          (normWs === "electrician" &&
            (normalizedReq.includes("electr") ||
              normalizedReq.includes("power") ||
              normalizedReq.includes("wire") ||
              normalizedReq.includes("circuit") ||
              normalizedReq.includes("volt"))) ||
          (normWs.includes("plumb") && normalizedReq.includes("plumb")) ||
          (normWs.includes("electr") && normalizedReq.includes("electr"))
        );
      });
      if (hasSkill) {
        matchedSkills.push(reqSkill);
      }
    }

    if (matchedSkills.length === 0) {
      exclusionReasons.push("Worker does not possess any required emergency skills");
    }

    // Rule 4b: Critical Emergency Safety Protocol & Verified Qualification Check
    const isCritical = incident.severity === "CRITICAL";
    const matrixSafetyReqs = matrix.safety_requirements || [];
    const hasCriticalSafetyReq = matrixSafetyReqs.some(
      (s) =>
        s.toUpperCase().includes("CRITICAL_SAFETY_QUALIFIED") ||
        s.toLowerCase().includes("safety qualified") ||
        s.toLowerCase().includes("critical safety")
    );

    const requiresCriticalSafety =
      options?.enforceCriticalSafety ||
      (isCritical && (hasCriticalSafetyReq || Boolean(options?.requiredQualificationCode)));

    if (requiresCriticalSafety && isCritical) {
      const requiredQualCode = (
        options?.requiredQualificationCode ||
        matrixSafetyReqs.find((s) => s.toUpperCase().includes("CRITICAL_SAFETY_QUALIFIED")) ||
        "CRITICAL_SAFETY_QUALIFIED"
      ).trim();

      // Look up actual qualification records from existing worker_certifications table data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const workerCerts: any[] = Array.isArray(workerData.worker_certifications)
        ? workerData.worker_certifications
        : [];

      // Find matching qualification record in worker_certifications
      const matchingCert = workerCerts.find((wc) => {
        const title = (wc.certifications?.title || wc.title || "").toUpperCase();
        const certNum = (wc.certificate_number || "").toUpperCase();
        const certId = (wc.certification_id || "").toUpperCase();
        const code = requiredQualCode.toUpperCase();
        return (
          title === code ||
          title.includes(code) ||
          code.includes(title) ||
          certNum === code ||
          certId === code ||
          (code === "CRITICAL_SAFETY_QUALIFIED" &&
            (title.includes("SAFETY") || title.includes("CRITICAL")))
        );
      });

      if (!matchingCert) {
        exclusionReasons.push(
          `Worker excluded by Critical Safety Protocol: Missing required critical safety qualification (${requiredQualCode})`
        );
      } else {
        // 1. Verification status check
        const isVerified =
          matchingCert.is_verified === true ||
          matchingCert.status === "VERIFIED" ||
          matchingCert.status === "EXPIRING_SOON";

        if (
          !isVerified ||
          matchingCert.status === "PENDING" ||
          matchingCert.status === "UNVERIFIED"
        ) {
          exclusionReasons.push(
            `Worker excluded by Critical Safety Protocol: Required critical qualification (${requiredQualCode}) is unverified or inactive (status: ${matchingCert.status || "UNVERIFIED"})`
          );
        } else if (matchingCert.status === "EXPIRED") {
          exclusionReasons.push(
            `Worker excluded by Critical Safety Protocol: Required critical qualification (${requiredQualCode}) has expired (status: EXPIRED)`
          );
        } else if (matchingCert.expiry_date) {
          const expiryTime = new Date(matchingCert.expiry_date).getTime();
          if (expiryTime < Date.now()) {
            exclusionReasons.push(
              `Worker excluded by Critical Safety Protocol: Required critical qualification (${requiredQualCode}) has expired (expiry date: ${matchingCert.expiry_date})`
            );
          }
        }
      }
    }

    // Rule 5: Location / Service Radius (Haversine calculation)
    const incidentDetails = incident.address_details || {};
    const incidentLat = Number(incidentDetails.latitude) || 23.03;
    const incidentLon = Number(incidentDetails.longitude) || 72.5178;

    const workerLat = workerData.current_latitude || 23.03;
    const workerLon = workerData.current_longitude || 72.5178;
    const baseServiceRadius = Number(workerData.service_radius_km) || 25.0;
    const radiusMultiplier = options?.radiusMultiplier || 1.0;
    const maxRadius = options?.maxRadiusKm || 50.0;
    const effectiveServiceRadius = Math.min(baseServiceRadius * radiusMultiplier, maxRadius);

    const distanceKm = calculateHaversineKm(incidentLat, incidentLon, workerLat, workerLon);

    if (distanceKm > effectiveServiceRadius) {
      exclusionReasons.push(
        `Worker is outside service radius: ${distanceKm} km > ${effectiveServiceRadius} km (base: ${baseServiceRadius} km, mult: ${radiusMultiplier})`
      );
    }

    // Rule 6: Current Emergency Capacity (Not already dispatched to another open emergency)
    const hasActiveEmergency = await this.hasActiveEmergencyDispatch(workerId, incident?.id);
    if (hasActiveEmergency) {
      exclusionReasons.push("Worker already has an active emergency dispatch");
    }

    // Calculate deterministic match score
    let score = 50.0;
    score += matchedSkills.length * 15.0;
    score += Math.min(20, (workerData.experience_years || 0) * 2);
    score -= Math.min(20, distanceKm * 0.5);

    const isEligible = exclusionReasons.length === 0;

    return {
      workerId,
      workerName,
      profession,
      isEligible,
      exclusionReasons,
      matchedSkills,
      assignedRole: matchedSkills.length > 0 ? matchedSkills[0] : profession || "General Responder",
      score: Math.max(10, Math.round(score * 10) / 10),
      distanceKm,
      federationId,
    };
  }

  /**
   * Deterministically assigns required roles from matrix to candidates
   */
  private static assignRolesToCandidates(
    eligible: WorkerEligibilityEvaluation[],
    workerRoles: WorkerRoleRequirement[],
    targetCount: number
  ): WorkerEligibilityEvaluation[] {
    const assigned: WorkerEligibilityEvaluation[] = [];
    const pool = [...eligible];

    // Try to satisfy structured roles (e.g. 1 Team Lead, 3 Plumbers, etc.)
    if (Array.isArray(workerRoles) && workerRoles.length > 0) {
      for (const reqRole of workerRoles) {
        let needed = reqRole.count;
        for (let i = pool.length - 1; i >= 0 && needed > 0; i--) {
          const cand = pool[i];
          // Check if candidate matches role skill or profession
          const roleSkill = reqRole.skill.toLowerCase();
          const matches =
            cand.matchedSkills.some((s) => roleSkill.includes(s.toLowerCase())) ||
            cand.profession.toLowerCase().includes(reqRole.role.toLowerCase());

          if (matches || pool.length <= needed) {
            assigned.push({
              ...cand,
              assignedRole: reqRole.role,
            });
            pool.splice(i, 1);
            needed--;
            if (assigned.length >= targetCount) break;
          }
        }
        if (assigned.length >= targetCount) break;
      }
    }

    // Fill remaining slots up to targetCount with top eligible workers
    while (pool.length > 0 && assigned.length < targetCount) {
      const next = pool.shift()!;
      assigned.push(next);
    }

    return assigned;
  }

  /**
   * Checks if a worker already has an active emergency dispatch opportunity
   */
  static async hasActiveEmergencyDispatch(
    workerId: string,
    excludeIncidentId?: string
  ): Promise<boolean> {
    const now = Date.now();
    const DISPATCH_EXPIRY_MS = 5 * 60 * 1000; // 5-minute standard dispatch offer window

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from("emergency_dispatch_pool") as any)
        .select("id, incident_id, status, offered_at, emergency_incidents(status)")
        .eq("worker_id", workerId)
        .in("status", ["DISPATCHED", "ACCEPTED"]);

      if (excludeIncidentId) {
        query = query.neq("incident_id", excludeIncidentId);
      }

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hasActive = data.some((d: any) => {
          const incStatus = d.emergency_incidents?.status;
          if (incStatus === "RESOLVED" || incStatus === "CLOSED" || incStatus === "CANCELLED") {
            return false;
          }
          if (d.status === "DISPATCHED") {
            // Unaccepted offer: only active if offered within the valid dispatch window (5 minutes)
            const offeredTime = d.offered_at ? new Date(d.offered_at).getTime() : 0;
            return now - offeredTime < DISPATCH_EXPIRY_MS;
          }
          return d.status === "ACCEPTED";
        });
        if (hasActive) return true;
      }
    } catch {
      // Memory check
    }

    return Array.from(inMemoryDispatchPool.values()).some((d) => {
      if (d.worker_id !== workerId) return false;
      if (excludeIncidentId && d.incident_id === excludeIncidentId) return false;
      if (d.status !== "DISPATCHED" && d.status !== "ACCEPTED") return false;
      if (d.status === "DISPATCHED") {
        const offeredTime = d.offered_at ? new Date(d.offered_at).getTime() : 0;
        return now - offeredTime < DISPATCH_EXPIRY_MS;
      }
      return d.status === "ACCEPTED";
    });
  }

  /**
   * Retrieves single dispatch record for an incident and worker
   */
  static async findDispatch(
    incidentId: string,
    workerId: string
  ): Promise<EmergencyDispatchPoolRecord | null> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_dispatch_pool") as any)
        .select("*")
        .eq("incident_id", incidentId)
        .eq("worker_id", workerId)
        .maybeSingle();

      if (!error && data) {
        return data as EmergencyDispatchPoolRecord;
      }
    } catch {
      // Memory check
    }

    return inMemoryDispatchPool.get(`${incidentId}:${workerId}`) || null;
  }

  /**
   * Retrieves single dispatch record by dispatch ID
   */
  static async findDispatchById(dispatchId: string): Promise<EmergencyDispatchPoolRecord | null> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_dispatch_pool") as any)
        .select("*")
        .eq("id", dispatchId)
        .maybeSingle();

      if (!error && data) {
        return data as EmergencyDispatchPoolRecord;
      }
    } catch {
      // Memory check
    }

    return inMemoryDispatchPool.get(dispatchId) || null;
  }

  /**
   * Updates dispatch status (e.g. ACCEPTED or DECLINED)
   */
  static async updateDispatchStatus(
    dispatchId: string,
    status: DispatchPoolStatus,
    respondedAt: string = new Date().toISOString()
  ): Promise<void> {
    const existing = inMemoryDispatchPool.get(dispatchId);
    if (existing) {
      existing.status = status;
      existing.responded_at = respondedAt;
      existing.updated_at = respondedAt;
      inMemoryDispatchPool.set(dispatchId, existing);
      inMemoryDispatchPool.set(`${existing.incident_id}:${existing.worker_id}`, existing);
    }

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_dispatch_pool") as any)
        .update({
          status,
          responded_at: respondedAt,
          updated_at: respondedAt,
        })
        .eq("id", dispatchId);
    } catch {
      // Memory fallback
    }
  }

  /**
   * Records or updates a direct assignment in the dispatch pool
   */
  static async recordDirectAssignment(
    record: EmergencyDispatchPoolRecord
  ): Promise<EmergencyDispatchPoolRecord> {
    inMemoryDispatchPool.set(record.id, record);
    inMemoryDispatchPool.set(`${record.incident_id}:${record.worker_id}`, record);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_dispatch_pool") as any).upsert({
        id: record.id,
        incident_id: record.incident_id,
        worker_id: record.worker_id,
        federation_id: record.federation_id,
        required_role: record.required_role,
        matched_skills: record.matched_skills,
        eligibility_score: record.eligibility_score,
        eligibility_reasons: record.eligibility_reasons,
        status: record.status,
        offered_at: record.offered_at,
        responded_at: record.responded_at,
        notes: record.notes,
        created_at: record.created_at,
        updated_at: record.updated_at,
      });
    } catch {
      // Memory fallback
    }

    return record;
  }

  /**
   * Lists all dispatch records for an incident
   */
  static async listDispatchesForIncident(
    incidentId: string
  ): Promise<EmergencyDispatchPoolRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_dispatch_pool") as any)
        .select(
          `
          *,
          workers (
            id,
            profession,
            profiles ( full_name, phone )
          )
        `
        )
        .eq("incident_id", incidentId)
        .order("offered_at", { ascending: true });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((d: any) => ({
          ...d,
          worker_name: d.workers?.profiles?.full_name,
          worker_phone: d.workers?.profiles?.phone,
          profession: d.workers?.profession,
        }));
      }
    } catch {
      // Memory check
    }

    return Array.from(inMemoryDispatchPool.values()).filter((d) => d.incident_id === incidentId);
  }

  /**
   * Lists all dispatch opportunities offered to a specific worker
   */
  static async listDispatchesForWorker(workerId: string): Promise<EmergencyDispatchPoolRecord[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("emergency_dispatch_pool") as any)
        .select(
          `
          *,
          emergency_incidents (
            id,
            emergency_id,
            category_name,
            emergency_type,
            severity,
            status,
            location,
            description
          )
        `
        )
        .eq("worker_id", workerId)
        .order("offered_at", { ascending: false });

      if (!error && data && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const active = (data as any[]).filter((d) => {
          const incStatus = d.emergency_incidents?.status;
          return incStatus !== "CLOSED" && incStatus !== "RESOLVED" && incStatus !== "CANCELLED";
        });
        return active as EmergencyDispatchPoolRecord[];
      }
    } catch {
      // Memory check
    }

    const { EmergencyIncidentRepository } = await import("@/lib/emergency/incident-store");
    const rawList = Array.from(inMemoryDispatchPool.values()).filter((d) => d.worker_id === workerId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validList: (EmergencyDispatchPoolRecord & { emergency_incidents?: any })[] = [];

    for (const d of rawList) {
      const inc = await EmergencyIncidentRepository.findById(d.incident_id);
      if (inc && inc.status !== "CLOSED" && inc.status !== "RESOLVED" && inc.status !== "CANCELLED") {
        validList.push({
          ...d,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          emergency_incidents: inc as any,
        });
      }
    }

    return validList;
  }

  /**
   * Internal helper to fetch all workers with skills and profiles
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static async fetchAllCandidateWorkers(): Promise<any[]> {
    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("workers") as any).select(`
        id,
        profile_id,
        federation_id,
        account_status,
        availability_status,
        verification_status,
        profession,
        hourly_rate,
        experience_years,
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
          issue_date,
          expiry_date,
          certifications ( id, title, issuing_body )
        )
      `);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // Fallback
    }

    return [];
  }

  /**
   * Dispatches a single candidate worker directly for a specific role
   */
  static async dispatchWorker(params: {
    incidentId: string;
    workerId: string;
    federationId: string;
    requiredRole: string;
    matchedSkills?: string[];
    eligibilityScore?: number;
    notes?: string;
  }): Promise<EmergencyDispatchPoolRecord> {
    const {
      incidentId,
      workerId,
      federationId,
      requiredRole,
      matchedSkills = [],
      eligibilityScore = 80,
      notes = null,
    } = params;
    const now = new Date().toISOString();
    const dispatchId = crypto.randomUUID();

    const dispatchRecord: EmergencyDispatchPoolRecord = {
      id: dispatchId,
      incident_id: incidentId,
      worker_id: workerId,
      federation_id: federationId,
      required_role: requiredRole,
      matched_skills: matchedSkills,
      eligibility_score: eligibilityScore,
      eligibility_reasons: { directDispatch: true, matchedSkills },
      status: "DISPATCHED",
      offered_at: now,
      responded_at: null,
      notes: notes || `Direct dispatch for ${requiredRole}`,
      created_at: now,
      updated_at: now,
    };

    inMemoryDispatchPool.set(`${incidentId}:${workerId}`, dispatchRecord);
    inMemoryDispatchPool.set(dispatchId, dispatchRecord);

    try {
      const supabase = createAdminClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("emergency_dispatch_pool") as any).insert({
        id: dispatchRecord.id,
        incident_id: dispatchRecord.incident_id,
        worker_id: dispatchRecord.worker_id,
        federation_id: dispatchRecord.federation_id,
        required_role: dispatchRecord.required_role,
        matched_skills: dispatchRecord.matched_skills,
        eligibility_score: dispatchRecord.eligibility_score,
        eligibility_reasons: dispatchRecord.eligibility_reasons,
        status: dispatchRecord.status,
        offered_at: dispatchRecord.offered_at,
        notes: dispatchRecord.notes,
        created_at: dispatchRecord.created_at,
        updated_at: dispatchRecord.updated_at,
      });
    } catch {
      // Memory fallback
    }

    return dispatchRecord;
  }
}

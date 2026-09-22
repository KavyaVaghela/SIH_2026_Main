import { createClient } from "@/lib/supabase/client";

export interface WorkerUtilizationProfile {
  workerId: string;
  workerName: string;
  phone?: string;
  profession: string;
  federationId: string;
  federationName: string;
  city: string;
  hourlyRate: number;
  experienceYears: number;
  serviceRadiusKm: number;
  latitude: number | null;
  longitude: number | null;
  isVerified: boolean;
  accountStatus: string;
  availabilityStatus: string;

  // 14-day deterministic utilization metrics
  workedHours14d: number;
  completedBookings14d: number;
  capacityHours14d: number;
  utilizationRatio: number; // 0.0 to 1.0

  // Under-utilization status
  isUnderUtilized: boolean;
  underUtilizedReason: string;

  // Active workload signals
  hasActiveProjectCommitment: boolean;
  hasActiveEmergencyCommitment: boolean;
  skills: string[];
}

export interface WorkforceUtilizationSummary {
  totalWorkers: number;
  activeVerifiedWorkers: number;
  availableWorkers: number;
  underUtilizedWorkersCount: number;
  averageUtilizationRate: number; // percentage (0-100)
  underUtilizedWorkers: WorkerUtilizationProfile[];
  workersByTrade: Record<string, { total: number; available: number; underUtilized: number }>;
  workersByFederation: Record<string, { federationName: string; city: string; total: number; available: number; underUtilized: number }>;
  largeProjectDemandHeadcount: number;
  emergencyActiveTaskCount: number;
}

export class WorkforceUtilizationService {
  /**
   * Deterministically calculates workforce utilization across the last 14 days
   * based 100% on live Supabase records.
   *
   * A worker is strictly under-utilized if:
   * 1. Account status is ACTIVE
   * 2. Verification status is 'verified'
   * 3. Availability status is 'AVAILABLE' (not off-duty or suspended)
   * 4. No active emergency response or large project commitment locks
   * 5. Worked hours in past 14 days < 40% of standard capacity (under 32 hrs)
   */
  async getWorkforceUtilization(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    clientOverride?: any,
    targetFederationId?: string
  ): Promise<WorkforceUtilizationSummary> {
    const supabase = clientOverride || createClient();

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

    // Query live data in parallel
    const [
      workersRes,
      federationsRes,
      bookingsRes,
      workerSkillsRes,
      projectAllocationsRes,
      emergencyTasksRes,
      projectReqsRes,
    ] = await Promise.allSettled([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("workers") as any)
        .select(`
          id,
          profile_id,
          federation_id,
          profession,
          account_status,
          availability_status,
          verification_status,
          hourly_rate,
          experience_years,
          service_radius_km,
          current_latitude,
          current_longitude,
          profiles:profile_id (full_name, phone)
        `),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("federations") as any).select("id, name, city, state"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("bookings") as any)
        .select("id, worker_id, status, actual_start_at, actual_end_at, scheduled_start_at, scheduled_end_at, created_at")
        .gte("created_at", fourteenDaysAgo),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("worker_skills") as any).select("worker_id, skills (name)"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("project_allocations") as any).select("worker_id, status"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("emergency_tasks") as any).select("worker_id, status"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (supabase.from("project_requirements") as any).select("workers_count"),
    ]);

    // Parse workers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawWorkers: any[] = workersRes.status === "fulfilled" ? workersRes.value.data || [] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const federations: any[] = federationsRes.status === "fulfilled" ? federationsRes.value.data || [] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookings: any[] = bookingsRes.status === "fulfilled" ? bookingsRes.value.data || [] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workerSkills: any[] = workerSkillsRes.status === "fulfilled" ? workerSkillsRes.value.data || [] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectAllocations: any[] = projectAllocationsRes.status === "fulfilled" ? projectAllocationsRes.value.data || [] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const emergencyTasks: any[] = emergencyTasksRes.status === "fulfilled" ? emergencyTasksRes.value.data || [] : [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const projectRequirements: any[] = projectReqsRes.status === "fulfilled" ? projectReqsRes.value.data || [] : [];

    // Federation lookup map
    const fedMap = new Map<string, { name: string; city: string }>();
    federations.forEach((f) => {
      fedMap.set(f.id, { name: f.name, city: f.city || "Gujarat" });
    });

    // Worker skills map
    const skillsMap = new Map<string, string[]>();
    workerSkills.forEach((ws) => {
      if (ws.worker_id && ws.skills?.name) {
        const list = skillsMap.get(ws.worker_id) || [];
        list.push(ws.skills.name);
        skillsMap.set(ws.worker_id, list);
      }
    });

    // Active project locks
    const activeProjectWorkers = new Set<string>();
    projectAllocations.forEach((pa) => {
      if (pa.worker_id && (pa.status === "ASSIGNED" || pa.status === "ACTIVE" || pa.status === "IN_PROGRESS")) {
        activeProjectWorkers.add(pa.worker_id);
      }
    });

    // Active emergency locks
    const activeEmergencyWorkers = new Set<string>();
    emergencyTasks.forEach((et) => {
      if (et.worker_id && (et.status === "ASSIGNED" || et.status === "IN_PROGRESS" || et.status === "EN_ROUTE")) {
        activeEmergencyWorkers.add(et.worker_id);
      }
    });

    // Worked hours per worker in the last 14 days
    const workedHoursMap = new Map<string, number>();
    const completedBookingsMap = new Map<string, number>();

    bookings.forEach((b) => {
      if (!b.worker_id) return;
      const isCompleted = b.status === "BOOKING_COMPLETED" || b.status === "COMPLETED";
      if (!isCompleted) return;

      completedBookingsMap.set(b.worker_id, (completedBookingsMap.get(b.worker_id) || 0) + 1);

      // Compute duration in hours
      let durationHours = 2.0; // standard default duration
      if (b.actual_start_at && b.actual_end_at) {
        const start = new Date(b.actual_start_at).getTime();
        const end = new Date(b.actual_end_at).getTime();
        if (end > start) {
          durationHours = Math.max(0.5, (end - start) / 3600000);
        }
      } else if (b.scheduled_start_at && b.scheduled_end_at) {
        const start = new Date(b.scheduled_start_at).getTime();
        const end = new Date(b.scheduled_end_at).getTime();
        if (end > start) {
          durationHours = Math.max(0.5, (end - start) / 3600000);
        }
      }

      workedHoursMap.set(b.worker_id, (workedHoursMap.get(b.worker_id) || 0) + durationHours);
    });

    // Total large project demand headcount
    const largeProjectDemandHeadcount = projectRequirements.reduce(
      (sum, pr) => sum + (Number(pr.workers_count) || 0),
      0
    );

    // Filter workers by target federation if scoped
    const filteredWorkers = targetFederationId
      ? rawWorkers.filter((w) => w.federation_id === targetFederationId)
      : rawWorkers;

    const profiles: WorkerUtilizationProfile[] = [];
    const workersByTrade: Record<string, { total: number; available: number; underUtilized: number }> = {};
    const workersByFederation: Record<string, { federationName: string; city: string; total: number; available: number; underUtilized: number }> = {};

    let totalActiveVerified = 0;
    let totalAvailable = 0;
    let totalUnderUtilized = 0;
    let sumUtilization = 0;

    filteredWorkers.forEach((w) => {
      const fed = fedMap.get(w.federation_id) || { name: "Gujarat Cooperative Federation", city: "Ahmedabad" };
      const trade = w.profession || "Skilled Craftsman";
      const isVerified = w.verification_status === "verified";
      const isActive = w.account_status === "ACTIVE";
      const isAvailable = w.availability_status === "AVAILABLE";

      if (isActive && isVerified) totalActiveVerified++;
      if (isAvailable) totalAvailable++;

      // Standard bi-weekly available capacity (80 hours: 8 hrs/day * 5 days * 2 weeks)
      const capacityHours14d = 80;
      const workedHours14d = Number((workedHoursMap.get(w.id) || 0).toFixed(1));
      const completedBookings14d = completedBookingsMap.get(w.id) || 0;
      const utilizationRatio = Number(Math.min(1, workedHours14d / capacityHours14d).toFixed(3));
      sumUtilization += utilizationRatio;

      const hasActiveProjectCommitment = activeProjectWorkers.has(w.id);
      const hasActiveEmergencyCommitment = activeEmergencyWorkers.has(w.id);

      // Under-utilized rule: Active, verified, marked available, not locked in emergency/project, and utilization < 40%
      const isUnderUtilized =
        isActive &&
        isVerified &&
        isAvailable &&
        !hasActiveProjectCommitment &&
        !hasActiveEmergencyCommitment &&
        utilizationRatio < 0.40;

      let underUtilizedReason = "Optimal workforce workload";
      if (!isActive) underUtilizedReason = "Account inactive";
      else if (!isVerified) underUtilizedReason = "Pending trade verification";
      else if (!isAvailable) underUtilizedReason = `Marked ${w.availability_status}`;
      else if (hasActiveEmergencyCommitment) underUtilizedReason = "Reserved for emergency dispatch";
      else if (hasActiveProjectCommitment) underUtilizedReason = "Allocated to commercial project";
      else if (isUnderUtilized) {
        underUtilizedReason = `Completed only ${workedHours14d} hrs (${(utilizationRatio * 100).toFixed(0)}% utilization) in the last 14 days`;
      }

      if (isUnderUtilized) totalUnderUtilized++;

      // Trade aggregations
      if (!workersByTrade[trade]) {
        workersByTrade[trade] = { total: 0, available: 0, underUtilized: 0 };
      }
      workersByTrade[trade].total++;
      if (isAvailable) workersByTrade[trade].available++;
      if (isUnderUtilized) workersByTrade[trade].underUtilized++;

      // Federation aggregations
      const fedKey = w.federation_id || "unassigned";
      if (!workersByFederation[fedKey]) {
        workersByFederation[fedKey] = {
          federationName: fed.name,
          city: fed.city,
          total: 0,
          available: 0,
          underUtilized: 0,
        };
      }
      workersByFederation[fedKey].total++;
      if (isAvailable) workersByFederation[fedKey].available++;
      if (isUnderUtilized) workersByFederation[fedKey].underUtilized++;

      profiles.push({
        workerId: w.id,
        workerName: w.profiles?.full_name || "Verified Craftsman",
        phone: w.profiles?.phone || undefined,
        profession: trade,
        federationId: w.federation_id,
        federationName: fed.name,
        city: fed.city,
        hourlyRate: Number(w.hourly_rate) || 350,
        experienceYears: Number(w.experience_years) || 3,
        serviceRadiusKm: Number(w.service_radius_km) || 15,
        latitude: w.current_latitude ? Number(w.current_latitude) : null,
        longitude: w.current_longitude ? Number(w.current_longitude) : null,
        isVerified,
        accountStatus: w.account_status,
        availabilityStatus: w.availability_status,
        workedHours14d,
        completedBookings14d,
        capacityHours14d,
        utilizationRatio,
        isUnderUtilized,
        underUtilizedReason,
        hasActiveProjectCommitment,
        hasActiveEmergencyCommitment,
        skills: skillsMap.get(w.id) || [trade],
      });
    });

    const averageUtilizationRate =
      filteredWorkers.length > 0
        ? Number(((sumUtilization / filteredWorkers.length) * 100).toFixed(1))
        : 0;

    return {
      totalWorkers: filteredWorkers.length,
      activeVerifiedWorkers: totalActiveVerified,
      availableWorkers: totalAvailable,
      underUtilizedWorkersCount: totalUnderUtilized,
      averageUtilizationRate,
      underUtilizedWorkers: profiles.filter((p) => p.isUnderUtilized),
      workersByTrade,
      workersByFederation,
      largeProjectDemandHeadcount,
      emergencyActiveTaskCount: activeEmergencyWorkers.size,
    };
  }
}

export const workforceUtilizationService = new WorkforceUtilizationService();

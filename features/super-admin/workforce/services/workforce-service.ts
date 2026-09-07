import { createClient } from "@/lib/supabase/client";
import {
  MOCK_WORKERS,
  MOCK_WORKER_SKILLS,
  MOCK_WORKER_CERTS,
  MOCK_WORKER_PERFORMANCE,
  MOCK_WORKER_WELFARE,
  getUnderutilizedWorkersData,
} from "../data/mock-workforce";
import type {
  WorkforceStats,
  WorkerListItem,
  WorkerDetails,
  WorkerSkillItem,
  WorkerCertificationItem,
  WorkerBookingItem,
  WorkerPerformanceMetrics,
  WorkerWelfareStatus,
  UnderutilizedWorkerItem,
  UnderutilizedTimeframe,
  WorkforceFilterOptions,
} from "../types";

export class WorkforceService {
  /**
   * Fetch aggregate workforce statistics
   */
  async getWorkforceStats(): Promise<WorkforceStats> {
    const supabase = createClient();

    try {
      const { data: workersData, error } = await (supabase.from("workers") as any).select(
        "account_status, availability_status, verification_status"
      );

      if (!error && workersData && workersData.length > 0) {
        const typedWorkers = workersData as Array<{
          account_status: string;
          availability_status: string;
          verification_status: string;
        }>;

        const totalWorkers = typedWorkers.length;
        const availableWorkers = typedWorkers.filter((w) => w.availability_status === "AVAILABLE").length;
        const busyWorkers = typedWorkers.filter((w) => w.availability_status === "BUSY").length;
        const inactiveWorkers = typedWorkers.filter(
          (w) => w.account_status === "DEACTIVATED" || w.availability_status === "UNAVAILABLE"
        ).length;
        const verifiedWorkers = typedWorkers.filter((w) => w.verification_status === "verified").length;
        const pendingVerificationWorkers = typedWorkers.filter(
          (w) => w.verification_status === "pending_verification"
        ).length;

        return {
          totalWorkers,
          availableWorkers,
          busyWorkers,
          inactiveWorkers,
          verifiedWorkers,
          pendingVerificationWorkers,
          underutilizedWorkers: 4,
        };
      }
    } catch {
      // Fallback to mock calculation
    }

    // Fallback metrics calculated from MOCK_WORKERS
    return {
      totalWorkers: MOCK_WORKERS.length,
      availableWorkers: MOCK_WORKERS.filter((w) => w.availabilityStatus === "AVAILABLE").length,
      busyWorkers: MOCK_WORKERS.filter((w) => w.availabilityStatus === "BUSY").length,
      inactiveWorkers: MOCK_WORKERS.filter(
        (w) => w.accountStatus === "DEACTIVATED" || w.availabilityStatus === "UNAVAILABLE"
      ).length,
      verifiedWorkers: MOCK_WORKERS.filter((w) => w.verificationStatus === "verified").length,
      pendingVerificationWorkers: MOCK_WORKERS.filter(
        (w) => w.verificationStatus === "pending_verification"
      ).length,
      underutilizedWorkers: 4,
    };
  }

  /**
   * Fetch workers list with filter, search, sorting, and pagination
   */
  async getWorkers(options: Partial<WorkforceFilterOptions> = {}): Promise<{
    data: WorkerListItem[];
    totalCount: number;
    societies: Array<{ id: string; name: string }>;
    skills: string[];
  }> {
    const supabase = createClient();

    try {
      const { data: dbWorkers, error } = await (supabase.from("workers") as any).select(`
        id,
        profile_id,
        federation_id,
        account_status,
        availability_status,
        verification_status,
        profession,
        hourly_rate,
        experience_years,
        joining_date,
        last_active_at,
        profiles (full_name, email, phone, avatar_url),
        federations (id, name)
      `);

      if (!error && dbWorkers && dbWorkers.length > 0) {
        const items: WorkerListItem[] = dbWorkers.map((w: any) => {
          const matchedMock = MOCK_WORKERS.find((m) => m.id === w.id);
          return {
            id: w.id,
            profileId: w.profile_id,
            fullName: w.profiles?.full_name || "Cooperative Worker",
            email: w.profiles?.email,
            phone: w.profiles?.phone,
            avatarUrl: w.profiles?.avatar_url,
            societyId: w.federation_id || w.federations?.id || "fed-001",
            societyName: w.federations?.name || "Mumbai Central Worker Cooperative",
            profession: w.profession || "Skilled Craftsman",
            experienceYears: w.experience_years || 3,
            hourlyRate: w.hourly_rate || 350,
            availabilityStatus: w.availability_status || "AVAILABLE",
            verificationStatus: w.verification_status || "verified",
            accountStatus: w.account_status || "ACTIVE",
            averageRating: matchedMock?.averageRating || 4.8,
            totalJobs: matchedMock?.totalJobs || 42,
            completedJobs: matchedMock?.completedJobs || 40,
            joiningDate: w.joining_date ? new Date(w.joining_date).toISOString().split("T")[0] : "2024-01-01",
            lastActiveAt: w.last_active_at || "Recently",
          };
        });

        return this.applyFilters(items, options);
      }
    } catch {
      // Fallback to local mock data
    }

    return this.applyFilters(MOCK_WORKERS, options);
  }

  private applyFilters(
    items: WorkerListItem[],
    options: Partial<WorkforceFilterOptions>
  ): {
    data: WorkerListItem[];
    totalCount: number;
    societies: Array<{ id: string; name: string }>;
    skills: string[];
  } {
    let filtered = [...items];

    // Unique list of societies & skills for filter dropdowns
    const societiesMap = new Map<string, string>();
    items.forEach((i) => societiesMap.set(i.societyId, i.societyName));
    const societies = Array.from(societiesMap.entries()).map(([id, name]) => ({ id, name }));

    const skills = Array.from(new Set(items.map((i) => i.profession))).sort();

    // 1. Search Query
    if (options.searchQuery) {
      const q = options.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (i) =>
          i.fullName.toLowerCase().includes(q) ||
          i.profession.toLowerCase().includes(q) ||
          i.societyName.toLowerCase().includes(q) ||
          (i.phone && i.phone.includes(q)) ||
          (i.email && i.email.toLowerCase().includes(q))
      );
    }

    // 2. Filter by Society
    if (options.societyId && options.societyId !== "ALL") {
      filtered = filtered.filter((i) => i.societyId === options.societyId);
    }

    // 3. Filter by Skill
    if (options.skill && options.skill !== "ALL") {
      filtered = filtered.filter((i) => i.profession === options.skill);
    }

    // 4. Filter by Availability
    if (options.availability && options.availability !== "ALL") {
      filtered = filtered.filter((i) => i.availabilityStatus === options.availability);
    }

    // 5. Filter by Verification
    if (options.verification && options.verification !== "ALL") {
      filtered = filtered.filter((i) => i.verificationStatus === options.verification);
    }

    // 6. Sorting
    const sortBy = options.sortBy || "fullName";
    const sortOrder = options.sortOrder || "asc";

    filtered.sort((a, b) => {
      let valA: any = a[sortBy as keyof WorkerListItem];
      let valB: any = b[sortBy as keyof WorkerListItem];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    const totalCount = filtered.length;

    // 7. Pagination
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return {
      data: paginated,
      totalCount,
      societies,
      skills,
    };
  }

  /**
   * Fetch Underutilized Workers
   */
  async getUnderutilizedWorkers(timeframe: UnderutilizedTimeframe = "30d"): Promise<UnderutilizedWorkerItem[]> {
    // Deterministic calculation
    return getUnderutilizedWorkersData(timeframe);
  }

  /**
   * Fetch single worker by ID
   */
  async getWorkerById(id: string): Promise<WorkerDetails | null> {
    const supabase = createClient();

    try {
      const { data: w, error } = await (supabase.from("workers") as any)
        .select(`
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
          joining_date,
          last_active_at,
          profiles (full_name, email, phone, avatar_url),
          federations (id, name)
        `)
        .eq("id", id)
        .single();

      if (!error && w) {
        const matchedMock = MOCK_WORKERS.find((m) => m.id === id);
        return {
          id: w.id,
          profileId: w.profile_id,
          fullName: w.profiles?.full_name || "Cooperative Worker",
          email: w.profiles?.email,
          phone: w.profiles?.phone,
          avatarUrl: w.profiles?.avatar_url,
          societyId: w.federation_id || w.federations?.id || "fed-001",
          societyName: w.federations?.name || "Mumbai Central Worker Cooperative",
          profession: w.profession || "Skilled Craftsman",
          experienceYears: w.experience_years || 3,
          hourlyRate: w.hourly_rate || 350,
          availabilityStatus: w.availability_status || "AVAILABLE",
          verificationStatus: w.verification_status || "verified",
          accountStatus: w.account_status || "ACTIVE",
          averageRating: matchedMock?.averageRating || 4.8,
          totalJobs: matchedMock?.totalJobs || 42,
          completedJobs: matchedMock?.completedJobs || 40,
          joiningDate: w.joining_date ? new Date(w.joining_date).toISOString().split("T")[0] : "2024-01-01",
          lastActiveAt: w.last_active_at || "Recently",
          address: matchedMock?.address || "Mumbai Metropolitan Region",
          serviceRadiusKm: w.service_radius_km || 15,
        };
      }
    } catch {
      // Fallback
    }

    const foundMock = MOCK_WORKERS.find((w) => w.id === id);
    return foundMock || null;
  }

  /**
   * Fetch worker skills
   */
  async getWorkerSkills(workerId: string): Promise<WorkerSkillItem[]> {
    return (
      MOCK_WORKER_SKILLS[workerId] || [
        { id: "skl-def-1", name: "General Electrical Wiring", category: "Electrical", proficiencyLevel: "Advanced" },
        { id: "skl-def-2", name: "Safety & Compliance Audit", category: "Safety", proficiencyLevel: "Master" },
      ]
    );
  }

  /**
   * Fetch worker certifications
   */
  async getWorkerCertifications(workerId: string): Promise<WorkerCertificationItem[]> {
    return (
      MOCK_WORKER_CERTS[workerId] || [
        {
          id: "crt-def-1",
          title: "Certified Craftsman Vocational Certificate",
          issuingBody: "National Skill Development Corporation (NSDC)",
          certificateNumber: "NSDC-VET-2024-881",
          issueDate: "2023-08-15",
          expiryDate: "2026-08-14",
          status: "VERIFIED",
          isVerified: true,
        },
      ]
    );
  }

  /**
   * Fetch worker bookings history
   */
  async getWorkerBookings(workerId: string): Promise<WorkerBookingItem[]> {
    const supabase = createClient();

    try {
      const { data, error } = await (supabase.from("bookings") as any)
        .select(`
          id,
          booking_number,
          scheduled_start_at,
          total_amount,
          worker_earnings,
          status,
          created_at,
          profiles!customer_id (full_name)
        `)
        .eq("worker_id", workerId)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((b: any) => ({
          id: b.id,
          bookingNumber: b.booking_number,
          customerName: b.profiles?.full_name || "Household Customer",
          serviceTitle: "Cooperative Service Job",
          scheduledStartAt: new Date(b.scheduled_start_at).toLocaleDateString(),
          totalAmount: b.total_amount,
          workerEarnings: b.worker_earnings || b.total_amount * 0.85,
          status: b.status,
          createdAt: new Date(b.created_at).toLocaleDateString(),
        }));
      }
    } catch {
      // Fallback
    }

    return [
      {
        id: "bk-701",
        bookingNumber: "BKG-2026-701",
        customerName: "Kavya Vaghela",
        serviceTitle: "Electrical Panel Repair & Inspection",
        scheduledStartAt: "2026-09-01 10:00 AM",
        totalAmount: 850,
        workerEarnings: 722,
        status: "SERVICE_COMPLETED",
        createdAt: "2026-08-31",
      },
      {
        id: "bk-702",
        bookingNumber: "BKG-2026-702",
        customerName: "Anil Kapoor",
        serviceTitle: "Emergency Circuit Breaker Sealing",
        scheduledStartAt: "2026-08-28 02:30 PM",
        totalAmount: 600,
        workerEarnings: 510,
        status: "SERVICE_COMPLETED",
        createdAt: "2026-08-27",
      },
    ];
  }

  /**
   * Fetch worker performance metrics
   */
  async getWorkerPerformance(workerId: string): Promise<WorkerPerformanceMetrics> {
    return (
      MOCK_WORKER_PERFORMANCE[workerId] || {
        completionRate: 95.0,
        cancellationRate: 2.0,
        onTimeArrivalRate: 96.5,
        customerRating: 4.8,
        totalJobsFulfild: 40,
        recentReviews: [
          { customerName: "Pooja Hegde", rating: 5, comment: "Punctual, polite, and clean service execution.", date: "2026-08-20" },
        ],
      }
    );
  }

  /**
   * Fetch worker welfare status
   */
  async getWorkerWelfare(workerId: string): Promise<WorkerWelfareStatus> {
    return (
      MOCK_WORKER_WELFARE[workerId] || {
        totalContributions: 6400,
        matchedSubsidies: 5000,
        fundType: "Cooperative Member General Escrow",
        insurancePolicyNumber: "NIC-HLT-2026-102",
        insuranceProvider: "National Insurance Co.",
        coverageStatus: "ACTIVE",
        lastTransactionDate: "2026-08-15",
      }
    );
  }
}

export const workforceService = new WorkforceService();

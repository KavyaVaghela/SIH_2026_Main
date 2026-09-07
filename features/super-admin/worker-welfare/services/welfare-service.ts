import { createClient } from "@/lib/supabase/client";
import { MOCK_WELFARE_RECORDS, MOCK_WELFARE_ALERTS } from "../data/mock-welfare";
import { WelfareAnalysisEngine } from "./welfare-analysis";
import type {
  WorkerWelfareRecord,
  WelfareSummaryStats,
  WelfareAlert,
  WelfareFilterOptions,
} from "../types";

export class WelfareService {
  async getWelfareData(filters: Partial<WelfareFilterOptions> = {}): Promise<{
    stats: WelfareSummaryStats;
    records: WorkerWelfareRecord[];
    alerts: WelfareAlert[];
    totalCount: number;
    societies: Array<{ id: string; name: string }>;
  }> {
    const supabase = createClient();
    let allRecords: WorkerWelfareRecord[] = [...MOCK_WELFARE_RECORDS];
    let alerts: WelfareAlert[] = [...MOCK_WELFARE_ALERTS];

    try {
      // 1. Fetch real workers with profiles and federations
      const { data: workersData } = await (supabase.from("workers") as any)
        .select(`
          id,
          profession,
          federation_id,
          profiles (full_name, phone),
          federations (id, name)
        `);

      // 2. Fetch insurance records
      const { data: insuranceData } = await (supabase.from("insurance_records") as any)
        .select("*");

      // 3. Fetch welfare records
      const { data: welfareRecordsData } = await (supabase.from("welfare_records") as any)
        .select("*");

      if (workersData && workersData.length > 0) {
        const mappedRecords: WorkerWelfareRecord[] = workersData.map((w: any) => {
          const insurance = insuranceData?.find((ins: any) => ins.worker_id === w.id);
          const welfareRec = welfareRecordsData?.find((wlf: any) => wlf.worker_id === w.id);

          const { status, daysRemaining } = WelfareAnalysisEngine.evaluateCoverageStatus(
            insurance?.end_date,
            Boolean(insurance || welfareRec)
          );

          return {
            id: welfareRec?.id || insurance?.id || `wlf-${w.id}`,
            workerId: w.id,
            workerName: w.profiles?.full_name || "Cooperative Craftsman",
            workerProfession: w.profession || "General Tradesman",
            workerPhone: w.profiles?.phone || "Phone N/A",
            societyId: w.federations?.id || "fed-001",
            societyName: w.federations?.name || "Regional Artisan Federation",
            coverageStatus: status,
            coverageType: insurance
              ? "Comprehensive Health & Accidental"
              : welfareRec
              ? "Cooperative Social Security Escrow"
              : "Unenrolled",
            policyNumber: insurance?.policy_number || null,
            providerName: insurance?.provider_name || null,
            coverageAmount: insurance?.coverage_amount ? Number(insurance.coverage_amount) : null,
            startDate: insurance?.start_date || null,
            expiryDate: insurance?.end_date || null,
            daysUntilExpiry: daysRemaining,
            fundContributions: welfareRec?.contribution_amount
              ? Number(welfareRec.contribution_amount)
              : 0,
            subsidyAmount: welfareRec?.subsidy_amount ? Number(welfareRec.subsidy_amount) : 0,
            notes: welfareRec?.notes || null,
          };
        });

        if (mappedRecords.length > 3) {
          allRecords = mappedRecords;
        }
      }
    } catch {
      // Fallback to deterministic datasets
    }

    // Compute overall statistics before applying table filters
    const totalWorkers = allRecords.length;
    const coveredWorkers = allRecords.filter(
      (r) => r.coverageStatus === "ACTIVE" || r.coverageStatus === "EXPIRING_SOON"
    ).length;
    const uncoveredWorkers = allRecords.filter(
      (r) => r.coverageStatus === "NO_COVERAGE" || r.coverageStatus === "EXPIRED"
    ).length;
    const expiringSoonCount = allRecords.filter(
      (r) => r.coverageStatus === "EXPIRING_SOON"
    ).length;
    const coveragePercentage = totalWorkers > 0 ? Math.round((coveredWorkers / totalWorkers) * 100) : 0;

    const stats: WelfareSummaryStats = {
      totalWorkers,
      coveredWorkers,
      uncoveredWorkers,
      expiringSoonCount,
      coveragePercentage,
    };

    // Filter Logic
    let filtered = [...allRecords];

    // Status Filter
    if (filters.status && filters.status !== "ALL") {
      filtered = filtered.filter((r) => r.coverageStatus === filters.status);
    }

    // Society Filter
    if (filters.society && filters.society !== "ALL") {
      filtered = filtered.filter((r) => r.societyId === filters.society);
    }

    // Search Query Filter (worker name, profession, or policy number)
    if (filters.searchQuery && filters.searchQuery.trim() !== "") {
      const q = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.workerName.toLowerCase().includes(q) ||
          r.workerProfession.toLowerCase().includes(q) ||
          (r.policyNumber && r.policyNumber.toLowerCase().includes(q)) ||
          r.societyName.toLowerCase().includes(q)
      );
    }

    // Extract unique societies for dropdown
    const societiesMap = new Map<string, string>();
    allRecords.forEach((r) => {
      societiesMap.set(r.societyId, r.societyName);
    });
    const societies = Array.from(societiesMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));

    // Pagination
    const totalCount = filtered.length;
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const paginatedRecords = filtered.slice(startIndex, startIndex + pageSize);

    return {
      stats,
      records: paginatedRecords,
      alerts,
      totalCount,
      societies,
    };
  }
}

export const welfareService = new WelfareService();

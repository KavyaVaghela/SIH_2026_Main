import type { WelfareRecord, InsuranceRecord } from "@/types";

export interface IWelfareService {
  recordContribution(workerId: string, federationId: string, amount: number, fundType?: string): Promise<WelfareRecord>;
  getWorkerWelfareSummary(workerId: string): Promise<WelfareRecord[]>;
  getInsuranceRecords(workerId: string): Promise<InsuranceRecord[]>;
}

export class WelfareService implements IWelfareService {
  async recordContribution(workerId: string, federationId: string, amount: number, fundType = "health_and_pension"): Promise<WelfareRecord> {
    return {
      id: `welf-${Date.now()}`,
      workerId,
      federationId,
      fundType,
      contributionAmount: amount,
      subsidyAmount: amount * 0.2, // 20% cooperative matching subsidy
      transactionDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };
  }

  async getWorkerWelfareSummary(workerId: string): Promise<WelfareRecord[]> {
    return [
      {
        id: "welf-1",
        workerId,
        federationId: "fed-1",
        fundType: "health_and_pension",
        contributionAmount: 500,
        subsidyAmount: 100,
        transactionDate: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async getInsuranceRecords(workerId: string): Promise<InsuranceRecord[]> {
    return [
      {
        id: "ins-1",
        workerId,
        policyNumber: "POL-COOP-88214",
        providerName: "Star Health & Allied Cooperative Scheme",
        coverageAmount: 500000,
        startDate: "2026-01-01",
        endDate: "2026-12-31",
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }
}

export const welfareService = new WelfareService();

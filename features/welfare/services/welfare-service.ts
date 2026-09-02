export interface WelfareRecord {
  id: string;
  workerId: string;
  federationId: string;
  fundType: string;
  contributionAmount: number;
  subsidyAmount: number;
  transactionDate: string;
  notes?: string | null;
  createdAt: string;
}

export interface InsuranceRecord {
  id: string;
  workerId: string;
  policyNumber: string;
  providerName: string;
  coverageAmount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IWelfareService {
  getWorkerWelfareRecords(workerId: string): Promise<WelfareRecord[]>;
  getWorkerInsurance(workerId: string): Promise<InsuranceRecord | null>;
  checkEmergencyAssistanceEligibility(workerId: string): Promise<{ eligible: boolean; reason: string }>;
}

export class WelfareService implements IWelfareService {
  async getWorkerWelfareRecords(workerId: string): Promise<WelfareRecord[]> {
    return [
      {
        id: "welf-1",
        workerId,
        federationId: "fed-1",
        fundType: "health_and_pension",
        contributionAmount: 250,
        subsidyAmount: 250,
        transactionDate: new Date().toISOString().split("T")[0],
        notes: "Monthly cooperative contribution match",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  async getWorkerInsurance(workerId: string): Promise<InsuranceRecord | null> {
    return {
      id: "ins-1",
      workerId,
      policyNumber: "POL-MH-2026-9081",
      providerName: "Cooperative Gig Worker Health Mutual",
      coverageAmount: 500000,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async checkEmergencyAssistanceEligibility(workerId: string): Promise<{ eligible: boolean; reason: string }> {
    const insurance = await this.getWorkerInsurance(workerId);
    if (insurance && insurance.isActive) {
      return { eligible: true, reason: "Active cooperative insurance & welfare membership verified." };
    }
    return { eligible: false, reason: "Inactive insurance coverage." };
  }
}

export const welfareService = new WelfareService();

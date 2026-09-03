export interface DemandAnalysisResult {
  serviceId: string;
  serviceTitle: string;
  totalRequests: number;
  availableWorkersCount: number;
  gapStatus: "SURPLUS" | "BALANCED" | "SHORTAGE";
  recommendedWorkforceCount: number;
}

export interface IDemandService {
  getDemandByService(serviceId: string): Promise<DemandAnalysisResult>;
  getTopDemandedServices(): Promise<DemandAnalysisResult[]>;
}

export class DemandService implements IDemandService {
  async getDemandByService(serviceId: string): Promise<DemandAnalysisResult> {
    return {
      serviceId,
      serviceTitle: "Full Room Electrical Repair & Wiring",
      totalRequests: 140,
      availableWorkersCount: 95,
      gapStatus: "SHORTAGE",
      recommendedWorkforceCount: 45,
    };
  }

  async getTopDemandedServices(): Promise<DemandAnalysisResult[]> {
    return [
      {
        serviceId: "srv-1",
        serviceTitle: "Full Room Electrical Repair & Wiring",
        totalRequests: 140,
        availableWorkersCount: 95,
        gapStatus: "SHORTAGE",
        recommendedWorkforceCount: 45,
      },
      {
        serviceId: "srv-2",
        serviceTitle: "Pipeline Leakage & Tap Replacement",
        totalRequests: 110,
        availableWorkersCount: 120,
        gapStatus: "BALANCED",
        recommendedWorkforceCount: 0,
      },
    ];
  }
}

export const demandService = new DemandService();

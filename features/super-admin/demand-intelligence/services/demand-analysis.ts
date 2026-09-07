import type { DemandOverviewStats } from "../types";

export class DemandAnalysisEngine {
  /**
   * Computes holistic demand vs workforce balance metrics
   */
  static calculateBalance(
    serviceRequests: number,
    availableWorkers: number,
    activeWorkers: number,
    topServiceCategory: string = "Electrical & Home Appliances"
  ): DemandOverviewStats {
    const netBalance = availableWorkers - serviceRequests;

    let balanceStatus: "SHORTAGE" | "BALANCED" | "SURPLUS" = "BALANCED";
    if (netBalance < -5) {
      balanceStatus = "SHORTAGE";
    } else if (netBalance > 5) {
      balanceStatus = "SURPLUS";
    }

    // Capacity rate: available workers / service requests (capped at 100%)
    const rawRatio = serviceRequests > 0 ? (availableWorkers / serviceRequests) * 100 : 100;
    const fulfillmentCapacityRate = Math.min(100, Math.max(0, Math.round(rawRatio)));

    return {
      serviceRequests,
      availableWorkers,
      activeWorkers,
      shortageOrSurplus: netBalance,
      balanceStatus,
      topServiceCategory,
      fulfillmentCapacityRate,
    };
  }
}

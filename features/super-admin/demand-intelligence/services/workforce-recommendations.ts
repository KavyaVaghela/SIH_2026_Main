import type {
  ShortageAlert,
  WorkforceAllocationRecommendation,
} from "../types";
import { MOCK_RECOMMENDATIONS } from "../data/mock-demand";

export interface IWorkforceRecommendationEngine {
  getRecommendations(): Promise<WorkforceAllocationRecommendation[]>;
  getRecommendationForAlert(alertId: string): Promise<WorkforceAllocationRecommendation | null>;
}

/**
 * Deterministic Workforce Allocation Recommendation Engine.
 * Formatted with extensible interfaces so future AI/forecasting microservices
 * or optimization algorithms can drop in without UI changes.
 */
export class WorkforceRecommendationEngine implements IWorkforceRecommendationEngine {
  async getRecommendations(): Promise<WorkforceAllocationRecommendation[]> {
    return MOCK_RECOMMENDATIONS;
  }

  async getRecommendationForAlert(alertId: string): Promise<WorkforceAllocationRecommendation | null> {
    const found = MOCK_RECOMMENDATIONS.find((r) => r.alertId === alertId);
    if (found) return found;

    // Fallback template recommendation generated deterministically
    return {
      id: `rec-gen-${alertId}`,
      alertId,
      title: "Inter-Federation Workforce Mobilization",
      targetLocation: "Regional Cluster",
      service: "Primary Skilled Craft",
      shortageCount: 15,
      sourceSociety: "Neighboring Artisan Cooperative",
      sourceLocation: "Adjacent Municipal Sector",
      suggestedHeadcount: 5,
      rationale:
        "Surplus idle capacity detected within 12km transit radius. Activating cross-society dispatch protocol will reduce local customer queue backlog by ~55%.",
      estimatedSlaImprovement: "55% faster response time",
      candidateWorkers: [
        {
          id: "wrk-101",
          name: "Aarav Mehta",
          profession: "Certified Technician",
          currentSociety: "Mumbai Central Worker Cooperative",
          currentLocation: "Central Hub",
          distanceKm: 6.2,
          experienceYears: 7,
          rating: 4.9,
        },
      ],
    };
  }
}

export const workforceRecommendationEngine = new WorkforceRecommendationEngine();

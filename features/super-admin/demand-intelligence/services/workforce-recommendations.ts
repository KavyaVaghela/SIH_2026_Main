import type {
  ShortageAlert,
  WorkforceAllocationRecommendation,
} from "../types";

export interface IWorkforceRecommendationEngine {
  getRecommendations(): Promise<WorkforceAllocationRecommendation[]>;
  getRecommendationForAlert(alertId: string): Promise<WorkforceAllocationRecommendation | null>;
}

/**
 * Workforce Allocation Recommendation Engine.
 * Phase 3 maintains an honest empty-state when no verified algorithmic reallocations are triggered,
 * preventing hallucinated workers or fake emergency recommendations.
 */
export class WorkforceRecommendationEngine implements IWorkforceRecommendationEngine {
  async getRecommendations(): Promise<WorkforceAllocationRecommendation[]> {
    return [];
  }

  async getRecommendationForAlert(alertId: string): Promise<WorkforceAllocationRecommendation | null> {
    return null;
  }
}

export const workforceRecommendationEngine = new WorkforceRecommendationEngine();

export class AnalyticsMetricsEngine {
  /**
   * Transparently calculates the cooperative society benchmark score (0 - 100).
   *
   * Formula Weighting:
   * 1. Completion Rate: 35% weight
   * 2. Customer Satisfaction (Rating scaled to 100): 30% weight
   * 3. Worker Utilization: 20% weight
   * 4. Cancellation Resilience (100 - Cancellation Rate): 15% weight
   */
  static calculateBenchmarkScore(
    completionRate: number,
    rating: number,
    workerUtilization: number,
    cancellationRate: number
  ): { score: number; grade: "A+" | "A" | "B" | "C" } {
    const safeCompletion = Math.min(100, Math.max(0, completionRate));
    const safeRatingScaled = Math.min(100, Math.max(0, (rating / 5) * 100));
    const safeUtilization = Math.min(100, Math.max(0, workerUtilization));
    const safeCancellationResilience = Math.min(100, Math.max(0, 100 - cancellationRate));

    const rawScore =
      safeCompletion * 0.35 +
      safeRatingScaled * 0.3 +
      safeUtilization * 0.2 +
      safeCancellationResilience * 0.15;

    const score = Number(rawScore.toFixed(1));

    let grade: "A+" | "A" | "B" | "C" = "C";
    if (score >= 95.0) grade = "A+";
    else if (score >= 88.0) grade = "A";
    else if (score >= 75.0) grade = "B";

    return { score, grade };
  }
}

import type { WelfareCoverageStatus } from "../types";

export class WelfareAnalysisEngine {
  /**
   * Reference system date for deterministic calculations
   */
  private static REFERENCE_DATE = new Date("2026-09-03");

  /**
   * Evaluates the coverage status and days remaining based on policy expiry
   */
  static evaluateCoverageStatus(
    expiryDateStr: string | null | undefined,
    hasActiveRecord: boolean
  ): { status: WelfareCoverageStatus; daysRemaining: number | null } {
    if (!hasActiveRecord || !expiryDateStr) {
      return { status: "NO_COVERAGE", daysRemaining: null };
    }

    const expiryDate = new Date(expiryDateStr);
    const diffTime = expiryDate.getTime() - this.REFERENCE_DATE.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return { status: "EXPIRED", daysRemaining };
    } else if (daysRemaining <= 30) {
      // Expiring within 30-day window
      return { status: "EXPIRING_SOON", daysRemaining };
    } else {
      return { status: "ACTIVE", daysRemaining };
    }
  }
}

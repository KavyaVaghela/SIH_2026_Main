export type WelfareCoverageStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "NO_COVERAGE";

export interface WelfareSummaryStats {
  totalWorkers: number;
  coveredWorkers: number;
  uncoveredWorkers: number;
  expiringSoonCount: number;
  coveragePercentage: number;
}

export interface WorkerWelfareRecord {
  id: string;
  workerId: string;
  workerName: string;
  workerProfession: string;
  workerPhone: string;
  societyId: string;
  societyName: string;
  coverageStatus: WelfareCoverageStatus;
  coverageType: string;
  policyNumber: string | null;
  providerName: string | null;
  coverageAmount: number | null;
  startDate: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  fundContributions: number;
  subsidyAmount: number;
  notes: string | null;
  alertReason?: string;
}

export interface WelfareAlert {
  id: string;
  recordId: string;
  workerId: string;
  workerName: string;
  societyName: string;
  type: "EXPIRING_SOON" | "NO_COVERAGE" | "UPDATE_REQUIRED";
  title: string;
  description: string;
  expiryDate?: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface WelfareFilterOptions {
  status: "ALL" | WelfareCoverageStatus;
  society: string;
  searchQuery: string;
  page: number;
  pageSize: number;
}

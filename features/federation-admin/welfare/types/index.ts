export interface WelfareKpiData {
  workersCovered: number;
  totalWorkers: number;
  workersCoveredPercent: number;
  workersCoveredTrend: string;

  workersNeedingAssistance: number;
  workersNeedingAssistancePercent: number;
  workersNeedingAssistanceTrend: string;

  activeTrainingProgramsCount: number;
  activeTrainingProgramsTrend: string;

  welfareCoveragePercent: number;
  welfareCoverageWorkersCount: number;
  welfareCoverageTrend: string;
}

export type GovernmentSchemeCategory =
  | "Pension"
  | "Insurance"
  | "Social Welfare"
  | "Skill Development"
  | "Health";

export type GovernmentSchemeStatus = "Active" | "In Progress" | "Pending";

export interface GovernmentSchemeItem {
  id: string;
  name: string;
  category: GovernmentSchemeCategory;
  eligibleWorkers: number;
  coveredWorkers: number;
  status: GovernmentSchemeStatus;
  iconName: "pension" | "insurance" | "welfare" | "skill" | "health";
}

export interface TrainingProgramItem {
  id: string;
  title: string;
  enrolledCount: number;
  maxCapacity: number;
}

export interface TrainingCertificationOverview {
  activeProgramsCount: number;
  workersEnrolledCount: number;
  certificationsCompletedCount: number;
  certificationsExpiringCount: number;
  topPrograms: TrainingProgramItem[];
}

export interface WelfareSummaryBreakdown {
  coveredCount: number;
  coveredPercent: number;
  inProgressCount: number;
  inProgressPercent: number;
  notCoveredCount: number;
  notCoveredPercent: number;
  totalWorkers: number;
  overallCoveragePercent: number;
}

export interface SafetyWorkerSupportMetrics {
  safetyTrainingsThisMonth: number;
  emergencySupportRequests: number;
  welfareRequestsThisMonth: number;
  pendingAssistanceCount: number;
}

export type WelfareActivityType =
  | "TRAINING_COMPLETED"
  | "WORKER_ENROLLED"
  | "WELFARE_REQUEST"
  | "CERTIFICATION_ISSUED"
  | "SCHEME_ELIGIBILITY";

export interface WelfareRecentActivityItem {
  id: string;
  type: WelfareActivityType;
  title: string;
  description: string;
  timestamp: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
}

export interface FederationWelfareDashboardData {
  federationId: string;
  federationName: string;
  timeframe: string;
  kpis: WelfareKpiData;
  schemes: GovernmentSchemeItem[];
  trainingOverview: TrainingCertificationOverview;
  welfareSummary: WelfareSummaryBreakdown;
  safetySupport: SafetyWorkerSupportMetrics;
  recentActivities: WelfareRecentActivityItem[];
}

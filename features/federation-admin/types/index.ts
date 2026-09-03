export type DashboardTimeframe = "7d" | "30d" | "90d";

export interface FederationIdentity {
  id: string;
  name: string;
  code: string;
  registrationNumber: string;
  city: string;
  state: string;
  jurisdiction: string;
  contactEmail: string;
  contactPhone: string;
  establishedYear: number;
}

export interface WorkerStats {
  totalWorkers: number;
  activeWorkers: number;
  deactivatedWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  unavailableWorkers: number;
}

export interface JobStats {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  pendingJobs: number;
  cancelledJobs: number;
}

export interface ComplaintStats {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
}

export interface PerformanceMetrics {
  jobCompletionRate: number; // percentage (0 - 100)
  averageWorkerRating: number; // 0.0 - 5.0
  overallFederationPerformance: number; // percentage (0 - 100)
  complaintResolutionRate: number; // percentage (0 - 100)
}

export interface FederationDashboardStats {
  workers: WorkerStats;
  jobs: JobStats;
  complaints: ComplaintStats;
  performance: PerformanceMetrics;
}

// Chart Data Points
export interface JobStatusDistributionPoint {
  status: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

export interface JobsComparativePoint {
  period: string;
  completed: number;
  running: number;
}

export interface ProfessionDistributionPoint {
  profession: string;
  completedJobs: number;
  activeWorkers: number;
  averageRating: number;
}

export interface JobActivityTrendPoint {
  date: string;
  completed: number;
  running: number;
  pending: number;
  cancelled: number;
}

export interface WorkerPerformanceDistributionPoint {
  ratingTier: string;
  workerCount: number;
  percentageShare: number;
  description: string;
}

export interface ServiceDemandPoint {
  categoryName: string;
  demandVolume: number;
  growthRate: number;
  activeWorkerShare: number;
}

export interface FederationAdminDashboardData {
  federation: FederationIdentity;
  stats: FederationDashboardStats;
  charts: {
    jobsByStatus: JobStatusDistributionPoint[];
    completedVsRunning: JobsComparativePoint[];
    jobsByProfession: ProfessionDistributionPoint[];
    activityTrend: JobActivityTrendPoint[];
    workerPerformance: WorkerPerformanceDistributionPoint[];
    demandDistribution: ServiceDemandPoint[];
  };
  lastUpdated: string;
  isDevelopmentFallback: boolean;
  dataSourceNotice?: string;
}

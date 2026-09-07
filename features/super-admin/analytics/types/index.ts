export type AnalyticsTimeframe = "today" | "week" | "month" | "year" | "custom";

export interface AnalyticsFilters {
  range: AnalyticsTimeframe;
  customFrom?: string;
  customTo?: string;
}

export interface AnalyticsSummary {
  totalBookings: number;
  bookingsGrowthRate: number;
  activeWorkers: number;
  availableWorkers: number;
  underutilizedWorkers: number;
  averageCompletionRate: number;
  platformCustomerSatisfaction: number;
}

export interface BookingGrowthPoint {
  periodLabel: string;
  completed: number;
  inProgress: number;
  cancelled: number;
  total: number;
}

export interface ServiceDemandMetric {
  serviceId: string;
  serviceTitle: string;
  category: string;
  requestsCount: number;
  sharePercentage: number;
  trendGrowth: number;
}

export interface SkillDistributionItem {
  skillName: string;
  workerCount: number;
  percentage: number;
}

export interface WorkforceUtilizationMetric {
  availableCount: number;
  activeCount: number;
  underutilizedCount: number;
  totalWorkers: number;
  overallUtilizationRate: number;
  skillDistribution: SkillDistributionItem[];
}

export interface SocietyPerformanceMetric {
  societyId: string;
  societyName: string;
  location: string;
  totalBookings: number;
  completionRate: number; // percentage (0-100)
  workerUtilization: number; // percentage (0-100)
  customerRating: number; // rating (0-5)
  cancellationRate: number; // percentage (0-100)
  complaintsCount: number;
  benchmarkScore: number; // transparent composite score (0-100)
  benchmarkGrade: "A+" | "A" | "B" | "C";
  highlightBadge?: string;
}

export interface PlatformGrowthPoint {
  period: string;
  societies: number;
  workers: number;
  customers: number;
  bookings: number;
}

export interface SuperAdminOverviewStats {
  totalSocieties: number;
  totalWorkers: number;
  activeWorkers: number;
  availableWorkers: number;
  totalCustomers: number;
  totalBookings: number;
  completedServices: number;
  activeJobs: number;
  pendingRequests: number;
  averageRating: number;
}

export interface BookingActivityPoint {
  date: string;
  completed: number;
  active: number;
  pending: number;
  cancelled: number;
}

export interface DemandCategorySummary {
  categoryId: string;
  categoryName: string;
  bookingCount: number;
  growthPercentage: number;
}

export interface DemandDistrictCluster {
  district: string;
  demandScore: number;
  primarySkillNeeded: string;
  activeWorkersCount: number;
}

export interface PeakDemandHour {
  timeSlot: string;
  demandLevel: "MEDIUM" | "HIGH" | "PEAK";
  percentageShare: number;
}

export interface CriticalAlert {
  id: string;
  type: "SLA_BREACH" | "COMPLIANCE_WARNING" | "VERIFICATION_PENDING" | "HIGH_COMPLAINT";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string;
  description: string;
  timestamp: string;
  actionUrl?: string;
}

export interface SmartInsight {
  id: string;
  category: "WORKFORCE" | "DEMAND" | "WELFARE" | "QUALITY";
  title: string;
  insight: string;
  impact: string;
  actionLabel?: string;
  actionUrl?: string;
}

export type OverviewTimeframe = "7d" | "30d" | "90d";

export interface SuperAdminOverviewData {
  stats: SuperAdminOverviewStats;
  activityTrends: BookingActivityPoint[];
  topDemandCategories: DemandCategorySummary[];
  districtClusters: DemandDistrictCluster[];
  peakHours: PeakDemandHour[];
  alerts: CriticalAlert[];
  insights: SmartInsight[];
  lastUpdated: string;
}

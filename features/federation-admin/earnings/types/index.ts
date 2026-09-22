export interface EarningsKpiMetric {
  totalEarnings: number;
  totalEarningsGrowth: number;
  thisMonth: number;
  thisMonthGrowth: number;
  platformCommission: number;
  commissionGrowth: number;
  netPayout: number;
  netPayoutGrowth: number;
  federationServiceShare?: number;
  taxCollected?: number;
  completedTransactionsCount?: number;
}

export interface MonthlyEarningsTrendPoint {
  month: string;
  serviceValue: number;
  workerPayout: number;
  federationShare: number;
  platformCommission?: number;
  taxCollected?: number;
  grossEarnings?: number;
  netPayout?: number;
}

export interface CategoryEarningsDistributionPoint {
  name: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface RecentEarningsTransaction {
  id: string;
  date: string;
  service: string;
  location: string;
  amount: number;
  commission: number;
  net: number;
  status: "COMPLETED" | "PENDING";
}

export interface QuickInsightMetric {
  growthPercentage: number;
  completedBookings: number;
  topService: string;
  topServiceShare: number;
  averageRating: number;
}

export interface FederationEarningsData {
  kpis: EarningsKpiMetric;
  trend: MonthlyEarningsTrendPoint[];
  categories: CategoryEarningsDistributionPoint[];
  recentTransactions: RecentEarningsTransaction[];
  insights: QuickInsightMetric;
  lastUpdated: string;
}

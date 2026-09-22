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

// Phase 5: Ratings & Feedback Intelligence Types
export interface QualityOverviewMetrics {
  averageWorkerRating: number | null;
  totalReviews: number;
  fiveStarShare: number;
  fourStarShare: number;
  oneTwoStarShare: number;
  workersReviewedCount: number;
  reviewedCompletedServicesCount: number;
}

export interface RatingDistributionItem {
  stars: number;
  count: number;
  percentage: number;
}

export interface FederationQualityMetric {
  federationId: string;
  federationName: string;
  city: string;
  totalWorkers: number;
  reviewCount: number;
  averageRating: number | null;
}

export interface CustomerFeedbackComment {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  serviceTitle: string;
  federationName: string;
  workerProfession: string;
}

export interface QualityAnalyticsData {
  overview: QualityOverviewMetrics;
  distribution: RatingDistributionItem[];
  federationQuality: FederationQualityMetric[];
  recentComments: CustomerFeedbackComment[];
}

// Phase 6: Payments & Invoicing Analytics Types
export interface FinancialOverviewMetrics {
  totalTransactionVolume: number;
  platformCommission: number;
  taxCollected: number;
  paidInvoicesCount: number;
  outstandingReceivables: number;
  paymentSuccessRate: number | null;
  averageTransactionValue: number | null;
  totalPaymentsCount: number;
  successfulPaymentsCount: number;
  workerEarnings?: number;
  federationShare?: number;
  failedPaymentsCount?: number;
}

export interface PaymentStatusBreakdown {
  paidCount: number;
  paidAmount: number;
  pendingCount: number;
  pendingAmount: number;
  failedCount: number;
  failedAmount: number;
  refundedCount: number;
  refundedAmount: number;
}

export interface InvoiceStatusBreakdown {
  paidCount: number;
  paidAmount: number;
  issuedCount: number;
  issuedAmount: number;
  totalCount: number;
  totalAmount: number;
}

export interface FinancialTrendPoint {
  date: string;
  volume: number;
  transactionCount: number;
}

export interface FederationFinancialMetric {
  federationId: string;
  federationName: string;
  city: string;
  transactionCount: number;
  transactionVolume: number;
  platformFee: number;
  paidInvoicesCount: number;
  totalInvoicesCount: number;
}

export interface FinancialAnalyticsData {
  overview: FinancialOverviewMetrics;
  paymentStatusBreakdown: PaymentStatusBreakdown;
  invoiceStatusBreakdown: InvoiceStatusBreakdown;
  trend: FinancialTrendPoint[];
  federationFinancials: FederationFinancialMetric[];
}

// Phase 7: Emergency & On-Demand Operational Intelligence Types
export interface EmergencyOverviewMetrics {
  totalEmergencyRequests: number;
  liveUnassignedCount: number;
  inProgressCount: number;
  completedCount: number;
  completionRate: number | null;
  avgResponseTime: string;
}

export interface EmergencyStatusItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
}

export interface EmergencyTradeItem {
  tradeName: string;
  count: number;
  percentage: number;
}

export interface FederationEmergencyMetric {
  federationId: string;
  federationName: string;
  city: string;
  emergencyRequests: number;
  activeEmergencies: number;
  completedEmergencies: number;
  unassignedEmergencies: number;
}

export interface EmergencyTrendPoint {
  date: string;
  requestsCount: number;
}

export interface EmergencyAnalyticsData {
  overview: EmergencyOverviewMetrics;
  statusDistribution: EmergencyStatusItem[];
  tradeBreakdown: EmergencyTradeItem[];
  federationWorkload: FederationEmergencyMetric[];
  trend: EmergencyTrendPoint[];
}

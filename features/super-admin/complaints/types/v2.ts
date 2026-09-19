export type SuperAdminComplaintSubsection = "FEDERATION_COMPLAINTS" | "FEDERATION_OVERVIEW";

export interface FederationComplaintMetricsRow {
  federationId: string;
  federationName: string;
  totalComplaints: number;
  customerComplaints: number;
  workerComplaints: number;
  federationComplaints: number;
  openComplaints: number;
  underReviewComplaints: number;
  waitingForResponseComplaints: number;
  resolvedComplaints: number;
  rejectedComplaints: number;
  closedComplaints: number;
  escalatedComplaints: number;
  averageResolutionHours: number;
  resolvedWithinPeriodCount: number;
}

export interface ComplaintOverviewAnalytics {
  federations: FederationComplaintMetricsRow[];
  statusDistribution: Array<{ name: string; count: number; color: string }>;
  volumeByFederation: Array<{
    federationId: string;
    federationName: string;
    total: number;
    customer: number;
    worker: number;
    federation: number;
  }>;
  volumeTrend: Array<{ date: string; created: number; resolved: number }>;
  categoryDistribution: Array<{ category: string; count: number }>;
  overallMetrics: {
    totalComplaints: number;
    openComplaints: number;
    underReviewComplaints: number;
    waitingForResponseComplaints: number;
    resolvedComplaints: number;
    rejectedComplaints: number;
    closedComplaints: number;
    escalatedComplaints: number;
    averageResolutionHours: number;
  };
}

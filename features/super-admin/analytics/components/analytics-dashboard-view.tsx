"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useAnalytics } from "../hooks/use-analytics";
import { AnalyticsFilterBar } from "./analytics-filter-bar";
import { BookingGrowthChart } from "./booking-growth-chart";
import { ServiceDemandChart } from "./service-demand-chart";
import { WorkforceUtilizationPanel } from "./workforce-utilization-panel";
import { TopPerformingSocieties } from "./top-performing-societies";
import { SocietyPerformanceTable } from "./society-performance-table";
import { PlatformGrowthChart } from "./platform-growth-chart";
import { FederationComplaintAnalyticsSection } from "./federation-complaint-analytics-section";
import { FinancialAnalyticsSection } from "./financial-analytics-section";
import { QualityFeedbackSection } from "./quality-feedback-section";
import { EmergencyIntelligenceSection } from "./emergency-intelligence-section";
import { DemandVsWorkforce } from "@/features/super-admin/demand-intelligence/components/demand-vs-workforce";
import { GeographicDemandView } from "@/features/super-admin/demand-intelligence/components/geographic-demand-view";
import { demandService } from "@/features/super-admin/demand-intelligence/services/demand-service";
import type { DemandOverviewStats, GeographicDemandCluster } from "@/features/super-admin/demand-intelligence/types";

export function AnalyticsDashboardView() {
  const {
    filters,
    summary,
    bookingGrowth,
    serviceDemand,
    workforceUtilization,
    societyPerformance,
    platformGrowth,
    qualityAnalytics,
    financialAnalytics,
    emergencyAnalytics,
    isLoading,
    error,
    updateTimeframe,
    setCustomRange,
    refresh,
  } = useAnalytics();

  const [demandData, setDemandData] = React.useState<{
    stats: DemandOverviewStats | null;
    geographicClusters: GeographicDemandCluster[];
  }>({
    stats: null,
    geographicClusters: [],
  });
  const [isDemandLoading, setIsDemandLoading] = React.useState<boolean>(true);

  const fetchDemandIntelligence = React.useCallback(async () => {
    setIsDemandLoading(true);
    try {
      const res = await demandService.getDemandIntelligence({
        dateRange: filters.range === "today" ? "today" : filters.range === "week" ? "7d" : filters.range === "year" ? "90d" : "30d",
      });
      setDemandData({
        stats: res.stats,
        geographicClusters: res.geographicClusters,
      });
    } catch (err) {
      console.error("Error fetching demand intelligence:", err);
    } finally {
      setIsDemandLoading(false);
    }
  }, [filters.range]);

  React.useEffect(() => {
    fetchDemandIntelligence();
  }, [fetchDemandIntelligence]);

  const handleRefreshAll = () => {
    refresh();
    fetchDemandIntelligence();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Demand & Platform Analytics"
        description="Comprehensive operational intelligence across regional trade demand, workforce deployment capacity, multi-region geographic hotspots, and transparent cooperative society benchmarks."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Demand & Analytics" },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshAll}
              disabled={isLoading || isDemandLoading}
              className="border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading || isDemandLoading ? "animate-spin" : ""}`}
              />
              Refresh Analytics
            </Button>
          </div>
        }
      />

      {/* Global Analytics Filter Bar */}
      <AnalyticsFilterBar
        filters={filters}
        onTimeframeChange={updateTimeframe}
        onCustomRangeChange={setCustomRange}
      />

      {/* Demand vs. Workforce Balance Panel */}
      <DemandVsWorkforce stats={demandData.stats} isLoading={isDemandLoading} />

      {/* Multi-Region Geographic Demand Hotspots & Map View */}
      <GeographicDemandView
        clusters={demandData.geographicClusters}
        isLoading={isDemandLoading}
      />

      {/* Booking Growth & Service Demand Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BookingGrowthChart
          data={bookingGrowth}
          growthRate={summary?.bookingsGrowthRate}
          isLoading={isLoading}
        />
        <ServiceDemandChart services={serviceDemand} isLoading={isLoading} />
      </div>

      {/* Workforce Deployment & Utilization */}
      <WorkforceUtilizationPanel
        utilization={workforceUtilization}
        isLoading={isLoading}
      />

      {/* Platform Financials & Invoicing Intelligence (Phase 6) */}
      <FinancialAnalyticsSection
        data={financialAnalytics}
        isLoading={isLoading}
      />

      {/* Platform Quality & Feedback Intelligence (Phase 5) */}
      <QualityFeedbackSection
        data={qualityAnalytics}
        isLoading={isLoading}
      />

      {/* Emergency & On-Demand Operational Intelligence (Phase 7) */}
      <EmergencyIntelligenceSection
        data={emergencyAnalytics}
        isLoading={isLoading}
      />

      {/* Top Performing Societies */}
      <TopPerformingSocieties
        societies={societyPerformance}
        isLoading={isLoading}
      />

      {/* Society Performance Comparison Table */}
      <SocietyPerformanceTable
        societies={societyPerformance}
        isLoading={isLoading}
      />

      {/* Platform Multi-Metric Growth */}
      <PlatformGrowthChart
        data={platformGrowth}
        isLoading={isLoading}
      />

      {/* Federation Complaint & Dispute Operational Monitoring */}
      <FederationComplaintAnalyticsSection />
    </div>
  );
}

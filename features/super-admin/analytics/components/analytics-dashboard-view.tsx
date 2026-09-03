"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { RefreshCw, BarChart3 } from "lucide-react";
import { useAnalytics } from "../hooks/use-analytics";
import { AnalyticsFilterBar } from "./analytics-filter-bar";
import { BookingGrowthChart } from "./booking-growth-chart";
import { ServiceDemandChart } from "./service-demand-chart";
import { WorkforceUtilizationPanel } from "./workforce-utilization-panel";
import { TopPerformingSocieties } from "./top-performing-societies";
import { SocietyPerformanceTable } from "./society-performance-table";
import { PlatformGrowthChart } from "./platform-growth-chart";

export function AnalyticsDashboardView() {
  const {
    filters,
    summary,
    bookingGrowth,
    serviceDemand,
    workforceUtilization,
    societyPerformance,
    platformGrowth,
    isLoading,
    error,
    updateTimeframe,
    setCustomRange,
    refresh,
  } = useAnalytics();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Platform Performance Analytics"
        description="Comprehensive operational analytics across service booking growth, trade demand, workforce utilization tiers, and transparent society benchmarks."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Analytics" },
        ]}
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
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
    </div>
  );
}

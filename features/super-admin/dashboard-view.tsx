"use client";

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSuperAdminOverview } from "./hooks/use-super-admin-overview";
import { KPIGrid } from "./components/kpi-grid";
import { BookingActivityChart } from "./components/booking-activity-chart";
import { DemandSummaryPanel } from "./components/demand-summary-panel";
import { CriticalAlertsPanel } from "./components/critical-alerts-panel";
import { SmartInsightsPanel } from "./components/smart-insights-panel";

export function SuperAdminDashboardView() {
  const { data, isLoading, timeframe, setTimeframe, refresh } = useSuperAdminOverview();

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Super Admin System Control"
        description="Platform-wide cooperative governance, workforce operations, service volume trends, and intelligence."
        breadcrumbs={[{ label: "Super Admin", href: "/super-admin" }, { label: "Overview" }]}
        actions={
          <div className="flex items-center space-x-3">
            {data?.lastUpdated && (
              <Badge variant="outline" className="hidden sm:inline-flex text-xs text-muted-foreground bg-card">
                Updated {data.lastUpdated}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={isLoading}
              className="h-9 border-emerald-800/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>
        }
      />

      {/* Critical Platform Alerts */}
      <CriticalAlertsPanel alerts={data?.alerts} isLoading={isLoading} />

      {/* Platform-wide KPI Grid */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
          Platform Governance Metrics
        </h3>
        <KPIGrid stats={data?.stats} isLoading={isLoading} />
      </div>

      {/* Analytics & Demand Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BookingActivityChart
            data={data?.activityTrends}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            isLoading={isLoading}
          />
        </div>
        <div>
          <DemandSummaryPanel
            categories={data?.topDemandCategories}
            clusters={data?.districtClusters}
            peakHours={data?.peakHours}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Smart Analytical Insights */}
      <SmartInsightsPanel insights={data?.insights} isLoading={isLoading} />
    </div>
  );
}

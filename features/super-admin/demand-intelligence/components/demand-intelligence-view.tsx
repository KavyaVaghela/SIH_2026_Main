"use client";

import * as React from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingUp } from "lucide-react";
import { useDemandIntelligence } from "../hooks/use-demand-intelligence";
import { DemandKPIGrid } from "./demand-kpi-grid";
import { DemandFilters } from "./demand-filters";
import { DemandVsWorkforce } from "./demand-vs-workforce";
import { MostDemandedServices } from "./most-demanded-services";
import { GeographicDemandView } from "./geographic-demand-view";
import { ShortageAlertsPanel } from "./shortage-alerts-panel";
import { SmartRecommendationCard } from "./smart-recommendation-card";
import { ShortageDetailModal } from "./shortage-detail-modal";

export function DemandIntelligenceView() {
  const {
    stats,
    demandedServices,
    geographicClusters,
    shortageAlerts,
    recommendations,
    locations,
    societies,
    services,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    selectedAlert,
    selectedRecommendation,
    openAlertDetail,
    closeAlertDetail,
    refresh,
  } = useDemandIntelligence();

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Demand Intelligence & Workforce Allocation"
        description="Monitor macro service demand spikes, regional skill shortages, geographic cluster deficits, and automated smart allocation proposals."
        breadcrumbs={[
          { label: "Super Admin", href: "/super-admin" },
          { label: "Demand Intelligence" },
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
              Refresh Demand Signals
            </Button>
          </div>
        }
      />

      {/* 5-Metric KPI Row */}
      <DemandKPIGrid stats={stats} isLoading={isLoading} />

      {/* Filter Toolbar */}
      <DemandFilters
        filters={filters}
        locations={locations}
        societies={societies}
        services={services}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Critical Shortage Alerts Panel */}
      <ShortageAlertsPanel
        alerts={shortageAlerts}
        onViewDetails={openAlertDetail}
        isLoading={isLoading}
      />

      {/* Demand vs Workforce Capacity & Most Demanded Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DemandVsWorkforce stats={stats} isLoading={isLoading} />
        <MostDemandedServices services={demandedServices} isLoading={isLoading} />
      </div>

      {/* Geographic Regional Demand Hotspots & Map View */}
      <GeographicDemandView
        clusters={geographicClusters}
        onSelectLocation={(loc) => updateFilters({ location: loc })}
        isLoading={isLoading}
      />

      {/* Smart Cross-Allocation Reallocation Recommendations */}
      <SmartRecommendationCard
        recommendations={recommendations}
        onInspectRecommendation={(rec) => {
          const matchedAlert = shortageAlerts.find((a) => a.id === rec.alertId) || shortageAlerts[0];
          if (matchedAlert) openAlertDetail(matchedAlert);
        }}
        isLoading={isLoading}
      />

      {/* Deep-Dive Shortage Detail Inspection Modal */}
      <ShortageDetailModal
        alert={selectedAlert}
        recommendation={selectedRecommendation}
        onClose={closeAlertDetail}
      />
    </div>
  );
}

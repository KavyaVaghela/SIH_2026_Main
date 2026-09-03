// features/super-admin/workforce/components/workforce-dashboard.tsx
"use client";

import * as React from "react";
import { WorkforceStatsGrid } from "./workforce-stats";
import { WorkforceFilters } from "./workforce-filters";
import { WorkerTable } from "./worker-table";
import { UnderutilizedWorkersPanel } from "./underutilized-workers-panel";
import { useWorkforce } from "../hooks/use-workforce";

export function WorkforceDashboard() {
  const {
    stats,
    workers,
    underutilizedWorkers,
    totalCount,
    societies,
    skills,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh,
  } = useWorkforce();

  const handleUnderutilizedClick = React.useCallback(() => {
    updateFilters({ viewMode: "UNDERUTILIZED" });
  }, [updateFilters]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <WorkforceStatsGrid
        stats={stats}
        isLoading={isLoading}
        onUnderutilizedClick={handleUnderutilizedClick}
      />
      {/* Filters */}
      <WorkforceFilters
        filters={filters}
        societies={societies}
        skills={skills}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />
      {/* Conditional view */}
      {filters.viewMode === "UNDERUTILIZED" ? (
        <UnderutilizedWorkersPanel
          workers={underutilizedWorkers}
          timeframe={filters.underutilizedTimeframe}
          onTimeframeChange={(tf) => updateFilters({ underutilizedTimeframe: tf })}
          isLoading={isLoading}
        />
      ) : (
        <WorkerTable
          data={workers}
          totalCount={totalCount}
          currentPage={filters.page}
          pageSize={filters.pageSize}
          onPageChange={(page) => updateFilters({ page })}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}

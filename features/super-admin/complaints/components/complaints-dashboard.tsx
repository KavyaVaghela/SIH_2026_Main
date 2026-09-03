"use client";

import * as React from "react";
import { useComplaints } from "../hooks/use-complaints";
import { ComplaintsStatsGrid } from "./complaints-stats-grid";
import { ComplaintsFilters } from "./complaints-filters";
import { ComplaintsTable } from "./complaints-table";

export function ComplaintsDashboard() {
  const {
    filters,
    stats,
    complaints,
    totalCount,
    societies,
    categories,
    isLoading,
    error,
    updateFilters,
    resetFilters,
  } = useComplaints();

  return (
    <div className="space-y-6">
      {/* 4-KPI Metric Row */}
      <ComplaintsStatsGrid
        stats={stats}
        onFilterSelect={(status) => updateFilters({ status })}
        isLoading={isLoading}
      />

      {/* Filter Toolbar */}
      <ComplaintsFilters
        filters={filters}
        societies={societies}
        categories={categories}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Complaints Table */}
      <ComplaintsTable
        complaints={complaints}
        totalCount={totalCount}
        currentPage={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(page) => updateFilters({ page })}
        isLoading={isLoading}
      />
    </div>
  );
}

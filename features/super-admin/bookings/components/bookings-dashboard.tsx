"use client";

import * as React from "react";
import { BookingsStatsGrid } from "./bookings-stats";
import { BookingsFilters } from "./bookings-filters";
import { BookingsTable } from "./bookings-table";
import { useBookings } from "../hooks/use-bookings";

export function BookingsDashboard() {
  const {
    stats,
    bookings,
    totalCount,
    societies,
    services,
    locations,
    isLoading,
    error,
    filters,
    updateFilters,
    resetFilters,
  } = useBookings();

  const handleStatsFilterClick = React.useCallback(
    (statusValue: string) => {
      updateFilters({ status: statusValue });
    },
    [updateFilters]
  );

  return (
    <div className="space-y-6">
      {/* 6-KPI Booking Status Metrics */}
      <BookingsStatsGrid
        stats={stats}
        isLoading={isLoading}
        onFilterClick={handleStatsFilterClick}
      />

      {/* Advanced Filter Toolbar */}
      <BookingsFilters
        filters={filters}
        societies={societies}
        services={services}
        locations={locations}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Main Monitoring Table */}
      <BookingsTable
        data={bookings}
        totalCount={totalCount}
        currentPage={filters.page}
        pageSize={filters.pageSize}
        onPageChange={(page) => updateFilters({ page })}
        isLoading={isLoading}
      />
    </div>
  );
}

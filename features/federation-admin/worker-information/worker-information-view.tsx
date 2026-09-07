"use client";

import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkerInformation } from "./hooks/use-worker-information";
import { WorkerInformationHeader } from "./components/worker-information-header";
import { WorkerFilters } from "./components/worker-filters";
import { WorkerTable } from "./components/worker-table";

export function WorkerInformationView() {
  const {
    workers,
    totalCount,
    professions,
    areas,
    isDevelopmentFallback,
    dataSourceNotice,
    filters,
    updateFilter,
    resetFilters,
    isLoading,
    error,
    refresh,
  } = useWorkerInformation();

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Module Header */}
      <WorkerInformationHeader
        totalCount={totalCount}
        onRefresh={refresh}
        isLoading={isLoading}
        isDevelopmentFallback={isDevelopmentFallback}
        dataSourceNotice={dataSourceNotice}
      />

      {/* 2. Error State */}
      {error && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-sm">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            className="border-rose-500/40 text-rose-800 dark:text-rose-300 hover:bg-rose-500/20"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      )}

      {/* 3. Search & Combined Filters */}
      <WorkerFilters
        filters={filters}
        professions={professions}
        areas={areas}
        onFilterChange={updateFilter}
        onReset={resetFilters}
      />

      {/* 4. Worker Roster Table */}
      <WorkerTable
        workers={workers}
        isLoading={isLoading}
        onResetFilters={resetFilters}
      />
    </div>
  );
}

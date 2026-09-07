"use client";

import * as React from "react";
import { workerInformationService } from "../services/worker-information-service";
import type {
  WorkerListItem,
  WorkerFilterState,
  WorkerInformationData,
} from "../types";

export function useWorkerInformation() {
  const [filters, setFilters] = React.useState<WorkerFilterState>({
    searchQuery: "",
    profession: "ALL",
    area: "ALL",
    performanceTier: "ALL",
  });

  const [data, setData] = React.useState<WorkerInformationData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchWorkers = React.useCallback(async (activeFilters: WorkerFilterState) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await workerInformationService.getWorkers(activeFilters);
      setData(result);
    } catch (err) {
      console.error("Failed to load worker roster:", err);
      setError("Unable to load worker roster. Please verify network access.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWorkers(filters);
  }, [filters, fetchWorkers]);

  const updateFilter = (key: keyof WorkerFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: "",
      profession: "ALL",
      area: "ALL",
      performanceTier: "ALL",
    });
  };

  const refresh = () => {
    fetchWorkers(filters);
  };

  return {
    workers: data?.workers || [],
    totalCount: data?.totalCount || 0,
    professions: data?.professions || [],
    areas: data?.areas || [],
    isDevelopmentFallback: data?.isDevelopmentFallback || false,
    dataSourceNotice: data?.dataSourceNotice,
    filters,
    updateFilter,
    resetFilters,
    isLoading,
    error,
    refresh,
  };
}

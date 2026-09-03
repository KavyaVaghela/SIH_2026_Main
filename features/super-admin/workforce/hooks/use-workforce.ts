"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { workforceService } from "../services/workforce-service";
import type {
  WorkforceStats,
  WorkerListItem,
  UnderutilizedWorkerItem,
  UnderutilizedTimeframe,
  WorkforceFilterOptions,
} from "../types";

export function useWorkforce() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read initial filter values from URL query parameters
  const [filters, setFilters] = React.useState<WorkforceFilterOptions>({
    searchQuery: searchParams?.get("query") || "",
    societyId: searchParams?.get("society") || "ALL",
    skill: searchParams?.get("skill") || "ALL",
    availability: searchParams?.get("availability") || "ALL",
    verification: searchParams?.get("verification") || "ALL",
    viewMode: (searchParams?.get("view")?.toUpperCase() as "ALL" | "UNDERUTILIZED") || "ALL",
    underutilizedTimeframe: (searchParams?.get("timeframe") as UnderutilizedTimeframe) || "30d",
    sortBy: "fullName",
    sortOrder: "asc",
    page: Number(searchParams?.get("page")) || 1,
    pageSize: 10,
  });

  const [stats, setStats] = React.useState<WorkforceStats | null>(null);
  const [workers, setWorkers] = React.useState<WorkerListItem[]>([]);
  const [underutilizedWorkers, setUnderutilizedWorkers] = React.useState<UnderutilizedWorkerItem[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [societies, setSocieties] = React.useState<Array<{ id: string; name: string }>>([]);
  const [skills, setSkills] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state changes back to URL query parameters cleanly
  const syncUrlParams = React.useCallback(
    (opts: WorkforceFilterOptions) => {
      const params = new URLSearchParams();
      if (opts.searchQuery) params.set("query", opts.searchQuery);
      if (opts.societyId !== "ALL") params.set("society", opts.societyId);
      if (opts.skill !== "ALL") params.set("skill", opts.skill);
      if (opts.availability !== "ALL") params.set("availability", opts.availability);
      if (opts.verification !== "ALL") params.set("verification", opts.verification);
      if (opts.viewMode === "UNDERUTILIZED") params.set("view", "underutilized");
      if (opts.underutilizedTimeframe !== "30d") params.set("timeframe", opts.underutilizedTimeframe);
      if (opts.page > 1) params.set("page", String(opts.page));

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  const fetchWorkforceData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsRes, listRes, underutilizedRes] = await Promise.all([
        workforceService.getWorkforceStats(),
        workforceService.getWorkers(filters),
        workforceService.getUnderutilizedWorkers(filters.underutilizedTimeframe),
      ]);

      setStats(statsRes);
      setWorkers(listRes.data);
      setTotalCount(listRes.totalCount);
      setSocieties(listRes.societies);
      setSkills(listRes.skills);
      setUnderutilizedWorkers(underutilizedRes);
    } catch (err) {
      console.error("Failed to fetch workforce data:", err);
      setError("An error occurred while loading workforce intelligence.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchWorkforceData();
  }, [fetchWorkforceData]);

  const updateFilters = (newFilters: Partial<WorkforceFilterOptions>) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        ...newFilters,
        page: newFilters.page !== undefined ? newFilters.page : 1,
      };
      syncUrlParams(updated);
      return updated;
    });
  };

  const resetFilters = () => {
    const defaultFilters: WorkforceFilterOptions = {
      searchQuery: "",
      societyId: "ALL",
      skill: "ALL",
      availability: "ALL",
      verification: "ALL",
      viewMode: "ALL",
      underutilizedTimeframe: "30d",
      sortBy: "fullName",
      sortOrder: "asc",
      page: 1,
      pageSize: 10,
    };
    setFilters(defaultFilters);
    syncUrlParams(defaultFilters);
  };

  return {
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
    refresh: fetchWorkforceData,
  };
}

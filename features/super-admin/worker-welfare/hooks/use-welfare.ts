"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { welfareService } from "../services/welfare-service";
import type {
  WelfareSummaryStats,
  WorkerWelfareRecord,
  WelfareAlert,
  WelfareFilterOptions,
  WelfareCoverageStatus,
} from "../types";

export function useWelfare() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read initial filter values from URL params
  const initialStatus = (searchParams?.get("status") as WelfareCoverageStatus) || "ALL";
  const initialSociety = searchParams?.get("society") || "ALL";
  const initialSearch = searchParams?.get("q") || "";
  const initialPage = Number(searchParams?.get("page")) || 1;

  const [filters, setFilters] = React.useState<WelfareFilterOptions>({
    status: initialStatus,
    society: initialSociety,
    searchQuery: initialSearch,
    page: initialPage,
    pageSize: 10,
  });

  const [stats, setStats] = React.useState<WelfareSummaryStats | null>(null);
  const [records, setRecords] = React.useState<WorkerWelfareRecord[]>([]);
  const [alerts, setAlerts] = React.useState<WelfareAlert[]>([]);
  const [totalCount, setTotalCount] = React.useState<number>(0);
  const [societies, setSocieties] = React.useState<Array<{ id: string; name: string }>>([]);

  // Selected record for inspection modal
  const [selectedRecord, setSelectedRecord] = React.useState<WorkerWelfareRecord | null>(null);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state back to URL
  const syncUrlParams = React.useCallback(
    (opts: WelfareFilterOptions) => {
      const params = new URLSearchParams();
      if (opts.status !== "ALL") params.set("status", opts.status);
      if (opts.society !== "ALL") params.set("society", opts.society);
      if (opts.searchQuery) params.set("q", opts.searchQuery);
      if (opts.page > 1) params.set("page", String(opts.page));

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await welfareService.getWelfareData(filters);
      setStats(res.stats);
      setRecords(res.records);
      setAlerts(res.alerts);
      setTotalCount(res.totalCount);
      setSocieties(res.societies);
    } catch (err) {
      console.error("Failed to load welfare data:", err);
      setError("An error occurred while loading worker welfare and insurance records.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = (newFilters: Partial<WelfareFilterOptions>) => {
    setFilters((prev) => {
      const updated = {
        ...prev,
        ...newFilters,
        // Reset to page 1 if changing status, society, or search
        page: newFilters.page !== undefined ? newFilters.page : 1,
      };
      syncUrlParams(updated);
      return updated;
    });
  };

  const resetFilters = () => {
    const defaultFilters: WelfareFilterOptions = {
      status: "ALL",
      society: "ALL",
      searchQuery: "",
      page: 1,
      pageSize: 10,
    };
    setFilters(defaultFilters);
    syncUrlParams(defaultFilters);
  };

  const openDetail = (record: WorkerWelfareRecord) => {
    setSelectedRecord(record);
  };

  const closeDetail = () => {
    setSelectedRecord(null);
  };

  return {
    filters,
    stats,
    records,
    alerts,
    totalCount,
    societies,
    selectedRecord,
    isLoading,
    error,
    updateFilters,
    resetFilters,
    openDetail,
    closeDetail,
    refresh: fetchData,
  };
}

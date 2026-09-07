"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { analyticsService } from "../services/analytics-service";
import type {
  AnalyticsFilters,
  AnalyticsTimeframe,
  AnalyticsSummary,
  BookingGrowthPoint,
  ServiceDemandMetric,
  WorkforceUtilizationMetric,
  SocietyPerformanceMetric,
  PlatformGrowthPoint,
} from "../types";

export function useAnalytics() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read initial filter state from URL query params
  const initialRange = (searchParams?.get("range") as AnalyticsTimeframe) || "month";
  const initialFrom = searchParams?.get("from") || "";
  const initialTo = searchParams?.get("to") || "";

  const [filters, setFilters] = React.useState<AnalyticsFilters>({
    range: initialRange,
    customFrom: initialFrom,
    customTo: initialTo,
  });

  const [summary, setSummary] = React.useState<AnalyticsSummary | null>(null);
  const [bookingGrowth, setBookingGrowth] = React.useState<BookingGrowthPoint[]>([]);
  const [serviceDemand, setServiceDemand] = React.useState<ServiceDemandMetric[]>([]);
  const [workforceUtilization, setWorkforceUtilization] = React.useState<WorkforceUtilizationMetric | null>(null);
  const [societyPerformance, setSocietyPerformance] = React.useState<SocietyPerformanceMetric[]>([]);
  const [platformGrowth, setPlatformGrowth] = React.useState<PlatformGrowthPoint[]>([]);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state back to URL
  const syncUrlParams = React.useCallback(
    (opts: AnalyticsFilters) => {
      const params = new URLSearchParams();
      if (opts.range !== "month") params.set("range", opts.range);
      if (opts.range === "custom") {
        if (opts.customFrom) params.set("from", opts.customFrom);
        if (opts.customTo) params.set("to", opts.customTo);
      }

      const qs = params.toString();
      const newUrl = qs ? `${pathname}?${qs}` : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [pathname, router]
  );

  const fetchData = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getAnalyticsData(filters);
      setSummary(res.summary);
      setBookingGrowth(res.bookingGrowth);
      setServiceDemand(res.serviceDemand);
      setWorkforceUtilization(res.workforceUtilization);
      setSocietyPerformance(res.societyPerformance);
      setPlatformGrowth(res.platformGrowth);
    } catch (err) {
      console.error("Failed to load platform analytics:", err);
      setError("An error occurred while loading executive analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateTimeframe = (range: AnalyticsTimeframe) => {
    setFilters((prev) => {
      const updated = { ...prev, range };
      syncUrlParams(updated);
      return updated;
    });
  };

  const setCustomRange = (from: string, to: string) => {
    setFilters({
      range: "custom",
      customFrom: from,
      customTo: to,
    });
    syncUrlParams({
      range: "custom",
      customFrom: from,
      customTo: to,
    });
  };

  return {
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
    refresh: fetchData,
  };
}

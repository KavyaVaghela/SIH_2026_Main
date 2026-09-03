"use client";

import * as React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { demandService } from "../services/demand-service";
import { workforceRecommendationEngine } from "../services/workforce-recommendations";
import type {
  DemandOverviewStats,
  DemandedServiceItem,
  GeographicDemandCluster,
  ShortageAlert,
  WorkforceAllocationRecommendation,
  DemandFilterOptions,
  DemandDateRange,
} from "../types";

export function useDemandIntelligence() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Read initial filter values from URL search params
  const [filters, setFilters] = React.useState<DemandFilterOptions>({
    location: searchParams?.get("location") || "ALL",
    society: searchParams?.get("society") || "ALL",
    service: searchParams?.get("service") || "ALL",
    dateRange: (searchParams?.get("date") as DemandDateRange) || "30d",
  });

  const [stats, setStats] = React.useState<DemandOverviewStats | null>(null);
  const [demandedServices, setDemandedServices] = React.useState<DemandedServiceItem[]>([]);
  const [geographicClusters, setGeographicClusters] = React.useState<GeographicDemandCluster[]>([]);
  const [shortageAlerts, setShortageAlerts] = React.useState<ShortageAlert[]>([]);
  const [recommendations, setRecommendations] = React.useState<WorkforceAllocationRecommendation[]>([]);
  const [locations, setLocations] = React.useState<string[]>([]);
  const [societies, setSocieties] = React.useState<Array<{ id: string; name: string }>>([]);
  const [services, setServices] = React.useState<string[]>([]);

  // Selected shortage for detail modal
  const [selectedAlert, setSelectedAlert] = React.useState<ShortageAlert | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = React.useState<WorkforceAllocationRecommendation | null>(null);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  // Sync state changes back to URL query parameters
  const syncUrlParams = React.useCallback(
    (opts: DemandFilterOptions) => {
      const params = new URLSearchParams();
      if (opts.location !== "ALL") params.set("location", opts.location);
      if (opts.society !== "ALL") params.set("society", opts.society);
      if (opts.service !== "ALL") params.set("service", opts.service);
      if (opts.dateRange !== "30d") params.set("date", opts.dateRange);

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
      const res = await demandService.getDemandIntelligence(filters);
      setStats(res.stats);
      setDemandedServices(res.demandedServices);
      setGeographicClusters(res.geographicClusters);
      setShortageAlerts(res.shortageAlerts);
      setRecommendations(res.recommendations);
      setLocations(res.locations);
      setSocieties(res.societies);
      setServices(res.services);
    } catch (err) {
      console.error("Failed to load demand intelligence:", err);
      setError("An error occurred while loading regional demand intelligence.");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateFilters = (newFilters: Partial<DemandFilterOptions>) => {
    setFilters((prev) => {
      const updated = { ...prev, ...newFilters };
      syncUrlParams(updated);
      return updated;
    });
  };

  const resetFilters = () => {
    const defaultFilters: DemandFilterOptions = {
      location: "ALL",
      society: "ALL",
      service: "ALL",
      dateRange: "30d",
    };
    setFilters(defaultFilters);
    syncUrlParams(defaultFilters);
  };

  const openAlertDetail = async (alert: ShortageAlert) => {
    setSelectedAlert(alert);
    const rec = await workforceRecommendationEngine.getRecommendationForAlert(alert.id);
    setSelectedRecommendation(rec);
  };

  const closeAlertDetail = () => {
    setSelectedAlert(null);
    setSelectedRecommendation(null);
  };

  return {
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
    refresh: fetchData,
  };
}

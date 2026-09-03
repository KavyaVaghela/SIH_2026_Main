"use client";

import * as React from "react";
import { federationAdminService } from "../services/federation-admin-service";
import type { FederationAdminDashboardData, DashboardTimeframe } from "../types";

export function useFederationDashboard() {
  const [timeframe, setTimeframe] = React.useState<DashboardTimeframe>("30d");
  const [data, setData] = React.useState<FederationAdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDashboardData = React.useCallback(async (tf: DashboardTimeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await federationAdminService.getDashboardData(tf);
      setData(result);
    } catch (err) {
      console.error("Failed to load Federation Admin dashboard data:", err);
      setError("Unable to load federation performance metrics. Please verify network access.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchDashboardData(timeframe);
  }, [timeframe, fetchDashboardData]);

  const handleTimeframeChange = (newTimeframe: DashboardTimeframe) => {
    setTimeframe(newTimeframe);
  };

  const handleRefresh = () => {
    fetchDashboardData(timeframe);
  };

  return {
    data,
    isLoading,
    error,
    timeframe,
    setTimeframe: handleTimeframeChange,
    refresh: handleRefresh,
  };
}

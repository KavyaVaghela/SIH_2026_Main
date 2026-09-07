"use client";

import * as React from "react";
import { superAdminService } from "../services/super-admin-service";
import type { SuperAdminOverviewData, OverviewTimeframe } from "../types";

export function useSuperAdminOverview() {
  const [timeframe, setTimeframe] = React.useState<OverviewTimeframe>("30d");
  const [data, setData] = React.useState<SuperAdminOverviewData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchOverview = React.useCallback(async (tf: OverviewTimeframe) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await superAdminService.getOverviewData(tf);
      setData(result);
    } catch (err) {
      console.error("Failed to load Super Admin overview data:", err);
      setError("Failed to load platform analytics. Please check network connection.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchOverview(timeframe);
  }, [timeframe, fetchOverview]);

  const handleTimeframeChange = (newTf: OverviewTimeframe) => {
    setTimeframe(newTf);
  };

  const handleRefresh = () => {
    fetchOverview(timeframe);
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

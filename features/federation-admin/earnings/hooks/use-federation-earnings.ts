"use client";

import * as React from "react";
import { federationEarningsService } from "../services/earnings-service";
import type { FederationEarningsData } from "../types";

export function useFederationEarnings() {
  const [selectedMonthKey, setSelectedMonthKey] = React.useState<string>("2026-09");
  const [data, setData] = React.useState<FederationEarningsData | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchEarningsData = React.useCallback(async (monthKey: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await federationEarningsService.getEarningsData(monthKey);
      setData(result);
    } catch (err) {
      console.error("Failed to load Federation Earnings data:", err);
      setError("Unable to load earnings and revenue metrics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchEarningsData(selectedMonthKey);
  }, [selectedMonthKey, fetchEarningsData]);

  const handleMonthChange = (newMonthKey: string) => {
    setSelectedMonthKey(newMonthKey);
  };

  const handleRefresh = () => {
    fetchEarningsData(selectedMonthKey);
  };

  return {
    data,
    isLoading,
    error,
    selectedMonthKey,
    setSelectedMonthKey: handleMonthChange,
    refresh: handleRefresh,
  };
}

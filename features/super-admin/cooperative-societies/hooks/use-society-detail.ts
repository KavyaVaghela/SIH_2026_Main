"use client";

import * as React from "react";
import { societiesService } from "../services/societies-service";
import type {
  SocietyDetails,
  SocietyWorkerItem,
  SocietyBookingItem,
  SocietyPerformanceMetrics,
} from "../types";

export function useSocietyDetail(id: string) {
  const [society, setSociety] = React.useState<SocietyDetails | null>(null);
  const [workers, setWorkers] = React.useState<SocietyWorkerItem[]>([]);
  const [bookings, setBookings] = React.useState<SocietyBookingItem[]>([]);
  const [performance, setPerformance] = React.useState<SocietyPerformanceMetrics | null>(null);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>("overview");

  const loadSocietyData = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [detailsData, workersData, bookingsData, perfData] = await Promise.all([
        societiesService.getSocietyById(id),
        societiesService.getSocietyWorkers(id),
        societiesService.getSocietyBookings(id),
        societiesService.getSocietyPerformance(id),
      ]);

      if (!detailsData) {
        setError("Cooperative Society not found.");
      } else {
        setSociety(detailsData);
        setWorkers(workersData);
        setBookings(bookingsData);
        setPerformance(perfData);
      }
    } catch (err) {
      console.error("Failed to load society details:", err);
      setError("An error occurred while fetching society information.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadSocietyData();
  }, [loadSocietyData]);

  return {
    society,
    workers,
    bookings,
    performance,
    isLoading,
    error,
    activeTab,
    setActiveTab,
    refresh: loadSocietyData,
  };
}

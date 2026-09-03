"use client";

import * as React from "react";
import { workforceService } from "../services/workforce-service";
import type {
  WorkerDetails,
  WorkerSkillItem,
  WorkerCertificationItem,
  WorkerBookingItem,
  WorkerPerformanceMetrics,
  WorkerWelfareStatus,
} from "../types";

export function useWorkerDetail(id: string) {
  const [worker, setWorker] = React.useState<WorkerDetails | null>(null);
  const [skills, setSkills] = React.useState<WorkerSkillItem[]>([]);
  const [certifications, setCertifications] = React.useState<WorkerCertificationItem[]>([]);
  const [bookings, setBookings] = React.useState<WorkerBookingItem[]>([]);
  const [performance, setPerformance] = React.useState<WorkerPerformanceMetrics | null>(null);
  const [welfare, setWelfare] = React.useState<WorkerWelfareStatus | null>(null);

  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadWorkerData = React.useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [wDetails, wSkills, wCerts, wBookings, wPerf, wWelfare] = await Promise.all([
        workforceService.getWorkerById(id),
        workforceService.getWorkerSkills(id),
        workforceService.getWorkerCertifications(id),
        workforceService.getWorkerBookings(id),
        workforceService.getWorkerPerformance(id),
        workforceService.getWorkerWelfare(id),
      ]);

      if (!wDetails) {
        setError("Worker record not found.");
      } else {
        setWorker(wDetails);
        setSkills(wSkills);
        setCertifications(wCerts);
        setBookings(wBookings);
        setPerformance(wPerf);
        setWelfare(wWelfare);
      }
    } catch (err) {
      console.error("Failed to load worker details:", err);
      setError("An error occurred while loading worker profile.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    loadWorkerData();
  }, [loadWorkerData]);

  return {
    worker,
    skills,
    certifications,
    bookings,
    performance,
    welfare,
    isLoading,
    error,
    refresh: loadWorkerData,
  };
}

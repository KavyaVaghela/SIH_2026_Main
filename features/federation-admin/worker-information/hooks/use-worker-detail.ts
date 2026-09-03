"use client";

import * as React from "react";
import { workerInformationService } from "../services/worker-information-service";
import type { WorkerFullDetails } from "../types";

export function useWorkerDetail(workerId: string) {
  const [worker, setWorker] = React.useState<WorkerFullDetails | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchWorker = React.useCallback(async () => {
    if (!workerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await workerInformationService.getWorkerById(workerId);
      if (!result) {
        setError("The requested worker profile could not be found in this federation's roster.");
      } else {
        setWorker(result);
      }
    } catch (err) {
      console.error(`Failed to load details for worker ${workerId}:`, err);
      setError("Unable to retrieve worker profile. Please check connectivity.");
    } finally {
      setIsLoading(false);
    }
  }, [workerId]);

  React.useEffect(() => {
    fetchWorker();
  }, [fetchWorker]);

  return {
    worker,
    isLoading,
    error,
    refresh: fetchWorker,
  };
}

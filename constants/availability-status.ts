export const WORKER_AVAILABILITY = {
  AVAILABLE: "AVAILABLE",
  BUSY: "BUSY",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export type WorkerAvailabilityConstant =
  (typeof WORKER_AVAILABILITY)[keyof typeof WORKER_AVAILABILITY];

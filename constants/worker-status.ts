export const WORKER_ACCOUNT_STATUS = {
  ACTIVE: "ACTIVE",
  DEACTIVATED: "DEACTIVATED",
} as const;

export type WorkerAccountStatusConstant =
  (typeof WORKER_ACCOUNT_STATUS)[keyof typeof WORKER_ACCOUNT_STATUS];

export const COMPLAINT_STATUS = {
  OPEN: "OPEN",
  IN_REVIEW: "IN_REVIEW",
  RESOLVED: "RESOLVED",
} as const;

export type ComplaintStatusConstant = (typeof COMPLAINT_STATUS)[keyof typeof COMPLAINT_STATUS];

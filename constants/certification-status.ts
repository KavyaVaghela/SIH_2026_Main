export const CERTIFICATION_STATUS = {
  VERIFIED: "VERIFIED",
  EXPIRING_SOON: "EXPIRING_SOON",
  EXPIRED: "EXPIRED",
} as const;

export type CertificationStatusConstant =
  (typeof CERTIFICATION_STATUS)[keyof typeof CERTIFICATION_STATUS];

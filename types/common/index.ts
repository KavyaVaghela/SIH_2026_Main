export type CertificationStatus = "VERIFIED" | "EXPIRING_SOON" | "EXPIRED";

export interface Address {
  id: string;
  profileId: string;
  title: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  latitude?: number | null;
  longitude?: number | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  id: string;
  workerId: string;
  dayOfWeek: number; // 0-6
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  createdAt: string;
}

export interface Certification {
  id: string;
  title: string;
  issuingBody: string;
  validityMonths?: number | null;
  createdAt: string;
}

export interface WorkerCertification {
  id: string;
  workerId: string;
  certificationId: string;
  certification?: Certification;
  certificateNumber?: string | null;
  issueDate: string;
  expiryDate?: string | null;
  status: CertificationStatus;
  isVerified: boolean;
  verificationDate?: string | null;
  createdAt: string;
}

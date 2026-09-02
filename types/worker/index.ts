import type { Profile } from "../auth";
import type { Federation } from "../federation";

export type WorkerAccountStatus = "ACTIVE" | "DEACTIVATED";
export type WorkerAvailability = "AVAILABLE" | "BUSY" | "UNAVAILABLE";

export interface Worker {
  id: string;
  profileId: string;
  profile?: Profile;
  federationId: string;
  federation?: Federation;
  status: WorkerAccountStatus;
  availability: WorkerAvailability;
  hourlyRate: number;
  experienceYears: number;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

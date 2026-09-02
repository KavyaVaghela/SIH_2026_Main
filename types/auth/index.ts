import type { PlatformRole } from "../roles";

export type ApplicationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface Profile {
  id: string;
  role: PlatformRole;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

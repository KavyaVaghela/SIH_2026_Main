import type { WorkerAccountStatus, WorkerAvailabilityStatus } from "@/supabase/types/database.types";

export interface ManagedWorkerItem {
  id: string;
  fullName: string;
  profession: string;
  area: string;
  city: string;
  state: string;
  accountStatus: WorkerAccountStatus;
  availabilityStatus: WorkerAvailabilityStatus;
  hourlyRate: number;
  experienceYears: number;
  joiningDate: string;
  phone: string;
  email: string;
}

export interface AddWorkerPayload {
  // Personal
  fullName: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  // Professional
  profession: string;
  skills: string;
  experienceYears: number;
  hourlyRate: number;
  // Documents
  identityDocumentType: "Aadhaar Card" | "Voter ID" | "Passport" | "Driving License";
  identityDocumentNumber: string;
  professionalCertificate?: string;
  skillCertificate?: string;
}

export interface WorkforceManagementData {
  workers: ManagedWorkerItem[];
  totalCount: number;
  activeCount: number;
  deactivatedCount: number;
  isDevelopmentFallback: boolean;
  dataSourceNotice?: string;
}

// ==========================================
// NEW WORKER REQUESTS (STAGE 5)
// ==========================================
export type WorkerApplicationStatus = "PENDING" | "ACCEPTED" | "REJECTED";

export interface WorkerApplicationDocument {
  name: string;
  category: "IDENTITY" | "TRADE_CERTIFICATE" | "SKILL_CERTIFICATE" | "POLICE_CLEARANCE";
  fileType: string;
  fileSize?: string;
}

export interface WorkerApplicationItem {
  id: string;
  applicantName: string;
  phone: string;
  email: string;
  dateOfBirth: string;
  gender?: string;
  address: string;
  city: string;
  state: string;
  profession: string;
  skills: string[];
  experienceYears: number;
  hourlyRate: number;
  documents: WorkerApplicationDocument[];
  submittedDate: string;
  status: WorkerApplicationStatus;
  rejectionReason?: string;
  reviewedAt?: string;
}

// ==========================================
// WORKER INFORMATION CHANGE REQUESTS (STAGE 5)
// ==========================================
export type ChangeRequestSection =
  | "PROFESSIONAL"
  | "PERSONAL"
  | "SKILLS"
  | "RATES"
  | "CERTIFICATIONS";

export type WorkerChangeRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface WorkerChangeRequestSupportingDoc {
  name: string;
  category: string;
  fileType: string;
  fileSize?: string;
}

export interface WorkerChangeRequestItem {
  id: string;
  workerId: string;
  workerName: string;
  section: ChangeRequestSection;
  field: string;
  currentValue: string;
  requestedValue: string;
  reason: string;
  supportingDocument?: WorkerChangeRequestSupportingDoc;
  submittedDate: string;
  status: WorkerChangeRequestStatus;
  rejectionReason?: string;
  reviewedAt?: string;
}

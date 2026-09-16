import type { WorkerAccountStatus, WorkerAvailabilityStatus } from "@/supabase/types/database.types";

export interface ManagedWorkerItem {
  id: string;
  memberId?: string;
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
  avatarUrl?: string | null;
}

export interface AddWorkerPayload {
  // Personal
  fullName: string;
  dateOfBirth: string;
  gender?: "male" | "female" | "other";
  phone: string;
  email: string;
  password: string;
  memberId?: string;
  avatarUrl?: string;
  address: string;
  city: string;
  state: string;
  pincode?: string;
  federationId?: string;
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
  memberId?: string | null;
  registrationType: "NEW_WORKER" | "EXISTING_WORKER";
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
  previousWorkDetails?: string | null;
  govtIdType?: string;
  govtIdNumber?: string;
  govtIdDocumentUrl?: string | null;
  avatarUrl?: string | null;
  bankName?: string | null;
  bankAccountHolder?: string | null;
  bankAccountNumber?: string | null;
  bankIfscCode?: string | null;
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

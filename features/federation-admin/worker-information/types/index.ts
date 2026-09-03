export type WorkerAccountStatus = "ACTIVE" | "DEACTIVATED";
export type WorkerAvailabilityStatus = "AVAILABLE" | "BUSY" | "UNAVAILABLE";
export type WorkerPerformanceTier = "High" | "Medium" | "Low";

export interface WorkerListItem {
  id: string;
  profileId: string;
  fullName: string;
  avatarUrl?: string | null;
  profession: string;
  area: string;
  city: string;
  state: string;
  accountStatus: WorkerAccountStatus;
  availabilityStatus: WorkerAvailabilityStatus;
  averageRating: number;
  performanceTier: WorkerPerformanceTier;
  totalJobs: number;
  completedJobs: number;
  joiningDate: string;
  hourlyRate: number;
  experienceYears: number;
}

export interface WorkerSkillItem {
  id: string;
  name: string;
  category: string;
  proficiencyLevel: "Beginner" | "Intermediate" | "Advanced" | "Master";
}

export interface WorkerCertificationItem {
  id: string;
  title: string;
  issuingBody: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string | null;
  status: "VERIFIED" | "EXPIRING_SOON" | "EXPIRED";
  isVerified: boolean;
}

export interface WorkerDocumentItem {
  id: string;
  name: string;
  category: "IDENTITY" | "TRADE_CERTIFICATE" | "POLICE_CLEARANCE" | "INSURANCE";
  fileType: string;
  fileSize?: string;
  issueDate?: string;
  status: "VERIFIED" | "PENDING_AUDIT";
  url: string;
}

export interface WorkerPersonalDetails {
  fullName: string;
  workerId: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  joiningDate: string;
}

export interface WorkerProfessionalDetails {
  profession: string;
  tradeCategory: string;
  experienceYears: number;
  hourlyRate: number;
  minimumVisitCharge: number;
  serviceRadiusKm: number;
  skills: WorkerSkillItem[];
}

export interface WorkerPerformanceSummary {
  totalJobs: number;
  runningJobs: number;
  completedJobs: number;
  cancelledJobs: number;
  averageRating: number;
  onTimeArrivalRate: number;
  jobCompletionRate: number;
  performanceTier: WorkerPerformanceTier;
}

export interface WorkerComplaintSummary {
  totalComplaints: number;
  pendingComplaints: number;
  resolvedComplaints: number;
  resolutionRate: number;
}

export interface WorkerFullDetails {
  id: string;
  personal: WorkerPersonalDetails;
  professional: WorkerProfessionalDetails;
  certifications: WorkerCertificationItem[];
  documents: WorkerDocumentItem[];
  performance: WorkerPerformanceSummary;
  complaints: WorkerComplaintSummary;
  accountStatus: WorkerAccountStatus;
  availabilityStatus: WorkerAvailabilityStatus;
}

export interface WorkerFilterState {
  searchQuery: string;
  profession: string;
  area: string;
  performanceTier: string;
}

export interface WorkerInformationData {
  workers: WorkerListItem[];
  totalCount: number;
  professions: string[];
  areas: string[];
  isDevelopmentFallback: boolean;
  dataSourceNotice?: string;
}

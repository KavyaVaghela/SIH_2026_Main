export type WorkerAvailabilityStatus = "AVAILABLE" | "BUSY" | "UNAVAILABLE";
export type WorkerVerificationStatus = "verified" | "pending_verification" | "suspended";
export type WorkerAccountStatus = "ACTIVE" | "DEACTIVATED";

export interface WorkforceStats {
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  inactiveWorkers: number;
  verifiedWorkers: number;
  pendingVerificationWorkers: number;
  underutilizedWorkers: number;
}

export interface WorkerListItem {
  id: string;
  profileId: string;
  fullName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  societyId: string;
  societyName: string;
  profession: string;
  experienceYears: number;
  hourlyRate: number;
  availabilityStatus: WorkerAvailabilityStatus;
  verificationStatus: WorkerVerificationStatus;
  accountStatus: WorkerAccountStatus;
  averageRating: number;
  totalJobs: number;
  completedJobs: number;
  joiningDate: string;
  lastActiveAt?: string | null;
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
  certificateNumber?: string | null;
  issueDate: string;
  expiryDate?: string | null;
  status: "VERIFIED" | "EXPIRING_SOON" | "EXPIRED";
  isVerified: boolean;
}

export interface WorkerBookingItem {
  id: string;
  bookingNumber: string;
  customerName: string;
  serviceTitle: string;
  scheduledStartAt: string;
  totalAmount: number;
  workerEarnings: number;
  status: string;
  createdAt: string;
}

export interface WorkerPerformanceMetrics {
  completionRate: number; // percentage (0-100)
  cancellationRate: number; // percentage (0-100)
  onTimeArrivalRate: number; // percentage (0-100)
  customerRating: number; // 0-5
  totalJobsFulfild: number;
  recentReviews: Array<{ customerName: string; rating: number; comment: string; date: string }>;
}

export interface WorkerWelfareStatus {
  totalContributions: number;
  matchedSubsidies: number;
  fundType: string;
  insurancePolicyNumber?: string | null;
  insuranceProvider?: string | null;
  coverageStatus: "ACTIVE" | "PENDING_RENEWAL" | "NOT_ENROLLED";
  lastTransactionDate?: string | null;
}

export interface WorkerDetails extends WorkerListItem {
  address?: string | null;
  serviceRadiusKm: number;
  currentLatitude?: number | null;
  currentLongitude?: number | null;
}

export interface UnderutilizedWorkerItem extends WorkerListItem {
  jobsInSelectedPeriod: number;
  lastJobDate: string;
  primarySkill: string;
  utilizationScore: number; // 0-100 (lower means underutilized)
}

export type UnderutilizedTimeframe = "7d" | "30d" | "90d";

export interface WorkforceFilterOptions {
  searchQuery: string;
  societyId: string;
  skill: string;
  availability: string;
  verification: string;
  viewMode: "ALL" | "UNDERUTILIZED";
  underutilizedTimeframe: UnderutilizedTimeframe;
  sortBy: "fullName" | "averageRating" | "totalJobs" | "experienceYears" | "joiningDate";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

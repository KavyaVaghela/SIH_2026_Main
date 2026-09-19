export type WelfareCoverageStatus =
  | "ACTIVE"
  | "EXPIRING_SOON"
  | "EXPIRED"
  | "NO_COVERAGE";

export type ProgramCategory =
  | "Pension"
  | "Insurance"
  | "Skill Development"
  | "Health"
  | "Safety"
  | "Social Welfare";

export type AssistanceStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Resolved"
  | "Rejected";

export interface WelfareSummaryStats {
  totalWorkers: number;
  coveredWorkers: number;
  uncoveredWorkers: number;
  expiringSoonCount: number;
  coveragePercentage: number;
}

export interface WorkerWelfareRecord {
  id: string;
  workerId: string;
  workerName: string;
  workerProfession: string;
  workerPhone: string;
  societyId: string;
  societyName: string;
  coverageStatus: WelfareCoverageStatus;
  coverageType: string;
  policyNumber: string | null;
  providerName: string | null;
  coverageAmount: number | null;
  startDate: string | null;
  expiryDate: string | null;
  daysUntilExpiry: number | null;
  fundContributions: number;
  subsidyAmount: number;
  notes: string | null;
  alertReason?: string;
}

export interface WelfareAlert {
  id: string;
  recordId: string;
  workerId: string;
  workerName: string;
  societyName: string;
  type: "EXPIRING_SOON" | "NO_COVERAGE" | "UPDATE_REQUIRED";
  title: string;
  description: string;
  expiryDate?: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
}

export interface WelfareProgramItem {
  id: string;
  name: string;
  category: ProgramCategory;
  federationsCount: number;
  eligibleWorkers: number;
  coveredWorkers: number;
  status: "Active" | "Inactive" | "Under Review";
  description?: string;
  eligibilityCriteria?: string;
  applicableFederations?: string[];
  eligibleWorkerGroups?: string;
  requiredDocuments?: string;
  startDate?: string;
  endDate?: string;
}

export interface FederationCoverageItem {
  id: string;
  name: string;
  coveredWorkers: number;
  totalWorkers: number;
  coveragePercentage: number;
}

export interface TrainingProgramItem {
  id: string;
  name: string;
  category: "Safety" | "Technical" | "Digital" | "Soft Skills";
  enrolledWorkers: number;
  duration?: string;
  instructor?: string;
  status?: "Active" | "Completed" | "Upcoming";
}

export interface TrainingStats {
  activePrograms: number;
  workersEnrolled: number;
  completedTraining: number;
  certificationsIssued: number;
  expiringNext3Months: number;
}

export interface WorkerAssistanceItem {
  id: string;
  workerName: string;
  workerInitials: string;
  federationName: string;
  requestType: "Health Assistance" | "Insurance Support" | "Certification Support" | "Welfare Assistance" | "Emergency Aid";
  submittedAt: string;
  status: AssistanceStatus;
  description?: string;
  requestId?: string;
  assignedReviewer?: string;
  resolutionNotes?: string;
}

export interface AssistanceStats {
  pending: number;
  underReview: number;
  approved: number;
  resolved: number;
}

export interface CategoryCoverageItem {
  category: string;
  percentage: number;
}

export interface SafetySupportStats {
  safetyTrainingsThisMonth: number;
  emergencyAssistanceThisMonth: number;
  welfareRequestsThisMonth: number;
  pendingAssistanceRequiresAction: number;
}

export interface RecentWelfareActivityItem {
  id: string;
  type: "training_created" | "scheme_updated" | "training_published" | "certification_batch" | "review_completed";
  title: string;
  subtitle: string;
  timeAgo: string;
}

export interface WelfareFilterOptions {
  status?: "ALL" | WelfareCoverageStatus;
  society?: string;
  federation?: string;
  category?: string;
  dateRange?: "7_DAYS" | "30_DAYS" | "90_DAYS" | "ALL";
  searchQuery: string;
  page: number;
  pageSize: number;
}

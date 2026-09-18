import type { ComplaintStatus } from "@/supabase/types/database.types";
import type { GrievanceCase, GrievanceLifecycleStatus, GrievancePriority } from "@/types/complaints/v2";

export type ComplaintStatusDisplay = "PENDING" | "RESOLVED" | "UNDER_REVIEW" | "ACTION_REQUIRED" | "ESCALATED" | "REJECTED" | "CLOSED";

export type ComplaintSubsection = "USER_COMPLAINTS" | "WORKER_COMPLAINTS";

export interface SubsectionMetrics {
  total: number;
  pending: number;
  underReview: number;
  waitingForResponse: number;
  resolved: number;
  rejectedOrClosed: number;
}

export interface FederationComplaintItem {
  id: string;
  complaintNumber: string;
  bookingId?: string;
  complainantRole: "CUSTOMER" | "WORKER";
  customerName: string;
  customerPhone: string;
  workerId: string;
  workerName: string;
  workerProfession: string;
  workerResponseStatus: "AWAITING" | "RECEIVED" | "NOT_APPLICABLE";
  workerStatement?: string;
  workerEvidenceUrls?: string[];
  workerSubmittedAt?: string;
  subject: string;
  description: string;
  category: string;
  subcategory?: string;
  submittedDate: string;
  status: ComplaintStatusDisplay;
  rawStatus: ComplaintStatus;
  lifecycleStatus: GrievanceLifecycleStatus;
  priority: GrievancePriority;
  suggestedPriority: GrievancePriority;
  triageReason?: string;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  rejectionReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  closedAt?: string;
  closedBy?: string;
  internalNotes?: string;
  grievanceCase?: GrievanceCase;
}

export interface ComplaintFilterState {
  searchQuery: string;
  statusFilter: string;
  priorityFilter?: string;
  activeSubsection?: ComplaintSubsection;
}

export interface ComplaintManagementData {
  complaints: FederationComplaintItem[];
  userComplaints: FederationComplaintItem[];
  workerComplaints: FederationComplaintItem[];
  userMetrics: SubsectionMetrics;
  workerMetrics: SubsectionMetrics;
  totalCount: number;
  pendingCount: number;
  underReviewCount: number;
  actionRequiredCount: number;
  escalatedCount: number;
  resolvedCount: number;
  highOrCriticalCount: number;
  isDevelopmentFallback: boolean;
  dataSourceNotice?: string;
}

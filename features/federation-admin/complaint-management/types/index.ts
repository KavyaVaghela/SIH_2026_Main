import type { ComplaintStatus } from "@/supabase/types/database.types";
import type { GrievanceCase, GrievanceLifecycleStatus, GrievancePriority } from "@/types/complaints/v2";

export type ComplaintStatusDisplay = "PENDING" | "RESOLVED" | "UNDER_REVIEW" | "ACTION_REQUIRED" | "ESCALATED";

export interface FederationComplaintItem {
  id: string;
  complaintNumber: string;
  bookingId?: string;
  customerName: string;
  customerPhone: string;
  workerId: string;
  workerName: string;
  workerProfession: string;
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
  internalNotes?: string;
  grievanceCase?: GrievanceCase;
}

export interface ComplaintFilterState {
  searchQuery: string;
  statusFilter: string;
  priorityFilter?: string;
}

export interface ComplaintManagementData {
  complaints: FederationComplaintItem[];
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

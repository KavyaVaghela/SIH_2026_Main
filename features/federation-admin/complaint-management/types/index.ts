import type { ComplaintStatus } from "@/supabase/types/database.types";

export type ComplaintStatusDisplay = "PENDING" | "RESOLVED";

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
  submittedDate: string;
  status: ComplaintStatusDisplay;
  rawStatus: ComplaintStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  internalNotes?: string;
}

export interface ComplaintFilterState {
  searchQuery: string;
  statusFilter: ComplaintStatusDisplay | "ALL";
}

export interface ComplaintManagementData {
  complaints: FederationComplaintItem[];
  totalCount: number;
  pendingCount: number;
  resolvedCount: number;
  isDevelopmentFallback: boolean;
  dataSourceNotice?: string;
}

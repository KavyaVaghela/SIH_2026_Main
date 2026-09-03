export type ComplaintStatus = "OPEN" | "IN_REVIEW" | "RESOLVED";

export type ComplaintCategory =
  | "SERVICE_QUALITY"
  | "PAYMENT_ISSUE"
  | "WORKER_BEHAVIOUR"
  | "CUSTOMER_BEHAVIOUR"
  | "SAFETY_ISSUE"
  | "OTHER";

export interface ComplaintStats {
  totalComplaints: number;
  openCount: number;
  inReviewCount: number;
  resolvedCount: number;
}

export interface ComplaintNote {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface ComplaintListItem {
  id: string;
  complaintNumber: string;
  category: ComplaintCategory;
  categoryLabel: string;
  customerName: string;
  customerId: string;
  workerName: string;
  workerId: string | null;
  workerProfession: string;
  societyName: string;
  societyId: string;
  bookingNumber: string | null;
  bookingId: string | null;
  createdAt: string;
  status: ComplaintStatus;
  isSafetyCritical?: boolean;
}

export interface ComplaintDetails extends ComplaintListItem {
  description: string;
  customerEmail: string;
  customerPhone: string;
  workerPhone: string | null;
  bookingServiceTitle: string | null;
  bookingScheduledAt: string | null;
  bookingAmount: number | null;
  assignedTo: string | null;
  resolutionNotes: string | null;
  resolvedAt: string | null;
  resolvedBy: string | null;
  notes: ComplaintNote[];
}

export interface ComplaintFilterOptions {
  status: "ALL" | ComplaintStatus;
  category: "ALL" | ComplaintCategory;
  society: string;
  searchQuery: string;
  page: number;
  pageSize: number;
}

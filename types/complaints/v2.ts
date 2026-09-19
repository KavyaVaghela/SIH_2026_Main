import type { UserRole } from "@/supabase/types/database.types";

export type GrievanceLifecycleStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "ACTION_REQUIRED"
  | "RESOLVED"
  | "REJECTED"
  | "ESCALATED"
  | "CLOSED";

export type GrievancePriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type GrievancePartyRole = "CUSTOMER" | "WORKER" | "FEDERATION_ADMIN" | "SUPER_ADMIN";

export type GrievanceUpdateType =
  | "PUBLIC_UPDATE"
  | "INTERNAL_NOTE"
  | "RESPONSE_REQUEST"
  | "RESPONSE_SUBMISSION"
  | "STATUS_CHANGE"
  | "PRIORITY_CHANGE"
  | "ASSIGNMENT"
  | "RESOLUTION"
  | "ESCALATION";

export interface GrievanceTimelineEvent {
  id: string;
  type: GrievanceUpdateType;
  visibility: "PUBLIC" | "INTERNAL";
  actorId: string;
  actorRole: GrievancePartyRole;
  actorName: string;
  message: string;
  targetParty?: GrievancePartyRole;
  evidenceUrls?: string[];
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface GrievanceAuditEntry {
  id: string;
  complaintId: string;
  actorId: string;
  actorRole: string;
  actorName: string;
  action: string;
  oldValue?: any;
  newValue?: any;
  notes?: string;
  timestamp: string;
}

export interface GrievanceResolution {
  resolutionType:
    | "CONCILIATION"
    | "REPAIR_CORRECTION"
    | "COURTESY_CREDIT_RECOMMENDED"
    | "WARNING_ISSUED"
    | "DISMISSED"
    | "POLICY_CLARIFIED"
    | "OTHER";
  summary: string;
  actionTaken: string;
  compensationReference?: string;
  followUpRequired: boolean;
  resolvedBy: string;
  resolvedByName: string;
  resolvedAt: string;
}

export interface GrievanceEscalation {
  isEscalated: boolean;
  escalatedBy: string;
  escalatedByName?: string;
  escalatedAt: string;
  reason: string;
  superAdminNotes?: string;
  previousStatus: GrievanceLifecycleStatus;
}

export interface GrievanceBookingContext {
  bookingId: string;
  bookingNumber?: string;
  serviceTitle?: string;
  scheduledStartAt?: string;
  bookingStatus?: string;
  systemEstimate?: number;
  workerEstimate?: number;
  finalBill?: number;
  paymentStatus?: string;
  customerName?: string;
  workerName?: string;
}

export interface GrievanceCase {
  id: string;
  complaintNumber: string;
  bookingId?: string | null;
  raisedBy: string;
  raisedByRole: GrievancePartyRole;
  raisedByName: string;
  raisedByPhone?: string;
  targetProfileId?: string | null;
  targetRole?: GrievancePartyRole;
  targetName?: string;
  targetPhone?: string;
  targetWorkerId?: string;
  federationId: string;
  federationName?: string;
  category: string;
  subcategory?: string;
  subject: string;
  description: string;
  additionalInfo?: string;
  priority: GrievancePriority;
  suggestedPriority: GrievancePriority;
  triageReason?: string;
  suggestedQueue?: string;
  status: GrievanceLifecycleStatus;
  assignedOfficerId?: string | null;
  assignedOfficerName?: string | null;
  assignedAt?: string | null;
  evidenceUrls: string[];
  timeline: GrievanceTimelineEvent[];
  internalNotes?: GrievanceTimelineEvent[];
  auditTrail: GrievanceAuditEntry[];
  resolution?: GrievanceResolution | null;
  escalation?: GrievanceEscalation | null;
  bookingContext?: GrievanceBookingContext | null;
  responseRequests?: {
    workerRequired?: boolean;
    workerSubmitted?: boolean;
    workerSubmittedAt?: string;
    customerRequired?: boolean;
    customerSubmitted?: boolean;
    customerSubmittedAt?: string;
    prompt?: string;
    requestedAt?: string;
  } | null;
  rejectionReason?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  closedAt?: string | null;
  closedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGrievancePayload {
  id?: string;
  raisedBy: string;
  raisedByRole?: GrievancePartyRole;
  raisedByName?: string;
  raisedByPhone?: string;
  targetProfileId?: string;
  targetRole?: GrievancePartyRole;
  targetName?: string;
  targetWorkerId?: string;
  bookingId?: string;
  federationId?: string;
  category: string;
  subcategory?: string;
  subject: string;
  description: string;
  desiredOutcome?: string;
  additionalInfo?: string;
  priority?: GrievancePriority;
  evidenceUrls?: string[];
}

export const CUSTOMER_COMPLAINT_CATEGORIES = [
  "Service Quality",
  "Worker Conduct",
  "Pricing Dispute",
  "Payment / Billing Issue",
  "Scheduling / Delay",
  "Property / Service Damage",
  "Safety Concern",
  "Worker No-Show",
  "Other",
] as const;

export const WORKER_COMPLAINT_CATEGORIES = [
  "Customer Misconduct",
  "Unsafe Workplace",
  "Payment Dispute",
  "Harassment / Inappropriate Behaviour",
  "Unfair Cancellation",
  "Rating / Review Dispute",
  "Scheduling Issue",
  "Customer No-Show",
  "Federation Issue",
  "Other",
] as const;

export const FEDERATION_ESCALATION_CATEGORIES = [
  "Platform / Technical Issue",
  "Payment Settlement Issue",
  "Policy Dispute",
  "Infrastructure Issue",
  "Data Issue",
  "Customer Escalation",
  "Worker Escalation",
  "Federation Account Issue",
  "Other",
] as const;

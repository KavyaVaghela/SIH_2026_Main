/**
 * Domain types and contracts for the Worker Dashboard foundation and job management.
 */

import type { BookingStatus, WorkerAvailabilityStatus } from "@/supabase/types/database.types";
import type { Booking } from "@/features/bookings/services/booking-service";

export interface WorkerIdentity {
  name: string;
  trade: string;
  cooperativeName: string;
  cooperativeRole: string;
  federationName: string;
  location: string;
  rating: number;
  reviewsCount: number;
  isVerified: boolean;
  avatarUrl?: string;
}

export interface WorkerOverviewStats {
  todaysJobs: number;
  todaysEarnings: number;
  overallRating: number;
  completedJobs: number;
}

export interface WorkerJobItem {
  id: string;
  bookingNumber: string;
  serviceTitle: string;
  categoryName: string;
  customerName: string;
  customerPhone?: string;
  customerArea: string;
  distanceKm: number;
  scheduledDate: string;
  scheduledTime: string;
  scheduledStartAt: string;
  scheduledEndAt?: string;
  problemDescription: string;
  problemPhotoUrl?: string | null;
  totalAmount: number; // Platform initial estimate
  estimatedPayout?: number; // Alias for backward compatibility
  workerEarnings: number;
  status: BookingStatus;
  urgency: "EMERGENCY" | "STANDARD";
  cooperativeName: string;
  timeSlot?: string;
  description?: string;
  cooperativeSociety?: string;
  createdAt?: string;
  otpCode?: string | null;
  rawBooking?: Booking;

  // Real Worker Estimate Fields (Task 4)
  workerEstimateAmount?: number | null;
  workerEstimateLabor?: number | null;
  workerEstimateMaterials?: number | null;
  workerEstimateNotes?: string | null;
  workerEstimateSubmittedAt?: string | null;
  minimumVisitCharge?: number;

  // Real Service Execution Fields (Task 6)
  workNotes?: string | null;
  materialsUsed?: string[] | null;
  beforePhotoUrl?: string | null;
  afterPhotoUrl?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;

  // Real Billing & Payment Fields (Task 7)
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceTotal?: number | null;
  paymentStatus?: string | null;
  paymentId?: string | null;
}

export interface WorkerBillItemPayload {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface GenerateServiceBillPayload {
  bookingId: string;
  workerId: string;
  items: WorkerBillItemPayload[];
}

export interface WorkerEstimateSubmissionPayload {
  bookingId: string;
  workerId: string;
  laborAmount: number;
  materialAmount?: number;
  additionalCharges?: number;
  notes?: string;
}

export type JobRequestFilterOption =
  | "ALL"
  | "NEW"
  | "REVIEWING"
  | "INTERESTED"
  | "TODAY"
  | "EMERGENCY"
  | "PLUMBING"
  | "ELECTRICAL";
export type ScheduleViewMode = "TODAY" | "UPCOMING" | "ALL";

export interface BookingStatusHistoryItem {
  id: string;
  bookingId: string;
  previousStatus?: BookingStatus | null;
  newStatus: BookingStatus;
  changedById?: string | null;
  notes?: string | null;
  createdAt: string;
}

// Backward compatibility types for foundation components
export type WorkerJobRequest = WorkerJobItem;

export interface WorkerScheduleItem {
  id: string;
  time: string;
  serviceTitle: string;
  status: "Upcoming" | "Confirmed" | "Completed";
  customerName?: string;
  customerArea: string;
  estimatedDuration: string;
  notes?: string;
  jobId?: string;
}

export interface WorkerProfileDetails {
  name: string;
  trade: string;
  rating: number;
  reviewsCount: number;
  experienceYears: number;
  cooperativeName: string;
  cooperativeId: string;
  federationName: string;
  location: string;
  phone: string;
  languages: string[];
  skills: string[];
  verifications: {
    identity: boolean;
    phone: boolean;
    worker: boolean;
    skill: boolean;
  };
  hourlyRate: number;
  bio?: string;
}

export interface WorkerEarningsSummary {
  todaysEarnings: number;
  thisWeekEarnings: number;
  thisMonthEarnings: number;
  completedJobsCount: number;
  bankName: string;
  accountEnding: string;
  ifscPrefix: string;
  nextPayoutTime: string;
}

export interface WorkerEarningsRecord {
  id: string;
  bookingNumber: string;
  serviceTitle: string;
  date: string;
  time: string;
  customerArea: string;
  grossAmount: number;
  welfareCess: number;
  netPayout: number;
  status: "Transferred" | "Pending Settlement";
  referenceId: string;
}

export interface WorkerCertificationItem {
  id: string;
  title: string;
  status: "Verified" | "Completed" | "Expiring Soon";
  validityText: string;
  issuedBy: string;
  certCode?: string;
}

export interface WorkerWelfareDetails {
  insuranceStatus: "Active" | "Inactive";
  policyNumber: string;
  providerName: string;
  coverageAmount: number;
  welfareSchemeStatus: "Enrolled" | "Pending";
  emergencyAssistanceStatus: "Eligible" | "Not Eligible";
  benefits: Array<{
    title: string;
    description: string;
  }>;
  certifications: WorkerCertificationItem[];
  expiringWarning?: {
    certName: string;
    daysRemaining: number;
  };
}

/**
 * Human-readable mapping for canonical booking states
 */
export const CANONICAL_STATUS_LABELS: Record<BookingStatus, string> = {
  REQUEST_SENT: "Request Sent",
  WORKER_REVIEWING: "Under Review",
  WORKER_INTERESTED: "Interested",
  CUSTOMER_CONFIRMATION_PENDING: "Confirmation Pending",
  BOOKING_CONFIRMED: "Booking Confirmed",
  WORKER_ACCEPTED: "Accepted",
  ON_THE_WAY: "On the Way",
  ARRIVED: "Arrived",
  OTP_VERIFIED: "OTP Verified",
  SERVICE_STARTED: "Service Started",
  SERVICE_COMPLETED: "Service Completed",
  BILL_GENERATED: "Bill Generated",
  PAYMENT_PENDING: "Payment Pending",
  PAYMENT_RECEIVED: "Payment Received",
  BOOKING_COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

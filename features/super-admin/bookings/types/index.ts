import type { BookingStatus } from "@/types/bookings";
import type { PaymentStatus } from "@/types/payments";

export type { BookingStatus, PaymentStatus };

export type BookingLifecycleStage =
  | "PENDING"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface BookingStats {
  newRequests: number;
  pendingBookings: number;
  acceptedBookings: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  totalBookings: number;
}

export interface BookingListItem {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  workerId?: string | null;
  workerName?: string | null;
  workerProfession?: string | null;
  workerPhone?: string | null;
  societyId: string;
  societyName: string;
  serviceId: string;
  serviceTitle: string;
  serviceCategory: string;
  location: string;
  addressDetails?: string;
  scheduledStartAt: string;
  scheduledEndAt: string;
  bookingDate: string;
  totalAmount: number;
  platformFee: number;
  workerEarnings: number;
  status: BookingStatus;
  lifecycleStage: BookingLifecycleStage;
  paymentStatus: PaymentStatus;
}

export interface BookingDetails extends BookingListItem {
  problemDescription?: string | null;
  problemPhotoUrl?: string | null;
  otpCode?: string | null;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  paymentDetails?: {
    paymentNumber?: string;
    gatewayProvider?: string;
    gatewayPaymentId?: string | null;
    paidAt?: string | null;
    invoiceNumber?: string | null;
  };
}

export interface BookingTimelineItem {
  id: string;
  bookingId: string;
  previousStatus?: BookingStatus | null;
  newStatus: BookingStatus;
  stage: BookingLifecycleStage;
  title: string;
  description: string;
  changedBy?: string | null;
  createdAt: string;
}

export type BookingDateFilter = "all" | "today" | "7d" | "30d";

export interface BookingFilterOptions {
  searchQuery: string;
  dateRange: BookingDateFilter;
  status: string;
  service: string;
  society: string;
  location: string;
  sortBy: "scheduledStartAt" | "totalAmount" | "bookingNumber" | "status" | "createdAt";
  sortOrder: "asc" | "desc";
  page: number;
  pageSize: number;
}

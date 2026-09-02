import type { Profile } from "../auth";
import type { Worker } from "../worker";
import type { Service } from "../services";
import type { Federation } from "../federation";
import type { Address } from "../common";

export type BookingStatus =
  | "REQUEST_SENT"
  | "WORKER_REVIEWING"
  | "WORKER_INTERESTED"
  | "CUSTOMER_CONFIRMATION_PENDING"
  | "BOOKING_CONFIRMED"
  | "WORKER_ACCEPTED"
  | "ON_THE_WAY"
  | "ARRIVED"
  | "OTP_VERIFIED"
  | "SERVICE_STARTED"
  | "SERVICE_COMPLETED"
  | "BILL_GENERATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_RECEIVED"
  | "BOOKING_COMPLETED"
  | "CANCELLED";

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  customer?: Profile;
  workerId?: string | null;
  worker?: Worker;
  serviceId: string;
  service?: Service;
  federationId: string;
  federation?: Federation;
  addressId: string;
  address?: Address;
  status: BookingStatus;
  scheduledStartAt: string;
  scheduledEndAt: string;
  actualStartAt?: string | null;
  actualEndAt?: string | null;
  totalAmount: number;
  platformFee: number;
  workerEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingStatusHistory {
  id: string;
  bookingId: string;
  previousStatus?: BookingStatus | null;
  newStatus: BookingStatus;
  changedById?: string | null;
  changedBy?: Profile;
  notes?: string | null;
  createdAt: string;
}

export interface JobRequest {
  id: string;
  customerId: string;
  customer?: Profile;
  serviceId: string;
  service?: Service;
  description: string;
  preferredSchedule?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerEstimate {
  id: string;
  jobRequestId: string;
  workerId: string;
  worker?: Worker;
  estimatedAmount: number;
  estimatedHours?: number | null;
  notes?: string | null;
  status: string;
  createdAt: string;
}

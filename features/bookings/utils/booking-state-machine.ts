import type { BookingStatus, UserRole } from "../../../supabase/types/database.types";
import { AppError } from "../../../lib/errors";

/**
 * CANONICAL BOOKING STATE MACHINE & TRANSITION MAP
 * 
 * 16 Exact States:
 * REQUEST_SENT -> WORKER_REVIEWING -> WORKER_INTERESTED -> CUSTOMER_CONFIRMATION_PENDING
 * -> BOOKING_CONFIRMED -> WORKER_ACCEPTED -> ON_THE_WAY -> ARRIVED -> OTP_VERIFIED
 * -> SERVICE_STARTED -> SERVICE_COMPLETED -> BILL_GENERATED -> PAYMENT_PENDING
 * -> PAYMENT_RECEIVED -> BOOKING_COMPLETED
 * (CANCELLED is a valid transition before SERVICE_STARTED)
 */

export const ALLOWED_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  REQUEST_SENT: ["WORKER_REVIEWING", "CANCELLED"],
  WORKER_REVIEWING: ["WORKER_INTERESTED", "CANCELLED"],
  WORKER_INTERESTED: ["CUSTOMER_CONFIRMATION_PENDING", "CANCELLED"],
  CUSTOMER_CONFIRMATION_PENDING: ["BOOKING_CONFIRMED", "CANCELLED"],
  BOOKING_CONFIRMED: ["WORKER_ACCEPTED", "CANCELLED"],
  WORKER_ACCEPTED: ["ON_THE_WAY", "CANCELLED"],
  ON_THE_WAY: ["ARRIVED", "CANCELLED"],
  ARRIVED: ["OTP_VERIFIED", "CANCELLED"],
  OTP_VERIFIED: ["SERVICE_STARTED", "CANCELLED"],
  SERVICE_STARTED: ["SERVICE_COMPLETED", "CANCELLED"],
  SERVICE_COMPLETED: ["BILL_GENERATED"],
  BILL_GENERATED: ["PAYMENT_PENDING"],
  PAYMENT_PENDING: ["PAYMENT_RECEIVED"],
  PAYMENT_RECEIVED: ["BOOKING_COMPLETED"],
  BOOKING_COMPLETED: [], // Terminal state
  CANCELLED: [],         // Terminal state
};

/**
 * ACTOR PERMISSION MATRIX FOR STATUS TRANSITIONS
 */
export const ROLE_TRANSITION_PERMISSIONS: Record<BookingStatus, UserRole[]> = {
  REQUEST_SENT: ["CUSTOMER", "SUPER_ADMIN"],
  WORKER_REVIEWING: ["WORKER", "SUPER_ADMIN"],
  WORKER_INTERESTED: ["WORKER", "SUPER_ADMIN"],
  CUSTOMER_CONFIRMATION_PENDING: ["CUSTOMER", "SUPER_ADMIN"],
  BOOKING_CONFIRMED: ["CUSTOMER", "SUPER_ADMIN"],
  WORKER_ACCEPTED: ["WORKER", "FEDERATION_ADMIN", "SUPER_ADMIN"],
  ON_THE_WAY: ["WORKER", "SUPER_ADMIN"],
  ARRIVED: ["WORKER", "SUPER_ADMIN"],
  OTP_VERIFIED: ["WORKER", "CUSTOMER", "SUPER_ADMIN"],
  SERVICE_STARTED: ["WORKER", "SUPER_ADMIN"],
  SERVICE_COMPLETED: ["WORKER", "SUPER_ADMIN"],
  BILL_GENERATED: ["WORKER", "SUPER_ADMIN"],
  PAYMENT_PENDING: ["CUSTOMER", "SYSTEM" as any, "SUPER_ADMIN"],
  PAYMENT_RECEIVED: ["SYSTEM" as any, "SUPER_ADMIN"],
  BOOKING_COMPLETED: ["SYSTEM" as any, "SUPER_ADMIN"],
  CANCELLED: ["CUSTOMER", "WORKER", "FEDERATION_ADMIN", "SUPER_ADMIN"],
};

/**
 * Validates whether a transition from currentStatus to newStatus is valid for the given actor role.
 */
export function validateBookingTransition(
  currentStatus: BookingStatus,
  newStatus: BookingStatus,
  actorRole: UserRole
): boolean {
  // 1. Terminal check
  if (currentStatus === "BOOKING_COMPLETED" || currentStatus === "CANCELLED") {
    throw new AppError(
      `Cannot transition from terminal state ${currentStatus}`,
      "INVALID_STATE_TRANSITION",
      400
    );
  }

  // 2. Transition map check
  const allowedNext = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(newStatus)) {
    throw new AppError(
      `Invalid booking transition from ${currentStatus} to ${newStatus}`,
      "INVALID_STATE_TRANSITION",
      400
    );
  }

  // 3. Actor permission check
  const allowedRoles = ROLE_TRANSITION_PERMISSIONS[newStatus] || [];
  if (!allowedRoles.includes(actorRole) && actorRole !== "SUPER_ADMIN") {
    throw new AppError(
      `Role ${actorRole} is forbidden from transitioning booking to ${newStatus}`,
      "FORBIDDEN",
      403
    );
  }

  return true;
}

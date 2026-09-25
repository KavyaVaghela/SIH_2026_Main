import type { SupportedLocale } from "./config";
import type { TranslationParams } from "./language-context";

export type TranslationFn = (
  keyPath: string,
  paramsOrFallback?: string | TranslationParams,
  fallback?: string
) => string;

/**
 * Maps raw backend/database status enums to user-facing localized strings.
 * Preserves the exact enum value internally while displaying natural localized labels.
 */
export function getTranslatedStatus(
  status: string | null | undefined,
  t: TranslationFn
): string {
  if (!status) return "";
  const normalized = status.trim().toUpperCase();

  switch (normalized) {
    // Canonical Booking Statuses
    case "REQUEST_SENT":
      return t("status.REQUEST_SENT", "Request Sent");
    case "WORKER_REVIEWING":
      return t("status.WORKER_REVIEWING", "Worker Reviewing");
    case "WORKER_INTERESTED":
      return t("status.WORKER_INTERESTED", "Worker Interested");
    case "CUSTOMER_CONFIRMATION_PENDING":
      return t("status.CUSTOMER_CONFIRMATION_PENDING", "Confirmation Pending");
    case "BOOKING_CONFIRMED":
      return t("status.BOOKING_CONFIRMED", "Booking Confirmed");
    case "WORKER_ACCEPTED":
      return t("status.WORKER_ACCEPTED", "Worker Accepted");
    case "ON_THE_WAY":
      return t("status.ON_THE_WAY", "On The Way");
    case "ARRIVED":
      return t("status.ARRIVED", "Arrived On-Site");
    case "OTP_VERIFIED":
      return t("status.OTP_VERIFIED", "OTP Verified");
    case "SERVICE_STARTED":
      return t("status.SERVICE_STARTED", "Service Started");
    case "SERVICE_COMPLETED":
      return t("status.SERVICE_COMPLETED", "Service Completed");
    case "BILL_GENERATED":
      return t("status.BILL_GENERATED", "Bill Generated");
    case "PAYMENT_PENDING":
      return t("status.PAYMENT_PENDING", "Payment Pending");
    case "PAYMENT_RECEIVED":
      return t("status.PAYMENT_RECEIVED", "Payment Received");
    case "BOOKING_COMPLETED":
      return t("status.BOOKING_COMPLETED", "Booking Completed");
    case "CANCELLED":
      return t("status.CANCELLED", "Cancelled");

    // Payment States
    case "PAID":
      return t("status.payment.PAID", "Paid");
    case "PENDING":
      return t("status.payment.PENDING", "Pending");
    case "FAILED":
      return t("status.payment.FAILED", "Failed");
    case "REFUNDED":
      return t("status.payment.REFUNDED", "Refunded");

    // Worker Availability States
    case "AVAILABLE":
      return t("status.worker.AVAILABLE", "Available");
    case "BUSY":
      return t("status.worker.BUSY", "Busy on Job");
    case "OFFLINE":
      return t("status.worker.OFFLINE", "Offline");

    default:
      // Return humanized fallback if not explicitly matched
      return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

import type { PaymentStatus } from "../../../supabase/types/database.types";
import { bookingService } from "../../bookings/services/booking-service";
import { invoiceService } from "../../invoices/services/invoice-service";
import { workerService } from "../../workforce/services/worker-service";
import { notificationService } from "../../notifications/services/notification-service";

export interface PaymentRecord {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  bookingId: string;
  customerId: string;
  amount: number;
  gatewayProvider: string;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt: string;
}

export interface CreatePaymentPayload {
  invoiceId: string;
  bookingId: string;
  customerId: string;
  amount: number;
  gatewayProvider?: string;
}

export interface IPaymentService {
  createPaymentRecord(payload: CreatePaymentPayload): Promise<PaymentRecord>;
  getPayment(paymentId: string): Promise<PaymentRecord | null>;
  getBookingPayment(bookingId: string): Promise<PaymentRecord | null>;
  processMockPayment(paymentId: string, simulateSuccess: boolean): Promise<PaymentRecord>;
  refundPayment(paymentId: string, reason?: string): Promise<PaymentRecord>;
}

const LOCAL_STORAGE_PAYMENTS_KEY = "kaushalyasetu_payments_db";

export class PaymentService implements IPaymentService {
  private mockPayments: Map<string, PaymentRecord> = new Map();

  constructor() {
    this.syncFromStorage();
  }

  private syncFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY);
      if (stored) {
        const parsed: PaymentRecord[] = JSON.parse(stored);
        parsed.forEach((pay) => this.mockPayments.set(pay.id, pay));
      }
    } catch (err) {
      console.error("Error reading payments from localStorage", err);
    }
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      const array = Array.from(this.mockPayments.values());
      localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(array));
    } catch (err) {
      console.error("Error writing payments to localStorage", err);
    }
  }

  async createPaymentRecord(payload: CreatePaymentPayload): Promise<PaymentRecord> {
    this.syncFromStorage();

    // Check existing payment for booking
    const existing = Array.from(this.mockPayments.values()).find((p) => p.bookingId === payload.bookingId);
    if (existing) {
      return existing;
    }

    const paymentId = `pay-${Date.now()}`;
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;

    const record: PaymentRecord = {
      id: paymentId,
      paymentNumber,
      invoiceId: payload.invoiceId,
      bookingId: payload.bookingId,
      customerId: payload.customerId,
      amount: payload.amount,
      gatewayProvider: payload.gatewayProvider || "mock_razorpay",
      gatewayOrderId: `order_mock_${Date.now()}`,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    this.mockPayments.set(paymentId, record);
    this.saveToStorage();
    return record;
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    this.syncFromStorage();
    return this.mockPayments.get(paymentId) || null;
  }

  async getBookingPayment(bookingId: string): Promise<PaymentRecord | null> {
    this.syncFromStorage();
    return Array.from(this.mockPayments.values()).find((p) => p.bookingId === bookingId) || null;
  }

  async processMockPayment(paymentId: string, simulateSuccess: boolean): Promise<PaymentRecord> {
    this.syncFromStorage();
    const payment = await this.getPayment(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    if (!simulateSuccess) {
      const failedPayment: PaymentRecord = {
        ...payment,
        status: "FAILED",
      };
      this.mockPayments.set(paymentId, failedPayment);
      this.saveToStorage();

      await notificationService.sendNotification({
        profileId: payment.customerId,
        title: "Payment Failed",
        message: `Payment ${payment.paymentNumber} failed. Please try again.`,
        type: "error",
      });

      return failedPayment;
    }

    // SUCCESSFUL PAYMENT WORKFLOW (Centralized Atomic Execution)
    const paidAt = new Date().toISOString();
    const paidPayment: PaymentRecord = {
      ...payment,
      status: "PAID",
      gatewayPaymentId: `pay_mock_${Date.now()}`,
      paidAt,
    };
    this.mockPayments.set(paymentId, paidPayment);
    this.saveToStorage();

    // 1. Mark invoice as paid
    try {
      await invoiceService.updateStatus(payment.invoiceId, "paid");
    } catch (err) {
      console.error("Error updating invoice status to paid", err);
    }

    // 2. Transition Booking: PAYMENT_PENDING -> PAYMENT_RECEIVED -> BOOKING_COMPLETED
    const booking = await bookingService.getBooking(payment.bookingId);
    if (booking) {
      try {
        if (booking.status === "PAYMENT_PENDING") {
          await bookingService.transitionStatus(payment.bookingId, "PAYMENT_RECEIVED", "SYSTEM", "SUPER_ADMIN", "Payment confirmed");
        }
        await bookingService.transitionStatus(payment.bookingId, "BOOKING_COMPLETED", "SYSTEM", "SUPER_ADMIN", "Workflow complete");
      } catch (err) {
        console.error("Error transitioning booking to completed", err);
      }

      // 3. Reset Worker Availability to AVAILABLE ONLY AFTER BOOKING_COMPLETED
      if (booking.workerId) {
        await workerService.updateAvailability(booking.workerId, "AVAILABLE");
      }
    }

    // 4. Notify Customer & Worker
    await notificationService.sendNotification({
      profileId: payment.customerId,
      title: "Payment Successful",
      message: `Your payment of ₹${payment.amount} has been received. Booking is now complete.`,
      type: "success",
    });

    return paidPayment;
  }

  async refundPayment(paymentId: string, reason?: string): Promise<PaymentRecord> {
    this.syncFromStorage();
    const payment = await this.getPayment(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const refunded: PaymentRecord = {
      ...payment,
      status: "REFUNDED",
    };

    this.mockPayments.set(paymentId, refunded);
    this.saveToStorage();

    await notificationService.sendNotification({
      profileId: payment.customerId,
      title: "Payment Refunded",
      message: `Payment ${payment.paymentNumber} has been refunded. Reason: ${reason || "User requested"}`,
      type: "info",
    });

    return refunded;
  }
}

export const paymentService = new PaymentService();

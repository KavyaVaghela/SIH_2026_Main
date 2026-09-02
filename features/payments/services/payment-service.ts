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
  processMockPayment(paymentId: string, simulateSuccess: boolean): Promise<PaymentRecord>;
  refundPayment(paymentId: string, reason?: string): Promise<PaymentRecord>;
}

export class PaymentService implements IPaymentService {
  private mockPayments: Map<string, PaymentRecord> = new Map();

  async createPaymentRecord(payload: CreatePaymentPayload): Promise<PaymentRecord> {
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
    return record;
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    return this.mockPayments.get(paymentId) || null;
  }

  async processMockPayment(paymentId: string, simulateSuccess: boolean): Promise<PaymentRecord> {
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

    // 1. Mark invoice as paid
    try {
      await invoiceService.updateStatus(payment.invoiceId, "paid");
    } catch {
      // Ignored for isolated mocks
    }

    // 2. Transition Booking: PAYMENT_PENDING -> PAYMENT_RECEIVED -> BOOKING_COMPLETED
    const booking = await bookingService.getBooking(payment.bookingId);
    if (booking) {
      try {
        await bookingService.transitionStatus(payment.bookingId, "PAYMENT_RECEIVED", "SYSTEM", "SUPER_ADMIN", "Payment confirmed");
        await bookingService.transitionStatus(payment.bookingId, "BOOKING_COMPLETED", "SYSTEM", "SUPER_ADMIN", "Workflow complete");
      } catch {
        // Fallback for mocked states
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
    const payment = await this.getPayment(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const refunded: PaymentRecord = {
      ...payment,
      status: "REFUNDED",
    };

    this.mockPayments.set(paymentId, refunded);

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

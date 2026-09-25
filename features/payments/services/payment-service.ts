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

async function getSupabase() {
  if (typeof window === "undefined") {
    try {
      const { createAdminClient } = await import("@/lib/supabase/admin");
      return createAdminClient();
    } catch {
      // ignore
    }
  }
  const { createClient } = await import("@/lib/supabase/client");
  return createClient();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbPayment(data: any): PaymentRecord {
  return {
    id: data.id,
    paymentNumber: data.payment_number,
    invoiceId: data.invoice_id,
    bookingId: data.booking_id,
    customerId: data.customer_id,
    amount: Number(data.amount),
    gatewayProvider: data.gateway_provider,
    gatewayOrderId: data.gateway_order_id,
    gatewayPaymentId: data.gateway_payment_id,
    status: data.status,
    paidAt: data.paid_at,
    createdAt: data.created_at,
  };
}

export class PaymentService implements IPaymentService {
  private mockPayments: Map<string, PaymentRecord> = new Map();

  constructor() {}

  async createPaymentRecord(payload: CreatePaymentPayload): Promise<PaymentRecord> {
    const existing = Array.from(this.mockPayments.values()).find((p) => p.bookingId === payload.bookingId);
    if (existing) {
      if (existing.status === "PENDING" && payload.amount && existing.amount !== payload.amount) {
        existing.amount = payload.amount;
        if (payload.invoiceId) existing.invoiceId = payload.invoiceId;
      }
      return existing;
    }

    const isUuid = (str?: string | null) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    // Check existing in DB to prevent duplicates on double-click
    try {
      const supabase = await getSupabase();
      if (isUuid(payload.bookingId)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingDb } = await (supabase.from("payments") as any)
          .select("*")
          .eq("booking_id", payload.bookingId)
          .maybeSingle();

        if (existingDb) {
          const mapped = mapDbPayment(existingDb);
          if (mapped.status === "PENDING" && payload.amount && Number(mapped.amount) !== Number(payload.amount)) {
            await (supabase.from("payments") as any)
              .update({
                amount: payload.amount,
                invoice_id: isUuid(payload.invoiceId) ? payload.invoiceId : mapped.invoiceId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", mapped.id);
            mapped.amount = payload.amount;
            if (payload.invoiceId) mapped.invoiceId = payload.invoiceId;
          }
          this.mockPayments.set(mapped.id, mapped);
          this.mockPayments.set(mapped.bookingId, mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn("Check existing payment notice:", err);
    }

    // 1. Try server-side API endpoint with full admin privileges & RLS bypass in browser
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", ...payload }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.payment) {
            this.mockPayments.set(json.payment.id, json.payment);
            this.mockPayments.set(json.payment.bookingId, json.payment);
            return json.payment;
          }
        }
      }
    } catch (err) {
      console.warn("API /api/payments call notice:", err);
    }

    const paymentId = `pay-${Date.now()}`;
    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;
    const gatewayOrderId = `order_mock_${Date.now()}`;

    let dbRecord: PaymentRecord | null = null;
    try {
      const supabase = await getSupabase();
      const targetCustomerId = isUuid(payload.customerId) ? payload.customerId : "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("payments") as any)
        .insert({
          payment_number: paymentNumber,
          invoice_id: isUuid(payload.invoiceId) ? payload.invoiceId : null,
          booking_id: isUuid(payload.bookingId) ? payload.bookingId : null,
          customer_id: targetCustomerId,
          amount: payload.amount,
          gateway_provider: payload.gatewayProvider || "mock_razorpay",
          gateway_order_id: gatewayOrderId,
          status: "PENDING",
        })
        .select()
        .single();

      if (!error && data) {
        dbRecord = mapDbPayment(data);
      }
    } catch (err) {
      console.warn("DB createPaymentRecord insert notice:", err);
    }

    const record: PaymentRecord = dbRecord || {
      id: paymentId,
      paymentNumber,
      invoiceId: payload.invoiceId,
      bookingId: payload.bookingId,
      customerId: payload.customerId,
      amount: payload.amount,
      gatewayProvider: payload.gatewayProvider || "mock_razorpay",
      gatewayOrderId,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    this.mockPayments.set(record.id, record);
    this.mockPayments.set(record.bookingId, record);
    return record;
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    try {
      const supabase = await getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("payments") as any)
        .select("*")
        .eq("id", paymentId)
        .maybeSingle();

      if (!error && data) {
        const mapped = mapDbPayment(data);
        this.mockPayments.set(paymentId, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("DB getPayment query notice:", err);
    }
    return this.mockPayments.get(paymentId) || null;
  }

  async getBookingPayment(bookingId: string): Promise<PaymentRecord | null> {
    try {
      const supabase = await getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("payments") as any)
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (!error && data) {
        const mapped = mapDbPayment(data);
        this.mockPayments.set(mapped.id, mapped);
        this.mockPayments.set(bookingId, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("DB getBookingPayment query notice:", err);
    }
    return Array.from(this.mockPayments.values()).find((p) => p.bookingId === bookingId) || null;
  }

  async processMockPayment(paymentId: string, simulateSuccess: boolean): Promise<PaymentRecord> {
    const payment = await this.getPayment(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    // Double payment protection: if already PAID, return immediately
    if (payment.status === "PAID") {
      return payment;
    }

    // 1. Try server-side API endpoint with admin privileges & RLS bypass in browser
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "process", paymentId, simulateSuccess }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.payment) {
            this.mockPayments.set(json.payment.id, json.payment);
            this.mockPayments.set(json.payment.bookingId, json.payment);
            if (simulateSuccess) {
              await notificationService.sendNotification({
                profileId: payment.customerId,
                title: "Payment Successful",
                message: `Your payment of ₹${payment.amount} has been received. Booking is now complete.`,
                type: "success",
              });
            }
            return json.payment;
          }
        }
      }
    } catch (err) {
      console.warn("API /api/payments process notice:", err);
    }

    const supabase = await getSupabase();

    if (!simulateSuccess) {
      const failedPayment: PaymentRecord = {
        ...payment,
        status: "FAILED",
      };

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("payments") as any)
          .update({ status: "FAILED" })
          .eq("id", paymentId);
      } catch (err) {
        console.warn("DB processMockPayment failure update notice:", err);
      }

      this.mockPayments.set(paymentId, failedPayment);
      if (payment.bookingId) this.mockPayments.set(payment.bookingId, failedPayment);

      await notificationService.sendNotification({
        profileId: payment.customerId,
        title: "Payment Failed",
        message: `Payment ${payment.paymentNumber} failed. Please try again.`,
        type: "error",
      });

      return failedPayment;
    }

    // SUCCESSFUL PAYMENT WORKFLOW with atomic condition to prevent race conditions
    const paidAt = new Date().toISOString();
    const gatewayPaymentId = `pay_mock_${Date.now()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updatedDb: any = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("payments") as any)
        .update({
          status: "PAID",
          gateway_payment_id: gatewayPaymentId,
          paid_at: paidAt,
        })
        .eq("id", paymentId)
        .neq("status", "PAID")
        .select()
        .maybeSingle();

      if (!error && data) {
        updatedDb = data;
      }
    } catch (err) {
      console.warn("DB processMockPayment success update notice:", err);
    }

    // If update returned nothing and row is already paid in DB, avoid duplicate transitions
    if (!updatedDb) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingDb } = await (supabase.from("payments") as any)
        .select("*")
        .eq("id", paymentId)
        .maybeSingle();

      if (existingDb?.status === "PAID") {
        const alreadyPaid = mapDbPayment(existingDb);
        this.mockPayments.set(paymentId, alreadyPaid);
        if (alreadyPaid.bookingId) this.mockPayments.set(alreadyPaid.bookingId, alreadyPaid);
        return alreadyPaid;
      }
    }

    const paidPayment: PaymentRecord = {
      ...payment,
      status: "PAID",
      gatewayPaymentId: updatedDb?.gateway_payment_id || gatewayPaymentId,
      paidAt: updatedDb?.paid_at || paidAt,
    };

    this.mockPayments.set(paymentId, paidPayment);
    if (payment.bookingId) this.mockPayments.set(payment.bookingId, paidPayment);

    // 1. Mark invoice as paid
    try {
      if (payment.invoiceId) {
        await invoiceService.updateStatus(payment.invoiceId, "paid");
      }
    } catch (err) {
      console.error("Error updating invoice status to paid", err);
    }

    // 2. Transition Booking: PAYMENT_PENDING -> PAYMENT_RECEIVED -> BOOKING_COMPLETED
    const booking = await bookingService.getBooking(payment.bookingId);
    if (booking) {
      try {
        if (booking.status === "PAYMENT_PENDING" || booking.status === "BILL_GENERATED" || booking.status === "SERVICE_COMPLETED") {
          await bookingService.transitionStatus(payment.bookingId, "PAYMENT_RECEIVED", "SYSTEM", "SUPER_ADMIN", "Payment confirmed");
        }
        await bookingService.transitionStatus(payment.bookingId, "BOOKING_COMPLETED", "SYSTEM", "SUPER_ADMIN", "Workflow complete");
      } catch (err) {
        console.error("Error transitioning booking to completed", err);
      }

      if (booking.workerId) {
        await workerService.updateAvailability(booking.workerId, "AVAILABLE");
      }
    }

    // 3. Notify Customer & Worker
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

    try {
      const supabase = await getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("payments") as any)
        .update({ status: "REFUNDED" })
        .eq("id", paymentId);
    } catch (err) {
      console.warn("DB refundPayment update notice:", err);
    }

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

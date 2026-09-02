import type { Profile } from "../auth";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface Payment {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  bookingId: string;
  customerId: string;
  customer?: Profile;
  amount: number;
  gatewayProvider: string;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt: string;
}

import type { Profile } from "../auth";
import type { Federation } from "../federation";

export type InvoiceStatus = "draft" | "issued" | "paid" | "cancelled" | "overdue";

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  customerId: string;
  customer?: Profile;
  federationId: string;
  federation?: Federation;
  items?: InvoiceItem[];
  subtotal: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

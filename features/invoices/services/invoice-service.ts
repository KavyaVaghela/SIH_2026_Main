import type { InvoiceStatus } from "../../../supabase/types/database.types";

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
  federationId: string;
  subtotal: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidAt?: string | null;
  items: InvoiceItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoicePayload {
  bookingId: string;
  customerId: string;
  federationId: string;
  items: Array<{ description: string; quantity: number; unitPrice: number }>;
  discountAmount?: number;
}

export interface IInvoiceService {
  createInvoice(payload: CreateInvoicePayload): Promise<Invoice>;
  getInvoice(invoiceId: string): Promise<Invoice | null>;
  getBookingInvoice(bookingId: string): Promise<Invoice | null>;
  updateStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice>;
}

export class InvoiceService implements IInvoiceService {
  private mockInvoices: Map<string, Invoice> = new Map();

  async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    const invoiceId = `inv-${Date.now()}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const items: InvoiceItem[] = payload.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      invoiceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
      createdAt: new Date().toISOString(),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const discount = payload.discountAmount || 0;
    const totalAmount = Math.max(0, subtotal + platformFee + taxAmount - discount);

    const issueDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    const invoice: Invoice = {
      id: invoiceId,
      invoiceNumber,
      bookingId: payload.bookingId,
      customerId: payload.customerId,
      federationId: payload.federationId,
      subtotal,
      platformFee,
      taxAmount,
      totalAmount,
      status: "issued",
      issueDate,
      dueDate,
      items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.mockInvoices.set(invoiceId, invoice);
    return invoice;
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    return this.mockInvoices.get(invoiceId) || null;
  }

  async getBookingInvoice(bookingId: string): Promise<Invoice | null> {
    return Array.from(this.mockInvoices.values()).find((inv) => inv.bookingId === bookingId) || null;
  }

  async updateStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const updated: Invoice = {
      ...invoice,
      status,
      paidAt: status === "paid" ? new Date().toISOString() : invoice.paidAt,
      updatedAt: new Date().toISOString(),
    };

    this.mockInvoices.set(invoiceId, updated);
    return updated;
  }
}

export const invoiceService = new InvoiceService();

import type { Invoice } from "@/types";

export interface IInvoiceService {
  generateInvoice(bookingId: string): Promise<Invoice>;
  getInvoiceByBooking(bookingId: string): Promise<Invoice | null>;
  markInvoicePaid(invoiceId: string, paymentId: string): Promise<Invoice>;
}

export class InvoiceService implements IInvoiceService {
  async generateInvoice(bookingId: string): Promise<Invoice> {
    return {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      bookingId,
      customerId: "cust-1",
      federationId: "fed-1",
      subtotal: 350,
      platformFee: 17.5,
      taxAmount: 3.15,
      totalAmount: 370.65,
      status: "issued",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 604800000).toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getInvoiceByBooking(bookingId: string): Promise<Invoice | null> {
    return this.generateInvoice(bookingId);
  }

  async markInvoicePaid(invoiceId: string, paymentId: string): Promise<Invoice> {
    const inv = await this.generateInvoice("bk-1");
    console.log(`Marked invoice ${invoiceId} paid via payment ${paymentId}`);
    return {
      ...inv,
      id: invoiceId,
      status: "paid",
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const invoiceService = new InvoiceService();

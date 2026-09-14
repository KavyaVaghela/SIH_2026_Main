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

const LOCAL_STORAGE_INVOICES_KEY = "kaushalyasetu_invoices_db";

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
function mapDbInvoice(data: any): Invoice {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: InvoiceItem[] = (data.invoice_items || []).map((it: any) => ({
    id: it.id,
    invoiceId: it.invoice_id,
    description: it.description,
    quantity: Number(it.quantity),
    unitPrice: Number(it.unit_price),
    amount: Number(it.amount),
    createdAt: it.created_at,
  }));

  return {
    id: data.id,
    invoiceNumber: data.invoice_number,
    bookingId: data.booking_id,
    customerId: data.customer_id,
    federationId: data.federation_id,
    subtotal: Number(data.subtotal),
    platformFee: Number(data.platform_fee),
    taxAmount: Number(data.tax_amount),
    totalAmount: Number(data.total_amount),
    status: data.status,
    issueDate: data.issue_date,
    dueDate: data.due_date,
    paidAt: data.paid_at,
    items,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export class InvoiceService implements IInvoiceService {
  private mockInvoices: Map<string, Invoice> = new Map();

  constructor() {}

  async createInvoice(payload: CreateInvoicePayload): Promise<Invoice> {
    const existing = Array.from(this.mockInvoices.values()).find((inv) => inv.bookingId === payload.bookingId);
    if (existing) {
      return existing;
    }

    const isUuid = (str?: string | null) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    // Check existing in DB first
    try {
      const supabase = await getSupabase();
      if (isUuid(payload.bookingId)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingDb } = await (supabase.from("invoices") as any)
          .select("*, invoice_items(*)")
          .eq("booking_id", payload.bookingId)
          .maybeSingle();

        if (existingDb) {
          const mapped = mapDbInvoice(existingDb);
          this.mockInvoices.set(mapped.id, mapped);
          this.mockInvoices.set(mapped.bookingId, mapped);
          return mapped;
        }
      }
    } catch (err) {
      console.warn("Check existing invoice notice:", err);
    }

    // 1. Try server-side API endpoint with full admin privileges & RLS bypass in browser
    try {
      if (typeof window !== "undefined") {
        const res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.invoice) {
            this.mockInvoices.set(json.invoice.id, json.invoice);
            this.mockInvoices.set(json.invoice.bookingId, json.invoice);
            return json.invoice;
          }
        }
      }
    } catch (err) {
      console.warn("API /api/invoices call notice:", err);
    }

    const invoiceId = `inv-${Date.now()}`;
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;

    const items: InvoiceItem[] = payload.items.map((item, index) => ({
      id: `item-${Date.now()}-${index}`,
      invoiceId,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      amount: Math.round(Number(item.quantity) * Number(item.unitPrice) * 100) / 100,
      createdAt: new Date().toISOString(),
    }));

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    // Cooperative platform fee (5%) is an internal fee deducted from worker earnings
    const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
    const taxAmount = 0;
    const discount = payload.discountAmount || 0;
    // Final bill total strictly equals the itemized components (Labor + Materials = Final Bill)
    const totalAmount = Math.max(0, Math.round((subtotal - discount) * 100) / 100);

    const issueDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    let dbInvoice: Invoice | null = null;
    try {
      const supabase = await getSupabase();
      const targetCustomerId = isUuid(payload.customerId) ? payload.customerId : "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
      const targetFederationId = isUuid(payload.federationId) ? payload.federationId : "b765df3b-c418-4a15-b79f-3cbc09e475dc";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("invoices") as any)
        .insert({
          invoice_number: invoiceNumber,
          booking_id: isUuid(payload.bookingId) ? payload.bookingId : null,
          customer_id: targetCustomerId,
          federation_id: targetFederationId,
          subtotal,
          platform_fee: platformFee,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: "issued",
          issue_date: issueDate,
          due_date: dueDate,
        })
        .select()
        .single();

      if (!error && data) {
        dbInvoice = {
          id: data.id,
          invoiceNumber: data.invoice_number,
          bookingId: data.booking_id || payload.bookingId,
          customerId: data.customer_id,
          federationId: data.federation_id,
          subtotal: Number(data.subtotal),
          platformFee: Number(data.platform_fee),
          taxAmount: Number(data.tax_amount),
          totalAmount: Number(data.total_amount),
          status: data.status,
          issueDate: data.issue_date,
          dueDate: data.due_date,
          items,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        // Insert itemized rows into invoice_items
        for (const item of items) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("invoice_items") as any).insert({
            invoice_id: data.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            amount: item.amount,
          });
        }
      }
    } catch (err) {
      console.warn("DB createInvoice insert notice:", err);
    }

    const invoice: Invoice = dbInvoice || {
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

    this.mockInvoices.set(invoice.id, invoice);
    this.mockInvoices.set(invoice.bookingId, invoice);
    return invoice;
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const supabase = await getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("invoices") as any)
        .select("*, invoice_items(*)")
        .eq("id", invoiceId)
        .maybeSingle();

      if (!error && data) {
        const mapped = mapDbInvoice(data);
        this.mockInvoices.set(invoiceId, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("DB getInvoice query notice:", err);
    }
    return this.mockInvoices.get(invoiceId) || null;
  }

  async getBookingInvoice(bookingId: string): Promise<Invoice | null> {
    // 1. Try server-side API endpoint (with admin client and auto-generation in browser)
    try {
      if (typeof window !== "undefined") {
        const res = await fetch(`/api/invoices?bookingId=${encodeURIComponent(bookingId)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.invoice) {
            this.mockInvoices.set(json.invoice.id, json.invoice);
            this.mockInvoices.set(json.invoice.bookingId, json.invoice);
            return json.invoice;
          }
        }
      }
    } catch (err) {
      console.warn("API getBookingInvoice notice:", err);
    }

    // 2. Try direct Supabase query
    try {
      const supabase = await getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("invoices") as any)
        .select("*, invoice_items(*)")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (!error && data) {
        const mapped = mapDbInvoice(data);
        this.mockInvoices.set(mapped.id, mapped);
        this.mockInvoices.set(bookingId, mapped);
        return mapped;
      }
    } catch (err) {
      console.warn("DB getBookingInvoice query notice:", err);
    }

    const local = Array.from(this.mockInvoices.values()).find((inv) => inv.bookingId === bookingId);
    if (local) return local;

    return null;
  }

  async updateStatus(invoiceId: string, status: InvoiceStatus): Promise<Invoice> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }

    const paidAt = status === "paid" ? new Date().toISOString() : invoice.paidAt;
    const updated: Invoice = {
      ...invoice,
      status,
      paidAt,
      updatedAt: new Date().toISOString(),
    };

    try {
      const supabase = await getSupabase();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("invoices") as any)
        .update({
          status,
          ...(status === "paid" ? { paid_at: paidAt } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq("id", invoiceId);
    } catch (err) {
      console.warn("DB updateStatus invoice notice:", err);
    }

    this.mockInvoices.set(invoiceId, updated);
    return updated;
  }
}

export const invoiceService = new InvoiceService();

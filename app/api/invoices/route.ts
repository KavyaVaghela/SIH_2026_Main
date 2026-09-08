import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const invoiceId = searchParams.get("invoiceId");

    if (!bookingId && !invoiceId) {
      return NextResponse.json({ error: "bookingId or invoiceId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    let query = supabase.from("invoices").select("*, invoice_items(*)");
    if (bookingId) query = query.eq("booking_id", bookingId);
    if (invoiceId) query = query.eq("id", invoiceId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: inv } = await (query as any).maybeSingle();

    if (inv) {
      return NextResponse.json({ invoice: mapDbInvoice(inv) });
    }

    // Auto-generate invoice from booking if booking is in billing/completed status
    if (bookingId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: b } = await (supabase.from("bookings") as any)
        .select("*, services(title)")
        .eq("id", bookingId)
        .maybeSingle();

      if (b && ["SERVICE_COMPLETED", "BILL_GENERATED", "PAYMENT_PENDING", "PAYMENT_RECEIVED", "BOOKING_COMPLETED"].includes(b.status)) {
        const subtotal = Number(b.total_amount) || 500;
        const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
        const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
        const totalAmount = Math.round((subtotal + platformFee + taxAmount) * 100) / 100;
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
        const issueDate = new Date().toISOString().split("T")[0];
        const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newInv, error: createErr } = await (supabase.from("invoices") as any)
          .insert({
            invoice_number: invoiceNumber,
            booking_id: bookingId,
            customer_id: b.customer_id,
            federation_id: b.federation_id,
            subtotal,
            platform_fee: platformFee,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status: b.status === "BOOKING_COMPLETED" || b.status === "PAYMENT_RECEIVED" ? "paid" : "issued",
            issue_date: issueDate,
            due_date: dueDate,
          })
          .select()
          .single();

        if (newInv && !createErr) {
          const serviceTitle = b.services?.title || "Cooperative Trade Service";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("invoice_items") as any).insert([
            {
              invoice_id: newInv.id,
              description: `Labor & Service Execution: ${serviceTitle}`,
              quantity: 1,
              unit_price: subtotal,
              amount: subtotal,
            },
          ]);

          newInv.invoice_items = [
            {
              id: `item-${Date.now()}`,
              invoice_id: newInv.id,
              description: `Labor & Service Execution: ${serviceTitle}`,
              quantity: 1,
              unit_price: subtotal,
              amount: subtotal,
              created_at: new Date().toISOString(),
            },
          ];

          return NextResponse.json({ invoice: mapDbInvoice(newInv) });
        }
      }
    }

    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, customerId, federationId, items, discountAmount } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check if invoice already exists for this booking
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase.from("invoices") as any)
      .select("*, invoice_items(*)")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ invoice: mapDbInvoice(existing) });
    }

    // Resolve valid customer and federation UUIDs
    const isUuid = (str?: string | null) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    let targetCustomerId = isUuid(customerId) ? customerId : null;
    let targetFederationId = isUuid(federationId) ? federationId : null;

    if (!targetCustomerId || !targetFederationId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: b } = await (supabase.from("bookings") as any)
        .select("customer_id, federation_id")
        .eq("id", bookingId)
        .maybeSingle();
      if (b) {
        if (!targetCustomerId) targetCustomerId = b.customer_id;
        if (!targetFederationId) targetFederationId = b.federation_id;
      }
    }

    targetCustomerId = targetCustomerId || "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
    targetFederationId = targetFederationId || "b765df3b-c418-4a15-b79f-3cbc09e475dc";

    const lineItems = (items && items.length > 0)
      ? items
      : [{ description: "Standard Trade Service Labor", quantity: 1, unitPrice: 500 }];

    const subtotal = lineItems.reduce(
      (sum: number, it: { quantity: number; unitPrice: number }) => sum + Number(it.quantity) * Number(it.unitPrice),
      0
    );
    const platformFee = Math.round(subtotal * 0.05 * 100) / 100;
    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const discount = Number(discountAmount) || 0;
    const totalAmount = Math.max(0, subtotal + platformFee + taxAmount - discount);

    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const issueDate = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newInv, error: invErr } = await (supabase.from("invoices") as any)
      .insert({
        invoice_number: invoiceNumber,
        booking_id: bookingId,
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

    if (invErr || !newInv) {
      throw new Error("Failed to insert invoice: " + (invErr?.message || "Unknown error"));
    }

    // Insert line items
    const itemRows = lineItems.map((it: { description: string; quantity: number; unitPrice: number }) => ({
      invoice_id: newInv.id,
      description: it.description,
      quantity: it.quantity,
      unit_price: it.unitPrice,
      amount: Math.round(Number(it.quantity) * Number(it.unitPrice) * 100) / 100,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: insertedItems } = await (supabase.from("invoice_items") as any)
      .insert(itemRows)
      .select();

    newInv.invoice_items = insertedItems || [];

    return NextResponse.json({ invoice: mapDbInvoice(newInv) });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbInvoice(data: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data.invoice_items || []).map((it: any) => ({
    id: it.id,
    invoiceId: it.invoice_id,
    description: it.description,
    quantity: it.quantity,
    unitPrice: it.unit_price,
    amount: it.amount,
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

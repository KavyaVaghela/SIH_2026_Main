import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const paymentId = searchParams.get("paymentId");

    const supabase = createAdminClient();
    let query = supabase.from("payments").select("*");
    if (bookingId) query = query.eq("booking_id", bookingId);
    if (paymentId) query = query.eq("id", paymentId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pay } = await (query as any).maybeSingle();
    if (pay) {
      return NextResponse.json({ payment: mapDbPayment(pay) });
    }
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = "create", invoiceId, bookingId, customerId, amount, paymentId } = body;
    const isSuccess = body.isSuccessful !== undefined ? Boolean(body.isSuccessful) : (body.simulateSuccess !== undefined ? Boolean(body.simulateSuccess) : true);

    const supabase = createAdminClient();

    if (action === "create") {
      // Check existing payment for this booking
      if (bookingId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existing } = await (supabase.from("payments") as any)
          .select("*")
          .eq("booking_id", bookingId)
          .maybeSingle();

        if (existing) {
          return NextResponse.json({ payment: mapDbPayment(existing) });
        }
      }

      const isUuid = (str?: string | null) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;
      const gatewayOrderId = `order_mock_${Date.now()}`;
      const targetCustomerId = isUuid(customerId) ? customerId : "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newPay, error: payErr } = await (supabase.from("payments") as any)
        .insert({
          payment_number: paymentNumber,
          invoice_id: isUuid(invoiceId) ? invoiceId : null,
          booking_id: isUuid(bookingId) ? bookingId : null,
          customer_id: targetCustomerId,
          amount: Number(amount) || 550,
          gateway_provider: "mock_razorpay",
          gateway_order_id: gatewayOrderId,
          status: "PENDING",
        })
        .select()
        .single();

      if (payErr || !newPay) {
        throw new Error("Failed to insert payment: " + (payErr?.message || "Unknown error"));
      }

      return NextResponse.json({ payment: mapDbPayment(newPay) });
    }

    if (action === "process") {
      const targetPayId = paymentId;
      if (!targetPayId) {
        return NextResponse.json({ error: "paymentId is required for process action" }, { status: 400 });
      }

      // Check existing payment status to protect against concurrent duplicates
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingPay } = await (supabase.from("payments") as any)
        .select("*")
        .eq("id", targetPayId)
        .maybeSingle();

      if (!existingPay) {
        return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
      }

      if (existingPay.status === "PAID") {
        return NextResponse.json({ payment: mapDbPayment(existingPay), message: "Payment already settled" });
      }

      const paidAt = new Date().toISOString();
      const gatewayPaymentId = `pay_mock_${Date.now()}`;
      const newStatus = isSuccess ? "PAID" : "FAILED";

      // Atomic update
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (supabase.from("payments") as any)
        .update({
          status: newStatus,
          gateway_payment_id: isSuccess ? gatewayPaymentId : null,
          paid_at: isSuccess ? paidAt : null,
        })
        .eq("id", targetPayId);

      if (isSuccess) {
        query = query.neq("status", "PAID");
      }

      const { data: updatedPay, error: updateErr } = await query.select().maybeSingle();

      if (updateErr) {
        throw new Error("Failed to update payment: " + (updateErr?.message || "Unknown error"));
      }

      if (!updatedPay && isSuccess) {
        // Was already processed by another concurrent request
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: alreadyDone } = await (supabase.from("payments") as any)
          .select("*")
          .eq("id", targetPayId)
          .maybeSingle();
        if (alreadyDone) {
          return NextResponse.json({ payment: mapDbPayment(alreadyDone) });
        }
      }

      if (isSuccess && updatedPay) {
        // Mark invoice as paid
        if (updatedPay.invoice_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("invoices") as any)
            .update({ status: "paid", paid_at: paidAt })
            .eq("id", updatedPay.invoice_id);
        }

        // Transition booking: PAYMENT_RECEIVED -> BOOKING_COMPLETED
        if (updatedPay.booking_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: b } = await (supabase.from("bookings") as any)
            .select("status, worker_id")
            .eq("id", updatedPay.booking_id)
            .maybeSingle();

          if (b && b.status !== "BOOKING_COMPLETED") {
            // Log PAYMENT_RECEIVED
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from("booking_status_history") as any).insert({
              booking_id: updatedPay.booking_id,
              previous_status: b.status,
              new_status: "PAYMENT_RECEIVED",
              notes: "Payment confirmed via payment gateway",
            });

            // Log BOOKING_COMPLETED
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from("booking_status_history") as any).insert({
              booking_id: updatedPay.booking_id,
              previous_status: "PAYMENT_RECEIVED",
              new_status: "BOOKING_COMPLETED",
              notes: "Service completed and settled",
            });

            // Update booking to BOOKING_COMPLETED
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (supabase.from("bookings") as any)
              .update({
                status: "BOOKING_COMPLETED",
                updated_at: paidAt,
              })
              .eq("id", updatedPay.booking_id);

            if (b.worker_id) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (supabase.from("workers") as any)
                .update({ availability_status: "AVAILABLE", updated_at: paidAt })
                .eq("id", b.worker_id);
            }
          }
        }
      }

      return NextResponse.json({ payment: mapDbPayment(updatedPay || existingPay) });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbPayment(data: any) {
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

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const customerId = searchParams.get("customerId");
    const workerId = searchParams.get("workerId");

    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from("bookings") as any)
      .select(`
        *,
        customer:profiles!customer_id (full_name, phone, email),
        worker:workers (
          id,
          profession,
          profile:profiles!profile_id (full_name, phone)
        ),
        services (title, service_categories (name)),
        addresses (address_line1, city),
        federations (name)
      `)
      .order("created_at", { ascending: false });

    if (bookingId) {
      query = query.eq("id", bookingId);
      const { data, error } = await query.maybeSingle();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }
      return NextResponse.json({ booking: mapDbBooking(data) });
    }

    if (customerId) {
      // Support matching customer by UUID or dev customer
      if (customerId === "cust-1" || customerId.includes("customer")) {
        query = query.or(`customer_id.eq.b0ef9604-54c8-4ad1-9a7a-c353cfd339ef,customer_id.eq.81ec03d4-4889-4e9f-a055-dcb70cc50c6e`);
      } else {
        query = query.eq("customer_id", customerId);
      }
    }

    if (workerId) {
      query = query.eq("worker_id", workerId);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bookings = (data || []).map((b: any) => mapDbBooking(b));
    return NextResponse.json({ bookings, count: bookings.length });
  } catch (err: unknown) {
    console.error("GET /api/bookings error:", err);
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = "create", bookingId, status, updatedBy, reason, ...createPayload } = body;
    delete (createPayload as Record<string, unknown>).role;

    const supabase = createAdminClient();

    if (action === "transition") {
      if (!bookingId || !status) {
        return NextResponse.json({ error: "bookingId and status are required for transition" }, { status: 400 });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existing, error: findErr } = await (supabase.from("bookings") as any)
        .select("*")
        .eq("id", bookingId)
        .single();

      if (findErr || !existing) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {
        status,
        updated_at: now,
      };

      if ((status === "SERVICE_STARTED" || status === "IN_PROGRESS") && !existing.actual_start_at) {
        updateData.actual_start_at = now;
      }
      if (status === "SERVICE_COMPLETED" && !existing.actual_end_at) {
        updateData.actual_end_at = now;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updated, error: updateErr } = await (supabase.from("bookings") as any)
        .update(updateData)
        .eq("id", bookingId)
        .select(`
          *,
          customer:profiles!customer_id (full_name, phone, email),
          worker:workers (
            id,
            profession,
            profile:profiles!profile_id (full_name, phone)
          ),
          services (title, service_categories (name)),
          addresses (address_line1, city),
          federations (name)
        `)
        .single();

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      // Write status history
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("booking_status_history") as any).insert({
          booking_id: bookingId,
          previous_status: existing.status,
          new_status: status,
          changed_by: updatedBy || "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef",
          notes: reason || `Status transitioned to ${status}`,
        });
      } catch (histErr) {
        console.warn("Status history note:", histErr);
      }

      return NextResponse.json({ booking: mapDbBooking(updated) });
    }

    if (action === "create") {
      const isUuid = (str?: string | null) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      const targetCustomerId = isUuid(createPayload.customerId)
        ? createPayload.customerId
        : "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef"; // Prince Patel

      const targetWorkerId = isUuid(createPayload.workerId)
        ? createPayload.workerId
        : "59eca4ff-a589-4363-ad76-24a4ff5b6e2e"; // Ravi Patel

      const targetFederationId = isUuid(createPayload.federationId)
        ? createPayload.federationId
        : "b765df3b-c418-4a15-b79f-3cbc09e475dc";

      const targetServiceId = isUuid(createPayload.serviceId)
        ? createPayload.serviceId
        : "a510e2c8-5ee9-4b01-abfc-a2a101ea729e";

      const targetAddressId = isUuid(createPayload.addressId)
        ? createPayload.addressId
        : "3f50baf2-d986-4bec-88c2-dfa901d78a0b";

      const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;
      const totalAmount = Number(createPayload.totalAmount) || 500;
      const scheduledStart = createPayload.scheduledStartAt || new Date().toISOString();
      const scheduledEnd =
        createPayload.scheduledEndAt || new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newBooking, error: insertErr } = await (supabase.from("bookings") as any)
        .insert({
          booking_number: bookingNumber,
          customer_id: targetCustomerId,
          worker_id: targetWorkerId,
          service_id: targetServiceId,
          federation_id: targetFederationId,
          address_id: targetAddressId,
          status: "REQUEST_SENT",
          problem_description: createPayload.problemDescription || "Service request initiated by customer",
          otp_code: "940218",
          scheduled_start_at: scheduledStart,
          scheduled_end_at: scheduledEnd,
          total_amount: totalAmount,
          platform_fee: Math.round(totalAmount * 0.05),
          worker_earnings: Math.round(totalAmount * 0.85),
        })
        .select(`
          *,
          customer:profiles!customer_id (full_name, phone, email),
          worker:workers (
            id,
            profession,
            profile:profiles!profile_id (full_name, phone)
          ),
          services (title, service_categories (name)),
          addresses (address_line1, city),
          federations (name)
        `)
        .single();

      if (insertErr || !newBooking) {
        console.error("Booking create error:", insertErr);
        return NextResponse.json({ error: insertErr?.message || "Failed to create booking" }, { status: 500 });
      }

      // Record initial history
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("booking_status_history") as any).insert({
          booking_id: newBooking.id,
          previous_status: null,
          new_status: "REQUEST_SENT",
          changed_by: targetCustomerId,
          notes: "Booking request created by customer",
        });
      } catch (histErr) {
        console.warn("Status history note:", histErr);
      }

      return NextResponse.json({ booking: mapDbBooking(newBooking) });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    console.error("POST /api/bookings error:", err);
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbBooking(b: any) {
  const customerName = b.customer?.full_name || "Prince Patel";
  const customerPhone = b.customer?.phone || "+91 98765 43210";
  const workerProfile = b.worker?.profile;
  const workerName = workerProfile?.full_name || "Ravi Patel";
  const workerPhone = workerProfile?.phone || "+91 98250 11021";
  const addressText = b.addresses ? `${b.addresses.address_line1}, ${b.addresses.city || "Ahmedabad"}` : "Satellite, Ahmedabad";

  return {
    id: b.id,
    bookingNumber: b.booking_number,
    customerId: b.customer_id,
    customerName,
    customerPhone,
    workerId: b.worker_id,
    workerName,
    workerPhone,
    serviceId: b.service_id,
    serviceTitle: b.services?.title || "Plumbing Repair",
    categoryName: b.services?.service_categories?.name || "Plumbing",
    federationId: b.federation_id,
    cooperativeName: b.federations?.name || "Ahmedabad Skilled Workers Federation",
    addressId: b.address_id,
    addressText,
    status: b.status,
    problemDescription: b.problem_description,
    problemPhotoUrl: b.problem_photo_url || null,
    otpCode: b.otp_code || "940218",
    scheduledStartAt: b.scheduled_start_at,
    scheduledEndAt: b.scheduled_end_at,
    actualStartAt: b.actual_start_at || null,
    actualEndAt: b.actual_end_at || null,
    totalAmount: Number(b.total_amount) || 500,
    platformFee: Number(b.platform_fee) || 25,
    workerEarnings: Number(b.worker_earnings) || 425,
    workerEstimateAmount: Number(b.total_amount) || 500,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

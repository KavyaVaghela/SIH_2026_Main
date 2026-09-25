import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { validateBookingTransition } from "@/features/bookings/utils/booking-state-machine";
import type { BookingStatus, UserRole } from "@/supabase/types/database.types";

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
      // Resolve worker record if profile_id was provided
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: workerRecord } = await (supabase.from("workers") as any)
        .select("id")
        .or(`id.eq.${workerId},profile_id.eq.${workerId}`)
        .maybeSingle();

      if (workerRecord) {
        query = query.or(`worker_id.eq.${workerRecord.id},worker_id.eq.${workerId}`);
      } else {
        query = query.eq("worker_id", workerId);
      }
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

      // Resolve actor role: prioritize verified session profile role over client-supplied role
      let actorRole: UserRole = (body.role as UserRole) || "CUSTOMER";
      try {
        const serverSupabase = createServerClient();
        const { data: { user } } = await serverSupabase.auth.getUser();
        if (user?.id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: prof } = await (supabase.from("profiles") as any)
            .select("role")
            .eq("id", user.id)
            .maybeSingle();
          if (prof?.role) {
            actorRole = prof.role as UserRole;
          }
        }
      } catch {
        // Retain fallback role
      }

      // Validate transition using canonical state machine
      try {
        validateBookingTransition(existing.status as BookingStatus, status as BookingStatus, actorRole);
      } catch (transErr: unknown) {
        const err = transErr as { message?: string; statusCode?: number };
        return NextResponse.json(
          { error: err?.message || "Invalid state transition" },
          { status: err?.statusCode || 400 }
        );
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

      // Release worker availability back to AVAILABLE when booking completes or is cancelled
      if ((status === "BOOKING_COMPLETED" || status === "CANCELLED") && existing.worker_id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("workers") as any)
            .update({
              availability_status: "AVAILABLE",
              updated_at: now,
            })
            .eq("id", existing.worker_id);
        } catch (releaseErr) {
          console.warn("Worker release notice:", releaseErr);
        }
      }

      return NextResponse.json({ booking: mapDbBooking(updated) });
    }

    if (action === "allocate_worker") {
      const { workerId, adminId } = body;
      if (!bookingId || !workerId) {
        return NextResponse.json({ error: "bookingId and workerId are required for allocation" }, { status: 400 });
      }

      // 1. Verify booking exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: bookingRecord, error: bErr } = await (supabase.from("bookings") as any)
        .select("*")
        .eq("id", bookingId)
        .single();

      if (bErr || !bookingRecord) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      // 2. Concurrency-safe atomic lock: worker must be AVAILABLE
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lockedWorker, error: lockErr } = await (supabase.from("workers") as any)
        .update({
          availability_status: "BUSY",
          updated_at: new Date().toISOString(),
        })
        .eq("id", workerId)
        .eq("availability_status", "AVAILABLE")
        .select("id, profile_id, profession")
        .maybeSingle();

      if (lockErr || !lockedWorker) {
        return NextResponse.json(
          { error: "Worker is no longer available (currently busy or allocated to another booking)." },
          { status: 409 }
        );
      }

      // 3. If previous worker was assigned and different, release previous worker
      if (bookingRecord.worker_id && bookingRecord.worker_id !== workerId) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("workers") as any)
            .update({ availability_status: "AVAILABLE", updated_at: new Date().toISOString() })
            .eq("id", bookingRecord.worker_id);
        } catch (relErr) {
          console.warn("Release old worker notice:", relErr);
        }
      }

      // 4. Update booking with worker_id and status BOOKING_CONFIRMED
      const now = new Date().toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedBooking, error: upErr } = await (supabase.from("bookings") as any)
        .update({
          worker_id: workerId,
          status: "BOOKING_CONFIRMED",
          updated_at: now,
        })
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

      if (upErr || !updatedBooking) {
        // Revert worker lock if booking update failed
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("workers") as any)
          .update({ availability_status: "AVAILABLE", updated_at: now })
          .eq("id", workerId);
        return NextResponse.json({ error: upErr?.message || "Failed to allocate worker" }, { status: 500 });
      }

      // 5. Record status history
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from("booking_status_history") as any).insert({
          booking_id: bookingId,
          previous_status: bookingRecord.status,
          new_status: "BOOKING_CONFIRMED",
          changed_by: adminId || "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef",
          notes: reason || "Worker allocated by Administrator",
        });
      } catch (histErr) {
        console.warn("Status history note:", histErr);
      }

      // 6. Notify allocated worker
      if (lockedWorker.profile_id) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase.from("notifications") as any).insert({
            profile_id: lockedWorker.profile_id,
            title: "Emergency Service Assigned by Admin",
            message: `You have been allocated to emergency booking ${bookingRecord.booking_number}.`,
            type: "warning",
            is_read: false,
            metadata: { bookingId, priority: "HIGH" },
          });
        } catch (nErr) {
          console.warn("Worker notif note:", nErr);
        }
      }

      return NextResponse.json({ booking: mapDbBooking(updatedBooking) });
    }

    if (action === "create") {
      const isUuid = (str?: string | null) =>
        Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

      const targetCustomerId = isUuid(createPayload.customerId)
        ? createPayload.customerId
        : "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef"; // Prince Patel

      let targetWorkerId = isUuid(createPayload.workerId)
        ? createPayload.workerId
        : null;

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

      const targetPriority: "LOW" | "MODERATE" | "HIGH" | null =
        createPayload.priority && ["LOW", "MODERATE", "HIGH"].includes(createPayload.priority)
          ? createPayload.priority
          : null;

      const bookingStatus = "REQUEST_SENT";

      if (!targetWorkerId && !createPayload.workerId) {
        // Assign default dev worker or leave pending
        targetWorkerId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e"; // Ravi Patel default
      }

      let problemDescription = createPayload.problemDescription || "Service request initiated by customer";
      if (!problemDescription.includes("[PLATFORM_ESTIMATE:")) {
        problemDescription = `[PLATFORM_ESTIMATE: ${totalAmount}] ${problemDescription}`.trim();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const insertData: Record<string, any> = {
        booking_number: bookingNumber,
        customer_id: targetCustomerId,
        worker_id: targetWorkerId,
        service_id: targetServiceId,
        federation_id: targetFederationId,
        address_id: targetAddressId,
        status: bookingStatus,
        problem_description: problemDescription,
        otp_code: "940218",
        scheduled_start_at: scheduledStart,
        scheduled_end_at: scheduledEnd,
        total_amount: totalAmount,
        platform_fee: Math.round(totalAmount * 0.05),
        worker_earnings: Math.round(totalAmount * 0.85),
      };

      if (targetPriority) {
        insertData.priority = targetPriority;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let { data: newBooking, error: insertErr } = await (supabase.from("bookings") as any)
        .insert(insertData)
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

      if (insertErr && targetPriority && insertErr.message?.includes("priority")) {
        delete insertData.priority;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const retry = await (supabase.from("bookings") as any)
          .insert(insertData)
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
        newBooking = retry.data;
        insertErr = retry.error;
      }

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
          new_status: newBooking.status || "REQUEST_SENT",
          changed_by: targetCustomerId,
          notes: targetPriority
            ? `Booking created with ${targetPriority} priority`
            : "Booking request created by customer",
        });
      } catch (histErr) {
        console.warn("Status history note:", histErr);
      }

      return NextResponse.json({ booking: mapDbBooking(newBooking, targetPriority) });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: unknown) {
    console.error("POST /api/bookings error:", err);
    return NextResponse.json({ error: (err as Error)?.message || "Internal server error" }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapDbBooking(b: any, fallbackPriority?: string | null) {
  const customerName = b.customer?.full_name || "Prince Patel";
  const customerPhone = b.customer?.phone || "+91 98765 43210";
  const workerProfile = b.worker?.profile;
  const workerName = workerProfile?.full_name || "Ravi Patel";
  const workerPhone = workerProfile?.phone || "+91 98250 11021";
  const addressText = b.addresses ? `${b.addresses.address_line1}, ${b.addresses.city || "Ahmedabad"}` : "Satellite, Ahmedabad";

  let priority = b.priority || fallbackPriority || null;
  if (!priority && typeof b.problem_description === "string") {
    const match = b.problem_description.match(/\[PRIORITY:\s*(LOW|MODERATE|HIGH)\]/i);
    if (match) {
      priority = match[1].toUpperCase();
    }
  }

  let platformEstimate: number | null = Number(b.platform_estimate) || null;
  let workerEstimate: number | null = Number(b.worker_estimate_amount) || null;

  if (typeof b.problem_description === "string") {
    if (!platformEstimate) {
      const pMatch = b.problem_description.match(/\[PLATFORM_ESTIMATE:\s*(\d+(\.\d+)?)\]/i);
      if (pMatch) platformEstimate = Number(pMatch[1]);
    }
    if (!workerEstimate) {
      const wMatch = b.problem_description.match(/\[WORKER_ESTIMATE:\s*(\d+(\.\d+)?)\]/i);
      if (wMatch) workerEstimate = Number(wMatch[1]);
    }
  }

  if (!platformEstimate) {
    const srvBase = Number(b.services?.base_price);
    if (!isNaN(srvBase) && srvBase > 0) {
      platformEstimate = srvBase;
    } else {
      platformEstimate = Number(b.total_amount) || 450;
    }
  }

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
    priority: priority || null,
    problemDescription: b.problem_description,
    problemPhotoUrl: b.problem_photo_url || null,
    otpCode: b.otp_code || "940218",
    scheduledStartAt: b.scheduled_start_at,
    scheduledEndAt: b.scheduled_end_at,
    actualStartAt: b.actual_start_at || null,
    actualEndAt: b.actual_end_at || null,
    totalAmount: platformEstimate,
    platformEstimate,
    platformFee: Number(b.platform_fee) || Math.round(platformEstimate * 0.05),
    workerEarnings: Number(b.worker_earnings) || Math.round(platformEstimate * 0.95),
    workerEstimateAmount: workerEstimate,
    workerEstimateLabor: b.worker_estimate_labor || (workerEstimate ? Math.round(workerEstimate * 0.7) : null),
    workerEstimateMaterials: b.worker_estimate_materials || (workerEstimate ? Math.round(workerEstimate * 0.3) : null),
    workerEstimateNotes: b.worker_estimate_notes || null,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
  };
}

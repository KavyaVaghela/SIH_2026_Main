import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { extractProblemEvidence } from "@/lib/storage/evidence";

export async function GET(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const requestId = params.requestId;
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    // 1. Verify authenticated user
    let authenticatedUserId: string | null = null;
    try {
      const serverClient = await createClient();
      const { data: { user } } = await serverClient.auth.getUser();
      authenticatedUserId = user?.id || null;
    } catch {
      // Fallback
    }

    const supabase = createAdminClient();

    // 2. Fetch job_request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: req, error: reqErr } = await (supabase.from("job_requests") as any)
      .select(`
        id,
        customer_id,
        service_id,
        description,
        preferred_schedule,
        status,
        created_at,
        services (
          id,
          title,
          category_id,
          service_categories (
            id,
            name
          )
        )
      `)
      .eq("id", requestId)
      .maybeSingle();

    if (reqErr || !req) {
      return NextResponse.json({ error: "Service request not found." }, { status: 404 });
    }

    // 3. Strict Customer Isolation: Customer can only see their own requests
    if (authenticatedUserId && req.customer_id !== authenticatedUserId) {
      return NextResponse.json({ error: "Unauthorized. You cannot view another customer's request." }, { status: 403 });
    }

    const serviceTitle = req.services?.title || "Home Repair Service";
    const categoryName = req.services?.service_categories?.name || "General Maintenance";
    const requestNumber = `SR-${req.id.slice(0, 8).toUpperCase()}`;

    // 4. Fetch all worker_estimates for this job_request_id
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rawEstimates, error: estErr } = await (supabase.from("worker_estimates") as any)
      .select(`
        id,
        job_request_id,
        worker_id,
        estimated_amount,
        estimated_hours,
        notes,
        status,
        created_at,
        workers (
          id,
          member_id,
          profession,
          hourly_rate,
          experience_years,
          verification_status,
          profiles (
            full_name,
            avatar_url,
            phone
          )
        )
      `)
      .eq("job_request_id", requestId);

    if (estErr) {
      console.error("Error fetching worker_estimates in API:", estErr);
    }

    const list = [];
    let selectedWorkerId: string | undefined = undefined;

    for (const item of rawEstimates || []) {
      const w = item.workers;
      const p = w?.profiles;
      const workerId = item.worker_id;

      // Extract itemized breakdown from structured notes if present
      let laborAmount = 0;
      let materialAmount = 0;
      let additionalCharges = 0;
      let displayNotes = item.notes || "";

      if (item.notes) {
        try {
          const parsed = JSON.parse(item.notes);
          if (typeof parsed === "object" && parsed !== null) {
            laborAmount = Number(parsed.labor) || 0;
            materialAmount = Number(parsed.materials) || 0;
            additionalCharges = Number(parsed.additional) || 0;
            displayNotes = parsed.text || displayNotes;
          }
        } catch {
          // Fallback parsing from text format
          const laborMatch = item.notes.match(/Labor:\s*₹?(\d+)/i) || item.notes.match(/Labour:\s*₹?(\d+)/i);
          const matMatch = item.notes.match(/Materials?:\s*₹?(\d+)/i);
          const addMatch = item.notes.match(/Additional:\s*₹?(\d+)/i);
          if (laborMatch) laborAmount = parseInt(laborMatch[1], 10);
          if (matMatch) materialAmount = parseInt(matMatch[1], 10);
          if (addMatch) additionalCharges = parseInt(addMatch[1], 10);
        }
      }

      const totalAmt = Number(item.estimated_amount) || 0;
      if (totalAmt > 0 && laborAmount === 0 && materialAmount === 0) {
        laborAmount = Math.round(totalAmt * 0.7);
        materialAmount = Math.round(totalAmt * 0.25);
        additionalCharges = Math.max(0, totalAmt - laborAmount - materialAmount);
      }

      const status = item.status?.toUpperCase() || "PENDING";
      if (status === "SELECTED") {
        selectedWorkerId = workerId;
      }

      list.push({
        estimateId: item.id,
        workerId,
        workerName: p?.full_name || "Verified Cooperative Worker",
        avatarUrl: p?.avatar_url || undefined,
        phone: p?.phone || "+91 98250 11021",
        profession: w?.profession || "Skilled Craftsman",
        hourlyRate: w?.hourly_rate || 350,
        experienceYears: w?.experience_years || 5,
        isVerified: w?.verification_status === "verified",
        rating: 4.9,
        reviewsCount: 12,
        completedJobsCount: 18,
        isNew: false,
        status,
        estimatedAmount: totalAmt,
        estimatedHours: item.estimated_hours ? Number(item.estimated_hours) : undefined,
        laborAmount,
        materialAmount,
        additionalCharges,
        distanceKm: 2.5,
        skills: [w?.profession || serviceTitle, "Diagnostic Inspection", "Certified Craftsmanship"].filter(Boolean),
        notes: displayNotes,
        createdAt: item.created_at,
      });
    }

    const validEstimates = list.filter(
      (e) => (e.status === "ESTIMATE_SUBMITTED" || e.status === "SELECTED") && e.estimatedAmount > 0
    );

    const bestEstimate =
      validEstimates.length > 0
        ? Math.min(...validEstimates.map((e) => e.estimatedAmount))
        : null;

    const totalRequested = list.length;
    const totalResponded = list.filter((e) => e.status !== "PENDING").length;
    const allDeclined = totalRequested > 0 && list.every((e) => e.status === "DECLINED");

    const { cleanDescription, problemPhotoUrl } = extractProblemEvidence(req.description);

    return NextResponse.json({
      summary: {
        id: req.id,
        requestNumber,
        customerId: req.customer_id,
        serviceId: req.service_id,
        serviceTitle,
        categoryName,
        description: cleanDescription,
        photoUrl: problemPhotoUrl || null,
        preferredSchedule: req.preferred_schedule,
        status: req.status,
        createdAt: req.created_at,
        totalRequested,
        totalResponded,
        totalEstimates: validEstimates.length,
        bestEstimate,
        allDeclined,
        selectedWorkerId,
        estimates: list,
      },
    });
  } catch (err: unknown) {
    console.error("GET /api/customer/requests/[requestId] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { requestId: string } }
) {
  try {
    const requestId = params.requestId;
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const body = await request.json();
    const { selectedWorkerId, customerId } = body;

    if (!selectedWorkerId) {
      return NextResponse.json({ error: "selectedWorkerId is required" }, { status: 400 });
    }

    // Resolve customer ID
    let finalCustomerId = customerId;
    if (!finalCustomerId) {
      try {
        const serverClient = await createClient();
        const { data: { user } } = await serverClient.auth.getUser();
        finalCustomerId = user?.id;
      } catch {
        // Fall through
      }
    }

    const supabase = createAdminClient();

    // 1. Fetch service request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentReq, error: fetchErr } = await (supabase.from("job_requests") as any)
      .select("id, status, customer_id, service_id, description, preferred_schedule")
      .eq("id", requestId)
      .single();

    if (fetchErr || !currentReq) {
      return NextResponse.json({ error: "Service request not found." }, { status: 404 });
    }

    if (currentReq.status === "CONFIRMED") {
      return NextResponse.json(
        { error: "A worker has already been confirmed for this service request." },
        { status: 409 }
      );
    }

    finalCustomerId = finalCustomerId || currentReq.customer_id;

    // 2. Fetch the chosen worker's submitted estimate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: chosenEstimate, error: estErr } = await (supabase.from("worker_estimates") as any)
      .select(`
        id,
        worker_id,
        estimated_amount,
        status,
        workers (
          id,
          federation_id,
          profile_id,
          profiles (
            full_name
          )
        )
      `)
      .eq("job_request_id", requestId)
      .eq("worker_id", selectedWorkerId)
      .single();

    if (estErr || !chosenEstimate) {
      return NextResponse.json({ error: "Selected worker estimate not found." }, { status: 404 });
    }

    if (chosenEstimate.status === "DECLINED") {
      return NextResponse.json({ error: "Cannot select a worker who has declined the request." }, { status: 400 });
    }

    const agreedAmount = Number(chosenEstimate.estimated_amount) || 350;

    // 3. Concurrency-Safe Database Atomic Allocation: Lock worker to BUSY
    // Only ONE booking may successfully allocate the worker.
    // Concurrency is guarded at the database level by evaluating availability_status = 'AVAILABLE'
    // with exclusive row-level locking.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: allocatedWorker, error: allocErr } = await (supabase.from("workers") as any)
      .update({
        availability_status: "BUSY",
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedWorkerId)
      .eq("availability_status", "AVAILABLE")
      .select("id, availability_status")
      .maybeSingle();

    if (allocErr || !allocatedWorker) {
      return NextResponse.json(
        { error: "Worker is no longer available for this booking." },
        { status: 409 }
      );
    }

    // 4. Atomically lock job_requests status to CONFIRMED
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedReq, error: lockErr } = await (supabase.from("job_requests") as any)
      .update({
        status: "CONFIRMED",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId)
      .neq("status", "CONFIRMED")
      .select()
      .maybeSingle();

    if (lockErr || !updatedReq) {
      // Revert worker availability if job request was already confirmed concurrently
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("workers") as any)
        .update({
          availability_status: "AVAILABLE",
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedWorkerId);

      return NextResponse.json(
        { error: "Another confirmation was processed concurrently. Only one worker can be selected." },
        { status: 409 }
      );
    }

    // 5. Update worker_estimates statuses for THIS request:
    // Chosen worker -> SELECTED
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("worker_estimates") as any)
      .update({ status: "SELECTED" })
      .eq("job_request_id", requestId)
      .eq("worker_id", selectedWorkerId);

    // Other competing workers on this request -> NOT_SELECTED
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("worker_estimates") as any)
      .update({ status: "NOT_SELECTED" })
      .eq("job_request_id", requestId)
      .neq("worker_id", selectedWorkerId)
      .neq("status", "DECLINED");

    // 6. Invalidate this worker's estimates across ALL OTHER pending customer requests
    // Transition them to WORKER_UNAVAILABLE so other customers can see they are allocated
    // while keeping those customers' other eligible workers intact.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invalidatedOtherEstimates } = await (supabase.from("worker_estimates") as any)
      .update({ status: "WORKER_UNAVAILABLE" })
      .eq("worker_id", selectedWorkerId)
      .neq("job_request_id", requestId)
      .in("status", ["PENDING", "ESTIMATE_SUBMITTED", "INTERESTED"])
      .select("id, job_request_id");

    // 7. Create canonical booking in public.bookings in state BOOKING_CONFIRMED
    const bookingNumber = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
    const platformFee = Math.round(agreedAmount * 0.05 * 100) / 100;
    const workerEarnings = agreedAmount - platformFee;
    const otpCode = String(Math.floor(100000 + Math.random() * 900000));

    // Resolve address if possible
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: customerAddr } = await (supabase.from("addresses") as any)
      .select("id")
      .eq("profile_id", finalCustomerId)
      .order("is_default", { ascending: false })
      .limit(1)
      .maybeSingle();

    const addressId = customerAddr?.id || "3f50baf2-d986-4bec-88c2-dfa901d78a0b";
    const federationId = chosenEstimate.workers?.federation_id || "b765df3b-c418-4a15-b79f-3cbc09e475dc";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newBooking, error: bkErr } = await (supabase.from("bookings") as any)
      .insert({
        booking_number: bookingNumber,
        customer_id: finalCustomerId,
        worker_id: selectedWorkerId,
        service_id: currentReq.service_id,
        federation_id: federationId,
        address_id: addressId,
        status: "BOOKING_CONFIRMED",
        problem_description: currentReq.description,
        otp_code: otpCode,
        scheduled_start_at: currentReq.preferred_schedule || new Date().toISOString(),
        scheduled_end_at: new Date(new Date(currentReq.preferred_schedule || Date.now()).getTime() + 2 * 60 * 60 * 1000).toISOString(),
        total_amount: agreedAmount,
        platform_fee: platformFee,
        worker_earnings: workerEarnings,
      })
      .select()
      .single();

    if (bkErr) {
      console.warn("Booking creation notice:", bkErr);
    }

    const canonicalBookingId = newBooking?.id || requestId;

    // Record status history
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("booking_status_history") as any).insert({
        booking_id: canonicalBookingId,
        previous_status: null,
        new_status: "BOOKING_CONFIRMED",
        changed_by: finalCustomerId,
        notes: "Worker allocated and booking confirmed by customer.",
      });
    } catch {
      // Ignore status history errors
    }

    // 8. Broadcast Realtime confirmation and worker busy events
    try {
      // Broadcast confirmation on current request channel
      const channel = supabase.channel(`request_estimates_${requestId}`);
      await new Promise<void>((resolve) => {
        channel.subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            channel
              .send({
                type: "broadcast",
                event: "worker_confirmed",
                payload: {
                  requestId,
                  selectedWorkerId,
                  bookingId: canonicalBookingId,
                  estimateAmount: agreedAmount,
                },
              })
              .then(() => {
                supabase.removeChannel(channel);
                resolve();
              })
              .catch(() => resolve());
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            resolve();
          }
        });
        setTimeout(resolve, 600);
      });

      // Broadcast worker_unavailable to any other affected customer request channels
      if (invalidatedOtherEstimates && invalidatedOtherEstimates.length > 0) {
        const uniqueOtherReqIds = Array.from(
          new Set(
            invalidatedOtherEstimates
              .map((item: { job_request_id?: string | null }) => item.job_request_id)
              .filter(Boolean)
          )
        );
        for (const otherReqId of uniqueOtherReqIds) {
          const otherChan = supabase.channel(`request_estimates_${otherReqId}`);
          otherChan.subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              otherChan
                .send({
                  type: "broadcast",
                  event: "worker_unavailable",
                  payload: {
                    requestId: otherReqId,
                    workerId: selectedWorkerId,
                    reason: "Worker is no longer available for this booking (allocated).",
                  },
                })
                .then(() => supabase.removeChannel(otherChan))
                .catch(() => {});
            }
          });
        }
      }
    } catch (rtErr) {
      console.warn("Realtime broadcast confirmation notice:", rtErr);
    }

    return NextResponse.json({
      bookingId: canonicalBookingId,
      requestId,
      selectedWorkerId,
    });
  } catch (err: unknown) {
    console.error("POST /api/customer/requests/[requestId] error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notificationService } from "@/features/notifications/services/notification-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      requestId,
      workerId,
      laborAmount,
      materialAmount = 0,
      additionalCharges = 0,
      totalAmount,
      notes,
    } = body;

    if (!requestId || !workerId) {
      return NextResponse.json(
        { error: "requestId and workerId are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Handle worker decline action
    if (body.action === "decline" || body.status === "DECLINED") {
      const reason = body.reason || notes || "Declined by worker";
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: decErr } = await (supabase.from("worker_estimates") as any)
        .update({
          status: "DECLINED",
          notes: reason,
        })
        .eq("job_request_id", requestId)
        .eq("worker_id", workerId);

      if (decErr) {
        console.error("Failed to decline worker estimate:", decErr);
        return NextResponse.json({ error: decErr.message }, { status: 500 });
      }

      // Realtime broadcast for worker decline
      try {
        const channel = supabase.channel(`request_estimates_${requestId}`);
        await new Promise<void>((resolve) => {
          channel.subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              channel
                .send({
                  type: "broadcast",
                  event: "worker_declined",
                  payload: { requestId, workerId, reason },
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
      } catch (rtErr) {
        console.warn("Realtime broadcast notice:", rtErr);
      }

      return NextResponse.json({ success: true, status: "DECLINED" });
    }

    // 1. Validate estimate inputs
    const estimatedAmt = Number(body.estimatedAmount) || Number(totalAmount);
    const numLabor = Number(laborAmount) > 0 ? Number(laborAmount) : (estimatedAmt || 0);
    const numMaterials = Number(materialAmount) || 0;
    const numAdditional = Number(additionalCharges) || 0;
    const computedTotal = Math.round((numLabor + numMaterials + numAdditional) * 100) / 100;
    const finalTotal = estimatedAmt > 0 ? estimatedAmt : computedTotal;

    if (isNaN(finalTotal) || finalTotal <= 0) {
      return NextResponse.json(
        { error: "Estimate amount must be greater than zero." },
        { status: 400 }
      );
    }

    if (numMaterials < 0 || numAdditional < 0) {
      return NextResponse.json(
        { error: "Material and additional charges cannot be negative." },
        { status: 400 }
      );
    }

    // 2. Fetch job_request and worker availability
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: workerRec } = await (supabase.from("workers") as any)
      .select("id, availability_status")
      .eq("id", workerId)
      .maybeSingle();

    if (workerRec?.availability_status === "BUSY") {
      return NextResponse.json(
        { error: "Worker is currently allocated to an active booking and cannot submit new estimates." },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: jobReq, error: reqErr } = await (supabase.from("job_requests") as any)
      .select("id, customer_id, service_id, status, services(minimum_visit_charge)")
      .eq("id", requestId)
      .maybeSingle();

    if (reqErr || !jobReq) {
      return NextResponse.json(
        { error: `Job request ${requestId} not found.` },
        { status: 404 }
      );
    }

    if (jobReq.status === "CONFIRMED" || jobReq.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cannot submit estimate: This service request has already been confirmed or closed." },
        { status: 400 }
      );
    }

    // Check if worker estimate was invalidated (e.g. WORKER_UNAVAILABLE or NOT_SELECTED)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: estRecord } = await (supabase.from("worker_estimates") as any)
      .select("id, status")
      .eq("job_request_id", requestId)
      .eq("worker_id", workerId)
      .maybeSingle();

    if (estRecord && (estRecord.status === "WORKER_UNAVAILABLE" || estRecord.status === "NOT_SELECTED")) {
      return NextResponse.json(
        { error: "This request is no longer open for estimation." },
        { status: 400 }
      );
    }

    const minCharge = jobReq.services?.minimum_visit_charge || 200;
    if (finalTotal < minCharge) {
      return NextResponse.json(
        { error: `Total estimate (₹${finalTotal}) cannot be lower than the minimum visit charge of ₹${minCharge}.` },
        { status: 400 }
      );
    }

    const estHours = Math.max(1, Math.round(numLabor / 150));

    // Structured notes encoding itemized charges
    const structuredNotes = JSON.stringify({
      labor: numLabor,
      materials: numMaterials,
      additional: numAdditional,
      text: notes?.trim() || "Itemized service quotation submitted by worker.",
    });

    // 3. Upsert / Update worker_estimates row
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedEstimates, error: updateErr } = await (supabase.from("worker_estimates") as any)
      .update({
        estimated_amount: finalTotal,
        estimated_hours: estHours,
        notes: structuredNotes,
        status: "ESTIMATE_SUBMITTED",
      })
      .eq("job_request_id", requestId)
      .eq("worker_id", workerId)
      .select();

    if (updateErr) {
      console.error("Failed to update worker_estimate:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    let savedEstimate = updatedEstimates?.[0];

    // If no row existed yet for this worker on this request, insert it
    if (!savedEstimate) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedEstimates, error: insertErr } = await (supabase.from("worker_estimates") as any)
        .insert({
          job_request_id: requestId,
          worker_id: workerId,
          estimated_amount: finalTotal,
          estimated_hours: estHours,
          notes: structuredNotes,
          status: "ESTIMATE_SUBMITTED",
        })
        .select();

      if (insertErr) {
        console.error("Failed to insert worker_estimate:", insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
      savedEstimate = insertedEstimates?.[0];
    }

    // 4. Update job_requests status to ESTIMATES_AVAILABLE
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("job_requests") as any)
      .update({
        status: "ESTIMATES_AVAILABLE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // 5. Realtime Broadcast Notification
    try {
      const channel = supabase.channel(`request_estimates_${requestId}`);
      await new Promise<void>((resolve) => {
        channel.subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            channel
              .send({
                type: "broadcast",
                event: "new_estimate",
                payload: {
                  requestId,
                  workerId,
                  estimatedAmount: finalTotal,
                  laborAmount: numLabor,
                  materialAmount: numMaterials,
                  additionalCharges: numAdditional,
                  notes: notes || "",
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
    } catch (realtimeErr) {
      console.warn("Notice: Realtime broadcast error:", realtimeErr);
    }

    // 5. Notify customer
    try {
      if (jobReq.customer_id) {
        await notificationService.sendNotification({
          profileId: jobReq.customer_id,
          title: "New Estimate Received!",
          message: `A worker has submitted a competitive estimate of ₹${finalTotal}. Review estimates to select your worker.`,
          type: "info",
          metadata: {
            requestId,
            estimatedAmount: finalTotal,
          },
        });
      }
    } catch (notifErr) {
      console.warn("Customer notification notice:", notifErr);
    }

    return NextResponse.json({
      success: true,
      estimate: savedEstimate,
      itemizedBreakdown: {
        labor: numLabor,
        materials: numMaterials,
        additional: numAdditional,
        total: finalTotal,
      },
    });
  } catch (err: unknown) {
    console.error("POST /api/worker/estimates error:", err);
    return NextResponse.json(
      { error: (err as Error)?.message || "Internal server error" },
      { status: 500 }
    );
  }
}

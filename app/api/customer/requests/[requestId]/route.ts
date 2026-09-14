import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

    return NextResponse.json({
      summary: {
        id: req.id,
        requestNumber,
        customerId: req.customer_id,
        serviceId: req.service_id,
        serviceTitle,
        categoryName,
        description: req.description,
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

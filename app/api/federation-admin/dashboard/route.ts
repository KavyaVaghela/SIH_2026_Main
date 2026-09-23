/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { federationAdminService } from "@/features/federation-admin/services/federation-admin-service";
import { complaintService } from "@/features/complaints/services/complaint-service";
import type { DashboardTimeframe } from "@/features/federation-admin/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") as DashboardTimeframe) || "30d";
    const adminClient = createAdminClient();

    // 1. Resolve caller and federation ID
    let adminFedId: string | null = null;
    try {
      const authHeader = request.headers.get("authorization");
      let user: any = null;

      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const { data: userData } = await adminClient.auth.getUser(token);
        if (userData?.user) user = userData.user;
      }

      if (!user) {
        try {
          const serverClient = createServerClient();
          const { data: cookieUserData } = await serverClient.auth.getUser();
          if (cookieUserData?.user) user = cookieUserData.user;
        } catch (_) {}
      }

      if (user) {
        // Check user_metadata.federation_id
        if (user.user_metadata?.federation_id) {
          adminFedId = user.user_metadata.federation_id;
        } else if (user.email) {
          const { data: fedByEmail } = await (adminClient.from("federations") as any)
            .select("id")
            .eq("contact_email", user.email)
            .maybeSingle();
          if (fedByEmail?.id) adminFedId = fedByEmail.id;
        }
      }
    } catch (authErr) {
      console.warn("Notice: Federation context resolution in dashboard route:", authErr);
    }

    // Default canonical Ahmedabad federation ID
    if (!adminFedId) {
      adminFedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
    }

    // 2. Fetch target federation details
    const { data: dbFed } = await (adminClient.from("federations") as any)
      .select("*")
      .eq("id", adminFedId)
      .maybeSingle();

    const targetFed = dbFed || federationAdminService.defaultFederation;

    // 3. Parallel fetch of workers, bookings, complaints, and reviews
    const [workersRes, bookingsRes, reviewsRes] = await Promise.all([
      (adminClient.from("workers") as any)
        .select("id, account_status, availability_status, profession, hourly_rate")
        .eq("federation_id", adminFedId),
      (adminClient.from("bookings") as any)
        .select("id, status, total_amount, created_at, scheduled_start_at")
        .eq("federation_id", adminFedId),
      (adminClient.from("reviews") as any)
        .select("rating"),
    ]);

    // 4. Scoped complaints query
    let dbComplaints: Array<{ id: string; status: string; category: string; created_at: string }> = [];
    try {
      const { cases } = await complaintService.listGrievances({
        role: "FEDERATION_ADMIN",
        federationId: adminFedId,
        pageSize: 200,
      });
      dbComplaints = cases.map((c) => ({
        id: c.id,
        status: c.status,
        category: c.category,
        created_at: c.createdAt,
      }));
    } catch (compErr) {
      console.warn("Notice: Grievance listing in dashboard route:", compErr);
    }

    const data = federationAdminService.transformLiveData(
      targetFed,
      workersRes.data || [],
      bookingsRes.data || [],
      dbComplaints,
      reviewsRes.data || [],
      timeframe
    );

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Federation Admin dashboard API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

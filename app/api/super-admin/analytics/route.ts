import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyticsService } from "@/features/super-admin/analytics/services/analytics-service";
import type { AnalyticsTimeframe } from "@/features/super-admin/analytics/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("range") as AnalyticsTimeframe) || "month";
    const customFrom = searchParams.get("from") || "";
    const customTo = searchParams.get("to") || "";

    const adminClient = createAdminClient();
    const data = await analyticsService.getAnalyticsData(
      { range, customFrom, customTo },
      adminClient
    );

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Super Admin analytics API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

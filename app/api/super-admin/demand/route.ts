import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demandService } from "@/features/super-admin/demand-intelligence/services/demand-service";
import type { DemandDateRange } from "@/features/super-admin/demand-intelligence/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateRange = (searchParams.get("dateRange") as DemandDateRange) || "30d";
    const location = searchParams.get("location") || "ALL";
    const society = searchParams.get("society") || "ALL";
    const service = searchParams.get("service") || "ALL";

    const adminClient = createAdminClient();
    const data = await demandService.getDemandIntelligence(
      { dateRange, location, society, service },
      adminClient
    );

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Super Admin demand intelligence API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

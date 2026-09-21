import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { superAdminService } from "@/features/super-admin/services/super-admin-service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = (searchParams.get("timeframe") as "7d" | "30d" | "90d") || "30d";

    const adminClient = createAdminClient();
    const data = await superAdminService.getOverviewData(timeframe, adminClient);

    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Super Admin overview API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

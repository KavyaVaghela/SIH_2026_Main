import { NextResponse } from "next/server";
import { checkSupabaseHealth } from "@/lib/supabase/health";

export async function GET() {
  const supabaseHealth = await checkSupabaseHealth();

  return NextResponse.json({
    status: supabaseHealth.connected ? "ok" : "degraded",
    platform: "Cooperative Gig Services Platform",
    supabase: supabaseHealth,
    timestamp: new Date().toISOString(),
  });
}

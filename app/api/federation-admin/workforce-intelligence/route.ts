import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { workforceUtilizationService } from "@/features/super-admin/demand-intelligence/services/workforce-utilization-service";
import { workforceRecommendationEngine } from "@/features/super-admin/demand-intelligence/services/workforce-recommendations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const serverSupabase = await createServerClient();
    const {
      data: { user },
    } = await serverSupabase.auth.getUser();

    let federationId: string | null = null;
    if (user?.id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (serverSupabase.from("profiles") as any)
        .select("federation_id")
        .eq("id", user.id)
        .maybeSingle();
      federationId = profile?.federation_id || null;
    }

    // Dev fallback if not logged in
    if (!federationId) {
      federationId = "b765df3b-c418-4a15-b79f-3cbc09e475dc"; // Ahmedabad Skilled Workers Federation default
    }

    const adminClient = createAdminClient();

    // 1. Get utilization summary scoped to this federation
    const utilizationSummary = await workforceUtilizationService.getWorkforceUtilization(
      adminClient,
      federationId
    );

    // 2. Get recommendations targeting this federation
    const recommendations = await workforceRecommendationEngine.getRecommendations(
      adminClient,
      federationId
    );

    // Privacy Protection Safeguard (Phase 3E):
    // For any candidate workers from another federation, strip personal contacts and anonymize names
    const sanitizedRecommendations = recommendations.map((rec) => ({
      ...rec,
      candidateWorkers: (rec.candidateWorkers || []).map((cw, idx) => ({
        ...cw,
        name: `Qualified ${cw.profession} #${idx + 1}`, // Anonymized to prevent data leakage
      })),
    }));

    // 3. High-demand trades in this federation from recent bookings
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: fedBookings } = await (adminClient.from("bookings") as any)
      .select("id, services (title, service_categories (name))")
      .eq("federation_id", federationId)
      .gte("created_at", thirtyDaysAgo);

    const tradeCounts = new Map<string, number>();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fedBookings || []).forEach((b: any) => {
      const trade = b.services?.service_categories?.name || b.services?.title || "Skilled Craft";
      tradeCounts.set(trade, (tradeCounts.get(trade) || 0) + 1);
    });

    const highDemandTrades = Array.from(tradeCounts.entries())
      .map(([trade, count]) => ({ trade, demandCount: count }))
      .sort((a, b) => b.demandCount - a.demandCount);

    return NextResponse.json({
      federationId,
      totalWorkers: utilizationSummary.totalWorkers,
      availableWorkersCount: utilizationSummary.availableWorkers,
      underUtilizedWorkersCount: utilizationSummary.underUtilizedWorkersCount,
      averageUtilizationRate: utilizationSummary.averageUtilizationRate,
      underUtilizedWorkers: utilizationSummary.underUtilizedWorkers.map((w) => ({
        workerId: w.workerId,
        workerName: w.workerName,
        profession: w.profession,
        hourlyRate: w.hourlyRate,
        workedHours14d: w.workedHours14d,
        utilizationRatio: w.utilizationRatio,
        underUtilizedReason: w.underUtilizedReason,
      })),
      highDemandTrades,
      workersByTrade: utilizationSummary.workersByTrade,
      recommendations: sanitizedRecommendations,
      largeProjectDemandHeadcount: utilizationSummary.largeProjectDemandHeadcount,
      emergencyActiveTaskCount: utilizationSummary.emergencyActiveTaskCount,
    });
  } catch (err: unknown) {
    console.error("Federation workforce intelligence API error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

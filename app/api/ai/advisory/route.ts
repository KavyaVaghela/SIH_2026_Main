import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { aiProvider } from "@/lib/ai/ai-provider";
import { getAuthenticatedAiUser } from "@/lib/ai/ai-auth";
import { workforceUtilizationService } from "@/features/super-admin/demand-intelligence/services/workforce-utilization-service";
import type { DemandForecastContext } from "@/lib/ai/ai-types";

export const dynamic = "force-dynamic";

/**
 * Super Admin Advisory Demand Forecasting API Route
 *
 * Security & Governance Requirements:
 * 1. Authenticate Supabase user.
 * 2. Determine role from authenticated profile.
 * 3. Allow SUPER_ADMIN for demand forecasting.
 * 4. Reject unauthorized roles (403).
 * 5. Build structured demand context strictly from REAL platform data.
 * 6. Send ONLY summarized platform statistics to Groq (NO worker names or personal data).
 * 7. Validate AI response and return structured advisory data.
 */
export async function POST(request: Request) {
  try {
    // Parse requested parameters (if provided)
    let body: {
      type?: string;
      trade?: string;
      region?: string;
      mode?: string;
    } = {};
    try {
      body = await request.json();
    } catch {
      // Body may be empty, proceed with defaults
    }

    const auth = await getAuthenticatedAiUser(request);

    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized: Active authenticated session required." },
        { status: 401 }
      );
    }

    const userRole = auth.role;
    const userFedId = auth.federationId;
    const adminClient = createAdminClient();

    // Branch 1: Federation Workforce Advisory Module (Phase 4B)
    if (body.type === "FEDERATION_WORKFORCE_ADVISORY") {
      if (userRole !== "FEDERATION_ADMIN" && userRole !== "SUPER_ADMIN") {
        return NextResponse.json(
          {
            error:
              "Forbidden: Federation Admin role required for Federation AI Intelligence.",
          },
          { status: 403 }
        );
      }

      if (!userFedId) {
        return NextResponse.json(
          {
            error:
              "Forbidden: No active cooperative federation associated with your administrator account.",
          },
          { status: 403 }
        );
      }

      const { buildFederationDemandContext } = await import(
        "@/features/federation-admin/ai-intelligence/services/federation-ai-service"
      );

      const fedContext = await buildFederationDemandContext(adminClient, userFedId);

      if (body.mode === "context-only") {
        return NextResponse.json({ context: fedContext, intelligence: null });
      }

      const intelligence = await aiProvider.getFederationIntelligence(fedContext);
      return NextResponse.json({ context: fedContext, intelligence });
    }

    // Branch 2: Super Admin Demand Forecasting (Phase 4A)
    if (userRole !== "SUPER_ADMIN") {
      return NextResponse.json(
        {
          error:
            "Forbidden: Super Admin role required for AI demand forecasting.",
        },
        { status: 403 }
      );
    }

    const { trade: requestedTrade, region: requestedRegion } = body;

    // 5. Build deterministic demand context from live Supabase data
    const context = await buildDeterministicDemandContext(
      adminClient,
      requestedTrade,
      requestedRegion
    );

    // 6. Send ONLY summarized platform statistics to Groq
    const forecast = await aiProvider.getDemandForecast(context);

    // 9. Return structured advisory data
    return NextResponse.json({
      context,
      forecast,
    });
  } catch (err: unknown) {
    console.error("[AiAdvisoryAPI] Unexpected error:", err);
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * Also support GET for convenience
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const trade = searchParams.get("trade") || undefined;
  const region = searchParams.get("region") || undefined;

  // Delegate to POST handler with simulated body
  const simulatedRequest = new Request(request.url, {
    method: "POST",
    headers: request.headers,
    body: JSON.stringify({ trade, region }),
  });

  return POST(simulatedRequest);
}

/**
 * Builds factual, summarized demand context strictly from real platform records.
 * NEVER exposes worker names, customer names, or personal information.
 */
async function buildDeterministicDemandContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  requestedTrade?: string,
  requestedRegion?: string
): Promise<DemandForecastContext> {
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();

  // 1. Fetch live bookings from past 30 days
  const { data: bookingsData } = await supabase
    .from("bookings")
    .select(
      `
      id,
      created_at,
      services (id, title, service_categories (name)),
      federations (id, name, city)
    `
    )
    .gte("created_at", thirtyDaysAgo);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (bookingsData || []) as any[];

  // 2. Identify top trade & region if not specifically chosen
  let targetTrade = requestedTrade && requestedTrade !== "ALL" ? requestedTrade : "";
  let targetRegion = requestedRegion && requestedRegion !== "ALL" ? requestedRegion : "";

  if (!targetTrade || !targetRegion) {
    const tradeCounts = new Map<string, number>();
    const regionCounts = new Map<string, number>();

    bookings.forEach((b) => {
      const t =
        b.services?.service_categories?.name ||
        b.services?.title ||
        "Plumbing";
      const r = b.federations?.city || "Ahmedabad";
      tradeCounts.set(t, (tradeCounts.get(t) || 0) + 1);
      regionCounts.set(r, (regionCounts.get(r) || 0) + 1);
    });

    if (!targetTrade) {
      let maxT = "Plumbing";
      let maxCount = -1;
      tradeCounts.forEach((count, t) => {
        if (count > maxCount) {
          maxCount = count;
          maxT = t;
        }
      });
      targetTrade = maxT;
    }

    if (!targetRegion) {
      let maxR = "Ahmedabad";
      let maxCount = -1;
      regionCounts.forEach((count, r) => {
        if (count > maxCount) {
          maxCount = count;
          maxR = r;
        }
      });
      targetRegion = maxR;
    }
  }

  // 3. Compute time-scoped demand metrics
  let demand_last_7_days = 0;
  let demand_previous_7_days = 0;
  let demand_last_30_days = 0;

  bookings.forEach((b) => {
    const t =
      b.services?.service_categories?.name || b.services?.title || "";
    const r = b.federations?.city || "";

    const matchesTrade =
      !targetTrade ||
      t.toLowerCase().includes(targetTrade.toLowerCase()) ||
      targetTrade.toLowerCase().includes(t.toLowerCase());
    const matchesRegion =
      !targetRegion ||
      r.toLowerCase().includes(targetRegion.toLowerCase()) ||
      targetRegion.toLowerCase().includes(r.toLowerCase());

    if (matchesTrade && matchesRegion) {
      demand_last_30_days++;
      const createdAt = new Date(b.created_at).getTime();
      if (createdAt >= now - 7 * 86400000) {
        demand_last_7_days++;
      } else if (createdAt >= now - 14 * 86400000) {
        demand_previous_7_days++;
      }
    }
  });

  // 4. Query workforce capacity & utilization (reuses existing workforceUtilizationService)
  const utilizationSummary =
    await workforceUtilizationService.getWorkforceUtilization(supabase);

  // Filter available workers in target region for target trade
  const availableWorkers = utilizationSummary.underUtilizedWorkers.filter((w) => {
    const matchesRegion =
      !targetRegion ||
      w.city.toLowerCase().includes(targetRegion.toLowerCase());
    const matchesTrade =
      !targetTrade ||
      w.profession.toLowerCase().includes(targetTrade.toLowerCase()) ||
      w.skills.some((s) => s.toLowerCase().includes(targetTrade.toLowerCase()));

    return (
      matchesRegion &&
      matchesTrade &&
      w.availabilityStatus === "AVAILABLE"
    );
  });

  const available_workers = Math.max(availableWorkers.length, 1);
  const underutilized_workers = availableWorkers.filter(
    (w) => w.isUnderUtilized
  ).length;

  const shortage = Math.max(0, demand_last_30_days - available_workers);

  return {
    trade: targetTrade,
    region: targetRegion,
    demand_last_7_days,
    demand_previous_7_days,
    demand_last_30_days,
    available_workers,
    underutilized_workers,
    shortage,
    large_project_demand: utilizationSummary.largeProjectDemandHeadcount || 0,
    emergency_workload: utilizationSummary.emergencyActiveTaskCount || 0,
  };
}

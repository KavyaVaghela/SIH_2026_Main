import { workforceUtilizationService } from "@/features/super-admin/demand-intelligence/services/workforce-utilization-service";
import type {
  FederationDemandContext,
  FederationDemandGapItem,
} from "@/lib/ai/ai-types";

/**
 * Builds factual FederationDemandContext strictly from real Supabase platform data.
 * Adheres strictly to data privacy: NO worker names, phone numbers, customer names, or PII.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildFederationDemandContext(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adminClient: any,
  federationId: string
): Promise<FederationDemandContext> {
  // 1. Query federation metadata
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: fedData } = await (adminClient.from("federations") as any)
    .select("id, name, city")
    .eq("id", federationId)
    .maybeSingle();

  const federationName = fedData?.name || "Cooperative Service Federation";
  const region = fedData?.city || "Ahmedabad";

  // 2. Query workforce utilization scoped to this federation
  const utilizationSummary =
    await workforceUtilizationService.getWorkforceUtilization(
      adminClient,
      federationId
    );

  // 3. Query bookings across current period (last 30 days) and previous period (30 to 60 days ago)
  const now = Date.now();
  const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();
  const sixtyDaysAgo = new Date(now - 60 * 86400000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: bookingsData } = await (adminClient.from("bookings") as any)
    .select("id, created_at, services (title, service_categories (name))")
    .eq("federation_id", federationId)
    .gte("created_at", sixtyDaysAgo);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookings = (bookingsData || []) as any[];

  let currentPeriodCount = 0;
  let previousPeriodCount = 0;
  const currentTradeCounts = new Map<string, number>();

function normalizeTrade(trade: string): string {
  const t = trade.trim().toLowerCase();
  if (t === "plumber" || t === "plumbing") return "Plumbing";
  if (t === "electrician" || t === "electrical") return "Electrical";
  if (t === "carpenter" || t === "carpentry") return "Carpentry";
  if (t === "painter" || t === "painting") return "Painting";
  if (t === "cleaner" || t === "cleaning" || t === "house cleaning") return "Cleaning";
  if (t === "gardener" || t === "gardening") return "Gardening";
  if (t.includes("appliance")) return "Appliance Repair";
  return trade.trim();
}

  bookings.forEach((b) => {
    const createdAt = new Date(b.created_at).getTime();
    const rawTrade =
      b.services?.service_categories?.name ||
      b.services?.title ||
      "General Services";
    const trade = normalizeTrade(rawTrade);

    if (createdAt >= now - 30 * 86400000) {
      currentPeriodCount++;
      currentTradeCounts.set(trade, (currentTradeCounts.get(trade) || 0) + 1);
    } else {
      previousPeriodCount++;
    }
  });

  const trend: "INCREASING" | "STABLE" | "DECREASING" =
    currentPeriodCount > previousPeriodCount * 1.1
      ? "INCREASING"
      : currentPeriodCount < previousPeriodCount * 0.9
      ? "DECREASING"
      : "STABLE";

  // Aggregate workers by normalized trade
  const normalizedWorkersByTrade = new Map<
    string,
    { total: number; available: number; underUtilized: number }
  >();

  Object.entries(utilizationSummary.workersByTrade).forEach(([rawTrade, stats]) => {
    const norm = normalizeTrade(rawTrade);
    const existing = normalizedWorkersByTrade.get(norm) || {
      total: 0,
      available: 0,
      underUtilized: 0,
    };
    existing.total += stats.total;
    existing.available += stats.available;
    existing.underUtilized += stats.underUtilized;
    normalizedWorkersByTrade.set(norm, existing);
  });

  // 4. Compute trade-level demand gaps (demand vs available qualified workers)
  const demandGaps: FederationDemandGapItem[] = [];

  const allTrades = new Set<string>([
    ...Array.from(currentTradeCounts.keys()),
    ...Array.from(normalizedWorkersByTrade.keys()),
  ]);

  allTrades.forEach((trade) => {
    const demand = currentTradeCounts.get(trade) || 0;
    const stats = normalizedWorkersByTrade.get(trade) || {
      total: 0,
      available: 0,
      underUtilized: 0,
    };
    const available_qualified_workers = stats.available;
    const demand_gap = Math.max(0, demand - available_qualified_workers);

    if (demand > 0 || stats.total > 0) {
      demandGaps.push({
        trade,
        demand,
        available_qualified_workers,
        demand_gap,
      });
    }
  });

  // Sort by demand gap descending
  demandGaps.sort((a, b) => b.demand_gap - a.demand_gap);

  const totalActive = utilizationSummary.totalWorkers;
  const available = utilizationSummary.availableWorkers;
  const underutilized = utilizationSummary.underUtilizedWorkersCount;
  const busy = Math.max(0, totalActive - available);

  return {
    federation_id: federationId,
    federation_name: federationName,
    region,
    demand: {
      current_period: currentPeriodCount,
      previous_period: previousPeriodCount,
      trend,
    },
    workforce: {
      total_active: totalActive,
      available,
      busy,
      underutilized,
    },
    demand_gaps: demandGaps.slice(0, 8), // Top trades
    project_workload: utilizationSummary.largeProjectDemandHeadcount || 0,
    emergency_workload: utilizationSummary.emergencyActiveTaskCount || 0,
  };
}

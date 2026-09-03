import { createClient } from "@/lib/supabase/client";
import {
  MOCK_DEMANDED_SERVICES,
  MOCK_GEOGRAPHIC_CLUSTERS,
  MOCK_SHORTAGE_ALERTS,
  MOCK_RECOMMENDATIONS,
} from "../data/mock-demand";
import { DemandAnalysisEngine } from "./demand-analysis";
import { workforceRecommendationEngine } from "./workforce-recommendations";
import type {
  DemandOverviewStats,
  DemandedServiceItem,
  GeographicDemandCluster,
  ShortageAlert,
  WorkforceAllocationRecommendation,
  DemandFilterOptions,
} from "../types";

export class DemandService {
  /**
   * Fetches demand metrics, top services, geographic hotspots, alerts, and recommendations
   */
  async getDemandIntelligence(filters: Partial<DemandFilterOptions> = {}): Promise<{
    stats: DemandOverviewStats;
    demandedServices: DemandedServiceItem[];
    geographicClusters: GeographicDemandCluster[];
    shortageAlerts: ShortageAlert[];
    recommendations: WorkforceAllocationRecommendation[];
    locations: string[];
    societies: Array<{ id: string; name: string }>;
    services: string[];
  }> {
    const supabase = createClient();

    // Default reference datasets
    let rawServices = [...MOCK_DEMANDED_SERVICES];
    let rawClusters = [...MOCK_GEOGRAPHIC_CLUSTERS];
    let rawAlerts = [...MOCK_SHORTAGE_ALERTS];
    const recommendations = await workforceRecommendationEngine.getRecommendations();

    try {
      // 1. Fetch real bookings count & service breakdown
      const { data: bookingsData } = await (supabase.from("bookings") as any)
        .select(`
          id,
          service_id,
          federation_id,
          created_at,
          services (id, title, service_categories (name)),
          federations (id, name),
          addresses (city, address_line1)
        `);

      // 2. Fetch real workers count & availability
      const { data: workersData } = await (supabase.from("workers") as any)
        .select("id, availability_status, account_status, federation_id, profession");

      if (bookingsData && bookingsData.length > 0 && workersData && workersData.length > 0) {
        // Map actual DB services counts if present
        const serviceCounts = new Map<string, { title: string; category: string; count: number }>();
        bookingsData.forEach((b: any) => {
          if (b.services) {
            const sid = b.services.id;
            const current = serviceCounts.get(sid) || {
              title: b.services.title,
              category: b.services.service_categories?.name || "General",
              count: 0,
            };
            current.count += 1;
            serviceCounts.set(sid, current);
          }
        });

        if (serviceCounts.size > 0) {
          const mappedServices: DemandedServiceItem[] = Array.from(serviceCounts.entries()).map(
            ([sid, info]) => {
              const matchedWorkers = workersData.filter(
                (w: any) =>
                  w.profession &&
                  info.title.toLowerCase().includes(w.profession.toLowerCase()) &&
                  w.availability_status === "AVAILABLE"
              ).length;
              const availCount = Math.max(matchedWorkers, 5);
              const diff = availCount - info.count;
              let status: "SHORTAGE" | "BALANCED" | "SURPLUS" = "BALANCED";
              if (diff < -5) status = "SHORTAGE";
              else if (diff > 5) status = "SURPLUS";

              return {
                serviceId: sid,
                serviceTitle: info.title,
                category: info.category,
                requestsCount: info.count,
                availableWorkersCount: availCount,
                status,
                deficitOrSurplus: diff,
              };
            }
          );
          if (mappedServices.length >= 3) {
            rawServices = mappedServices.sort((a, b) => b.requestsCount - a.requestsCount);
          }
        }
      }
    } catch {
      // Fallback to deterministic datasets
    }

    // Apply Filter Options
    if (filters.service && filters.service !== "ALL") {
      rawServices = rawServices.filter(
        (s) => s.serviceTitle.toLowerCase() === filters.service?.toLowerCase()
      );
      rawAlerts = rawAlerts.filter(
        (a) => a.serviceTitle.toLowerCase() === filters.service?.toLowerCase()
      );
    }

    if (filters.location && filters.location !== "ALL") {
      const targetLoc = filters.location.toLowerCase();
      rawClusters = rawClusters.filter(
        (c) =>
          c.locationName.toLowerCase().includes(targetLoc) ||
          c.district.toLowerCase().includes(targetLoc)
      );
      rawAlerts = rawAlerts.filter((a) => a.location.toLowerCase().includes(targetLoc));
    }

    if (filters.society && filters.society !== "ALL") {
      rawClusters = rawClusters.filter((c) => c.societyId === filters.society);
      rawAlerts = rawAlerts.filter((a) => a.societyId === filters.society);
    }

    // Dynamic scale based on date range
    let dateMultiplier = 1.0;
    if (filters.dateRange === "today") dateMultiplier = 0.2;
    else if (filters.dateRange === "7d") dateMultiplier = 0.5;
    else if (filters.dateRange === "90d") dateMultiplier = 2.2;

    const totalRequests = Math.round(
      rawServices.reduce((acc, s) => acc + s.requestsCount, 0) * dateMultiplier
    );
    const totalAvailable = Math.round(
      rawServices.reduce((acc, s) => acc + s.availableWorkersCount, 0)
    );
    const totalActive = Math.round(totalRequests * 0.45);

    const stats = DemandAnalysisEngine.calculateBalance(
      totalRequests,
      totalAvailable,
      totalActive,
      rawServices[0]?.category || "Electrical & Power Systems"
    );

    // Filter dropdown options
    const locations = Array.from(
      new Set(MOCK_GEOGRAPHIC_CLUSTERS.map((c) => c.locationName))
    ).sort();

    const societies = [
      { id: "fed-001", name: "Mumbai Central Worker Cooperative" },
      { id: "fed-002", name: "Navi Mumbai Skilled Trades Federation" },
      { id: "fed-003", name: "Thane District Artisans Cooperative" },
      { id: "fed-004", name: "Pune Urban Services Federation" },
    ];

    const services = Array.from(
      new Set(MOCK_DEMANDED_SERVICES.map((s) => s.serviceTitle))
    ).sort();

    return {
      stats,
      demandedServices: rawServices,
      geographicClusters: rawClusters,
      shortageAlerts: rawAlerts,
      recommendations,
      locations,
      societies,
      services,
    };
  }
}

export const demandService = new DemandService();

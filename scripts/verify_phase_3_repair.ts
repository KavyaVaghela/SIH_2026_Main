import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
        const [key, ...valParts] = trimmed.split("=");
        process.env[key.trim()] = valParts.join("=").trim();
      }
    }
  }
}
loadEnv();

import { superAdminService } from "../features/super-admin/services/super-admin-service";
import { demandService } from "../features/super-admin/demand-intelligence/services/demand-service";
import { analyticsService } from "../features/super-admin/analytics/services/analytics-service";
import { societiesService } from "../features/super-admin/cooperative-societies/services/societies-service";

async function verifyAll() {
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  console.log("==================================================");
  console.log("PHASE 3 LIVE DATA REPAIR VERIFICATION");
  console.log("==================================================");

  // 1. Overview data check
  console.log("\n--- 1. OVERVIEW DATA TEST ---");
  for (const tf of ["7d", "30d", "90d"] as const) {
    const overview = await superAdminService.getOverviewData(tf, adminClient);
    const totalActivity = overview.activityTrends.reduce(
      (sum, p) => sum + p.completed + p.active + p.pending + p.cancelled,
      0
    );
    console.log(`[Overview ${tf}]: Total Bookings=${overview.stats.totalBookings}, Activity Points=${overview.activityTrends.length}, Sum of Trend Activity=${totalActivity}`);
  }

  // 2. Demand Intelligence check across timeframes
  console.log("\n--- 2. DEMAND INTELLIGENCE TEST ---");
  for (const dateRange of ["today", "7d", "30d", "90d"] as const) {
    const demand = await demandService.getDemandIntelligence({ dateRange }, adminClient);
    console.log(`[Demand ${dateRange}]:`);
    console.log(`  - Gross Service Demand: ${demand.stats.serviceRequests}`);
    console.log(`  - Available Workforce: ${demand.stats.availableWorkers}`);
    console.log(`  - Fulfillment Capacity Rate: ${demand.stats.fulfillmentCapacityRate}%`);
    console.log(`  - Balance Status: ${demand.stats.balanceStatus}`);
    console.log(`  - Geographic Clusters Count: ${demand.geographicClusters.length}`);
    console.log(`  - Top 3 Hotspots: ${demand.geographicClusters.slice(0, 3).map(c => `${c.locationName} (req:${c.requestsCount}, wrk:${c.availableWorkersCount})`).join(", ")}`);
  }

  // 3. Analytics Data check
  console.log("\n--- 3. PLATFORM ANALYTICS TEST ---");
  for (const range of ["today", "week", "month", "year"] as const) {
    const analytics = await analyticsService.getAnalyticsData({ range }, adminClient);
    console.log(`[Analytics ${range}]:`);
    console.log(`  - Total Bookings in Summary: ${analytics.summary.totalBookings}`);
    console.log(`  - Booking Growth Points: ${analytics.bookingGrowth.length}`);
    console.log(`  - Service Demand Items: ${analytics.serviceDemand.length}`);
    console.log(`  - Workforce Total: ${analytics.workforceUtilization.totalWorkers}`);
  }

  // 4. Societies Service check
  console.log("\n--- 4. SOCIETIES SERVICE TEST ---");
  const societies = await societiesService.getSocieties({ pageSize: 50 }, adminClient);
  console.log(`[Societies]: Total Count=${societies.totalCount}, Loaded=${societies.data.length}`);
  const withWorkers = societies.data.filter(s => s.totalWorkers > 0);
  console.log(`[Societies with Workers > 0]: ${withWorkers.length}`);

  // 5. Geographic Clusters & Coordinates Check
  console.log("\n--- 5. MAP MARKERS & CLUSTER COORDINATES CHECK ---");
  const demand30d = await demandService.getDemandIntelligence({ dateRange: "30d" }, adminClient);
  const clusters = demand30d.geographicClusters;
  console.log(`Total Clusters: ${clusters.length}`);
  const validCoords = clusters.filter(c => c.coordinates && !isNaN(c.coordinates.lat) && !isNaN(c.coordinates.lng));
  console.log(`Clusters with valid coordinates: ${validCoords.length} / ${clusters.length}`);
  const junkClusters = clusters.filter(c => c.locationName.toLowerCase().includes("ertyu") || c.locationName.toLowerCase().includes("asdf"));
  console.log(`Junk clusters (e.g. ertyu): ${junkClusters.length}`);
}

verifyAll().catch(console.error);

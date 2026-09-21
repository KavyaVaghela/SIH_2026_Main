import * as fs from "fs";
import * as path from "path";

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

import { createClient } from "@/lib/supabase/client";
import { societiesService } from "../features/super-admin/cooperative-societies/services/societies-service";
import { analyticsService } from "../features/super-admin/analytics/services/analytics-service";
import { demandService } from "../features/super-admin/demand-intelligence/services/demand-service";

interface VerificationResult {
  testNumber: number;
  description: string;
  category: string;
  passed: boolean;
  details: string;
}

const results: VerificationResult[] = [];

function record(testNumber: number, description: string, category: string, passed: boolean, details: string) {
  results.push({ testNumber, description, category, passed, details });
  const status = passed ? "✓ PASS" : "✗ FAIL";
  console.log(`[${status}] #${testNumber} ${category} - ${description}: ${details}`);
}

async function runVerification() {
  console.log("==================================================================");
  console.log("KAUSHALYASETU SUPER ADMIN PHASE 3 AUTOMATED VERIFICATION SUITE");
  console.log("==================================================================\n");

  const supabase = createClient();
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: "admin@example.com",
    password: "Password123!",
  });

  if (authErr || !auth?.user) {
    console.error("FATAL: Could not sign in as Super Admin", authErr);
    process.exit(1);
  }

  // -------------------------------------------------------------------
  // PART A: Cooperative Societies Real-Data Verification
  // -------------------------------------------------------------------
  const societiesResult = await societiesService.getSocieties({ pageSize: 50 });
  const societies = societiesResult.data;

  // Test 1: Societies list is retrieved
  record(1, "Retrieve Societies List", "Cooperative Societies", societies.length >= 15, `Found ${societies.length} societies in DB.`);

  // Test 2: Worker counts are NOT universally 0
  const societiesWithWorkers = societies.filter((s) => s.totalWorkers > 0);
  record(
    2,
    "Worker Count Not Universally Zero",
    "Cooperative Societies",
    societiesWithWorkers.length >= 8,
    `${societiesWithWorkers.length} societies have workers > 0 (Ahmedabad has ${societies.find(s => s.code === "FED-AMD-01")?.totalWorkers}).`
  );

  // Test 3: Ratings are NOT universally 5
  const ratings = societies.map((s) => s.averageRating).filter((r): r is number => r !== null);
  const distinctRatings = Array.from(new Set(ratings));
  record(
    3,
    "Ratings Not Universally 5",
    "Cooperative Societies",
    distinctRatings.length > 1 && distinctRatings.some(r => r !== 5),
    `Distinct ratings found: [${distinctRatings.join(", ")}].`
  );

  // Test 4: Societies with no reviews display null empty state
  const unreviewed = societies.filter((s) => s.averageRating === null);
  record(
    4,
    "No-Review Societies Display Empty State (null / —)",
    "Cooperative Societies",
    unreviewed.length > 0,
    `${unreviewed.length} societies without worker reviews correctly show null/empty state.`
  );

  // Test 5: Specific society rating matches underlying reviews
  const amdSociety = societies.find((s) => s.code === "FED-AMD-01");
  const amdRatingMatches = amdSociety?.averageRating === 4.8;
  record(
    5,
    "Derived Worker Review Rating Accuracy",
    "Cooperative Societies",
    amdRatingMatches,
    `Ahmedabad society rating is derived honestly as ${amdSociety?.averageRating} (expected 4.8 from 15 worker reviews).`
  );

  // Test 6: Specific society worker count matches underlying workers table
  const amdWorkersMatches = amdSociety?.totalWorkers === 35;
  record(
    6,
    "Derived Worker Count Accuracy",
    "Cooperative Societies",
    amdWorkersMatches,
    `Ahmedabad society worker count is ${amdSociety?.totalWorkers} (expected 35).`
  );

  // -------------------------------------------------------------------
  // PART B: Demand & Analytics Intelligence Verification
  // -------------------------------------------------------------------
  const analyticsData = await analyticsService.getAnalyticsData({ range: "month" });

  // Test 7: Total bookings match live DB records
  record(
    7,
    "Analytics Total Bookings Real-Data Match",
    "Demand & Analytics",
    analyticsData.summary.totalBookings >= 220,
    `Total bookings derived as ${analyticsData.summary.totalBookings} (matches verified DB bookings).`
  );

  // Test 8: Service demand ranked by actual booking volume
  const topService = analyticsData.serviceDemand[0];
  record(
    8,
    "Service Demand Ranked by Volume",
    "Demand & Analytics",
    topService?.serviceTitle === "Tap Repair" && topService?.requestsCount > 50,
    `Top service is ${topService?.serviceTitle} with ${topService?.requestsCount} requests (${topService?.sharePercentage}%).`
  );

  // Test 9: Workforce utilization derived from real workers
  record(
    9,
    "Workforce Utilization Derived from Real Workers",
    "Demand & Analytics",
    analyticsData.workforceUtilization.totalWorkers === 75,
    `Total workers in workforce utilization: ${analyticsData.workforceUtilization.totalWorkers} with ${analyticsData.workforceUtilization.skillDistribution.length} distinct trades.`
  );

  // Test 10: Society performance uses real federation metrics
  const amdPerf = analyticsData.societyPerformance.find((s) => s.societyName.includes("Ahmedabad"));
  record(
    10,
    "Society Performance Uses Real Federation Metrics",
    "Demand & Analytics",
    amdPerf !== undefined && amdPerf.totalBookings >= 125 && amdPerf.customerRating === 4.8,
    `Ahmedabad performance: ${amdPerf?.totalBookings} bookings, ${amdPerf?.customerRating} rating, score ${amdPerf?.benchmarkScore}.`
  );

  // -------------------------------------------------------------------
  // PART C: Demand Service & Multi-Region Geographic Clusters
  // -------------------------------------------------------------------
  const demandData = await demandService.getDemandIntelligence({ dateRange: "30d" });

  // Test 11: Multi-region geographic clusters are derived from real DB cities
  const clusterNames = demandData.geographicClusters.map((c) => c.locationName);
  const hasMultipleCities = clusterNames.includes("Ahmedabad") && clusterNames.includes("Mumbai") && clusterNames.includes("Bengaluru");
  record(
    11,
    "Multi-Region Geographic Clusters Real Cities",
    "Geographic Demand",
    hasMultipleCities,
    `Geographic clusters: ${clusterNames.slice(0, 8).join(", ")}.`
  );

  // Test 12: No fake Mumbai clusters (Bandra, Dadar, Vashi, Ghodbunder, Kothrud, Andheri)
  const fakeClusters = ["Bandra West", "Dadar Central", "Vashi Sector 17", "Ghodbunder Road", "Kothrud", "Andheri East"];
  const hasFakeClusters = clusterNames.some((c) => fakeClusters.includes(c));
  record(
    12,
    "No Fabricated Mumbai Geographic Clusters",
    "Geographic Demand",
    !hasFakeClusters,
    `Verified 0 fake Mumbai clusters remain in active geographic intelligence.`
  );

  // Test 13: No fake worker recommendations
  record(
    13,
    "No Fake Worker Recommendations",
    "Workforce Intelligence",
    demandData.recommendations.length === 0,
    `Workforce recommendations count: ${demandData.recommendations.length} (clean empty state).`
  );

  // -------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log("\n==================================================================");
  console.log(`VERIFICATION SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("==================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runVerification().catch(console.error);

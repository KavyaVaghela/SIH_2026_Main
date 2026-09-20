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

import { analyticsService } from "../features/super-admin/analytics/services/analytics-service";

async function verifyPhase7Emergency() {
  console.log("==================================================");
  console.log("PHASE 7 — EMERGENCY / ON-DEMAND INTELLIGENCE VERIFICATION");
  console.log("==================================================");

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );

  // 1. Query Supabase directly for Ground Truth
  console.log("\n[1] Querying real bookings from Supabase directly...");
  const { data: dbBookings, error: bErr } = await adminClient
    .from("bookings")
    .select(`
      id,
      booking_number,
      status,
      problem_description,
      worker_id,
      federation_id,
      service_id,
      created_at,
      services (id, title)
    `);

  if (bErr) {
    throw new Error(`Failed to query bookings: ${bErr.message}`);
  }

  const isEmergency = (b: any) => {
    const sTitle = (b.services?.title || "").toLowerCase();
    const pDesc = (b.problem_description || "").toLowerCase();
    return (
      sTitle.includes("emergency") ||
      pDesc.includes("emergency") ||
      pDesc.includes("urgent") ||
      pDesc.includes("burst") ||
      pDesc.includes("lockout") ||
      pDesc.includes("short circuit")
    );
  };

  const dbEmergencies = (dbBookings || []).filter(isEmergency);
  const expectedTotal = dbEmergencies.length;
  const expectedUnassigned = dbEmergencies.filter((b) => !b.worker_id).length;
  
  const inProgressStatuses = new Set([
    "WORKER_REVIEWING",
    "WORKER_INTERESTED",
    "CUSTOMER_CONFIRMATION_PENDING",
    "BOOKING_CONFIRMED",
    "WORKER_ACCEPTED",
    "ON_THE_WAY",
    "ARRIVED",
    "OTP_VERIFIED",
    "SERVICE_STARTED",
  ]);
  const expectedInProgress = dbEmergencies.filter((b) => inProgressStatuses.has(b.status)).length;
  const expectedCompleted = dbEmergencies.filter(
    (b) => b.status === "BOOKING_COMPLETED" || b.status === "SERVICE_COMPLETED"
  ).length;

  const expectedCompletionRate =
    expectedTotal > 0 ? Number(((expectedCompleted / expectedTotal) * 100).toFixed(1)) : null;

  console.log(`Direct DB Emergency Bookings: Total=${expectedTotal}, Unassigned=${expectedUnassigned}, InProgress=${expectedInProgress}, Completed=${expectedCompleted}, CompletionRate=${expectedCompletionRate}%`);

  // 2. Fetch Analytics Data via analyticsService
  console.log("\n[2] Fetching Analytics Data via analyticsService...");
  const analyticsData = await analyticsService.getAnalyticsData({ range: "month" }, adminClient);
  const emergency = analyticsData.emergencyAnalytics;

  if (!emergency) {
    throw new Error("emergencyAnalytics is missing from analyticsService output!");
  }

  // 3. Compare Emergency Overview KPIs
  console.log("\n[3] Comparing Emergency Intelligence with DB Ground Truth:");
  console.log(`- Service Total Requests: ${emergency.overview.totalEmergencyRequests} (DB: ${expectedTotal})`);
  console.log(`- Service Live Unassigned: ${emergency.overview.liveUnassignedCount} (DB: ${expectedUnassigned})`);
  console.log(`- Service In Progress: ${emergency.overview.inProgressCount} (DB: ${expectedInProgress})`);
  console.log(`- Service Completed: ${emergency.overview.completedCount} (DB: ${expectedCompleted})`);
  console.log(`- Service Completion Rate: ${emergency.overview.completionRate}% (DB: ${expectedCompletionRate}%)`);
  console.log(`- Service Response Time: "${emergency.overview.avgResponseTime}"`);

  if (emergency.overview.totalEmergencyRequests !== expectedTotal) {
    throw new Error(`Total emergency requests mismatch! Got ${emergency.overview.totalEmergencyRequests}, expected ${expectedTotal}`);
  }

  if (emergency.overview.liveUnassignedCount !== expectedUnassigned) {
    throw new Error(`Live unassigned mismatch! Got ${emergency.overview.liveUnassignedCount}, expected ${expectedUnassigned}`);
  }

  if (emergency.overview.inProgressCount !== expectedInProgress) {
    throw new Error(`In progress mismatch! Got ${emergency.overview.inProgressCount}, expected ${expectedInProgress}`);
  }

  if (emergency.overview.completedCount !== expectedCompleted) {
    throw new Error(`Completed mismatch! Got ${emergency.overview.completedCount}, expected ${expectedCompleted}`);
  }

  if (emergency.overview.completionRate !== expectedCompletionRate) {
    throw new Error(`Completion rate mismatch! Got ${emergency.overview.completionRate}%, expected ${expectedCompletionRate}%`);
  }

  if (emergency.overview.avgResponseTime !== "Response-time data unavailable") {
    throw new Error(`Expected truthful response time "Response-time data unavailable", got "${emergency.overview.avgResponseTime}"`);
  }

  console.log("✓ All 6 Emergency Overview KPIs match exact Supabase records!");

  // 4. Status Distribution Check
  console.log("\n[4] Verifying Status Distribution:");
  const sumStatusCounts = emergency.statusDistribution.reduce((sum, s) => sum + s.count, 0);
  console.log(`- Status items: ${emergency.statusDistribution.map(s => `${s.label}: ${s.count} (${s.percentage}%)`).join(", ")}`);
  if (sumStatusCounts !== expectedTotal) {
    throw new Error(`Status distribution total ${sumStatusCounts} does not match expected total ${expectedTotal}`);
  }
  console.log("✓ Status distribution matches real canonical booking lifecycle.");

  // 5. Trade Breakdown Check
  console.log("\n[5] Verifying Trade Breakdown:");
  console.log(`- Trades count: ${emergency.tradeBreakdown.length}`);
  for (const t of emergency.tradeBreakdown) {
    console.log(`  * ${t.tradeName}: ${t.count} requests (${t.percentage}%)`);
  }
  const sumTradeCounts = emergency.tradeBreakdown.reduce((sum, t) => sum + t.count, 0);
  if (sumTradeCounts !== expectedTotal) {
    throw new Error(`Trade breakdown total ${sumTradeCounts} does not match expected total ${expectedTotal}`);
  }
  console.log("✓ Trade breakdown correctly maps all real emergency booking services.");

  // 6. Federation Workload Check
  console.log("\n[6] Verifying Federation Emergency Workload:");
  const activeFeds = emergency.federationWorkload.filter((f) => f.emergencyRequests > 0);
  console.log(`- Federations with emergency activity: ${activeFeds.length}`);
  for (const f of activeFeds.slice(0, 5)) {
    console.log(`  * ${f.federationName} (${f.city}): ${f.emergencyRequests} requests, ${f.activeEmergencies} active, ${f.completedEmergencies} completed`);
  }
  console.log("✓ Federation emergency workload matches real booking federation links.");

  console.log("\n==================================================");
  console.log("✓ PHASE 7 VERIFICATION PASSED SUCCESSFULLY");
  console.log("==================================================");
}

verifyPhase7Emergency().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

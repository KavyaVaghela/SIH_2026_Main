import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { bookingsService } from "../features/super-admin/bookings/services/bookings-service";
import { analyticsService } from "../features/super-admin/analytics/services/analytics-service";

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function run() {
  console.log("=== 1. DATABASE TOTALS & DATE RANGES ===");
  const { count: totalBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true });
  console.log("Total Bookings in DB:", totalBookings);

  // Today start (IST is UTC+5:30. At 2026-09-23 00:00 IST => 2026-09-22 18:30 UTC)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());
  console.log("Today Bookings (created_at >= " + todayStart.toISOString() + "):", todayBookings);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { count: last7dBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true })
    .gte("created_at", sevenDaysAgo.toISOString());
  console.log("Last 7 Days Bookings (created_at >= " + sevenDaysAgo.toISOString() + "):", last7dBookings);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const { count: last30dBookings } = await supabase.from("bookings").select("*", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString());
  console.log("Last 30 Days Bookings (created_at >= " + thirtyDaysAgo.toISOString() + "):", last30dBookings);

  console.log("\n=== 2. BOOKINGS SERVICE STATS (Client-side / SSR API) ===");
  const statsToday = await bookingsService.getBookingStats("today", supabase as any);
  console.log("Stats [today]:", statsToday);

  const stats7d = await bookingsService.getBookingStats("7d", supabase as any);
  console.log("Stats [7d]:", stats7d);

  const stats30d = await bookingsService.getBookingStats("30d", supabase as any);
  console.log("Stats [30d]:", stats30d);

  const statsAll = await bookingsService.getBookingStats("all", supabase as any);
  console.log("Stats [all]:", statsAll);

  console.log("\n=== 3. BOOKINGS LIST PAGINATION & FILTERING ===");
  const listToday = await bookingsService.getBookings({ dateRange: "today", pageSize: 5 }, supabase as any);
  console.log("List [today] total:", listToday.totalCount, "items returned:", listToday.data.length);
  if (listToday.data.length > 0) {
    console.log("Sample today booking:", {
      bookingNumber: listToday.data[0].bookingNumber,
      serviceName: listToday.data[0].serviceName,
      status: listToday.data[0].status,
      societyName: listToday.data[0].societyName,
      createdAt: listToday.data[0].createdAt
    });
  }

  const listAll = await bookingsService.getBookings({ pageSize: 5 }, supabase as any);
  console.log("List [all] total:", listAll.totalCount, "items returned:", listAll.data.length);

  console.log("\n=== 4. ANALYTICS SERVICE VALIDATION ===");
  const analytics = await analyticsService.getAnalyticsData({ dateRange: "all" }, supabase as any);
  console.log("Workforce Utilization:", {
    available: analytics.workforceUtilization.availableCount,
    active: analytics.workforceUtilization.activeCount,
    total: analytics.workforceUtilization.totalWorkers,
    rate: analytics.workforceUtilization.overallUtilizationRate + "%"
  });

  console.log("Financial Overview:", {
    totalVolume: "₹" + analytics.financialAnalytics.overview.totalTransactionVolume.toLocaleString("en-IN"),
    fedShare: "₹" + analytics.financialAnalytics.overview.federationShare.toLocaleString("en-IN"),
    workerEarnings: "₹" + analytics.financialAnalytics.overview.workerEarnings.toLocaleString("en-IN"),
    commission: "₹" + analytics.financialAnalytics.overview.platformCommission.toLocaleString("en-IN"),
    paidInvoices: analytics.financialAnalytics.overview.paidInvoicesCount
  });

  console.log("Top Federations by Financial Activity:");
  analytics.financialAnalytics.federationFinancials.slice(0, 5).forEach(f => {
    console.log(` - ${f.federationName} (${f.city}): ${f.transactionCount} txns, ₹${f.transactionVolume.toLocaleString("en-IN")}`);
  });

  console.log("Emergency Intelligence:", {
    total: analytics.emergencyAnalytics.overview.totalEmergencyRequests,
    completed: analytics.emergencyAnalytics.overview.completedCount,
    inProgress: analytics.emergencyAnalytics.overview.inProgressCount,
    unassigned: analytics.emergencyAnalytics.overview.liveUnassignedCount,
    completionRate: analytics.emergencyAnalytics.overview.completionRate + "%"
  });

  console.log("Federation Emergency Workload:");
  analytics.emergencyAnalytics.federationWorkload.slice(0, 5).forEach(e => {
    console.log(` - ${e.federationName}: ${e.emergencyRequests} total (${e.completedEmergencies} completed, ${e.activeEmergencies} active)`);
  });

  console.log("Top Performing Societies:");
  analytics.societyPerformance.slice(0, 5).forEach(s => {
    console.log(` - ${s.societyName}: ${s.benchmarkScore} pts (Grade ${s.benchmarkGrade}), ${s.workerUtilization}% util, ${s.completionRate}% completion, rating ${s.customerRating}`);
  });
}

run().catch(console.error);

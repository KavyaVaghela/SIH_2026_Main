import { createClient } from "@supabase/supabase-js";
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("================================================================");
  console.log("📊 PHASE 6 FINAL VERIFICATION & DATA INTEGRITY AUDIT");
  console.log("================================================================");

  // 1. Analytics Service Verification
  const { AnalyticsService } = await import("../features/super-admin/analytics/services/analytics-service");
  const service = new AnalyticsService();
  const analyticsRes = await service.getAnalyticsData({ range: "all" }, supabase);

  console.log("\n[1] EMERGENCY INTELLIGENCE METRICS:");
  console.log("----------------------------------");
  console.log("Total Emergency Requests:", analyticsRes.emergencyAnalytics.overview.totalEmergencyRequests);
  console.log("Completed Emergencies:", analyticsRes.emergencyAnalytics.overview.completedCount);
  console.log("In-Progress Emergencies:", analyticsRes.emergencyAnalytics.overview.inProgressCount);
  console.log("Live Unassigned:", analyticsRes.emergencyAnalytics.overview.liveUnassignedCount);
  console.log("Completion Rate:", analyticsRes.emergencyAnalytics.overview.completionRate + "%");
  console.log("Avg Response Time:", analyticsRes.emergencyAnalytics.overview.avgResponseTime);
  console.log("Status Distribution:", analyticsRes.emergencyAnalytics.statusDistribution);
  console.log("Trade Breakdown:", analyticsRes.emergencyAnalytics.tradeBreakdown);

  console.log("\n[2] COOPERATIVE SOCIETY PERFORMANCE BENCHMARKING:");
  console.log("-------------------------------------------------");
  analyticsRes.societyPerformance.forEach((s, idx) => {
    console.log(`Rank #${idx + 1}: ${s.societyName} (${s.location})`);
    console.log(`   Score: ${s.benchmarkScore} pts (Grade ${s.benchmarkGrade}) ${s.highlightBadge ? `[${s.highlightBadge}]` : ""}`);
    console.log(`   Total Bookings: ${s.totalBookings}`);
    console.log(`   Completion Rate: ${s.completionRate}% | Worker Util: ${s.workerUtilization}%`);
    console.log(`   Rating: ${s.customerRating} ⭐ | Cancellation Rate: ${s.cancellationRate}% | Complaints: ${s.complaintsCount}`);
  });

  // 2. Workforce Intelligence Verification (Preservation of Ahmedabad)
  console.log("\n[3] AHMEDABAD WORKFORCE PRESERVATION AUDIT:");
  console.log("-------------------------------------------");
  const { data: ahmedabadWorkers } = await supabase
    .from("workers")
    .select("id, profile_id, federation_id, availability_status, account_status, profession, profiles (full_name), federations (name, city)")
    .eq("federations.city", "Ahmedabad");

  // Also query by federation_id matching Ahmedabad Skilled Workers Federation
  const { data: amdFed } = await supabase.from("federations").select("id, name").ilike("name", "%Ahmedabad Skilled%").single();
  const { data: amdWorkersDirect } = await supabase
    .from("workers")
    .select("id, profile_id, federation_id, availability_status, account_status, profession, profiles (full_name)")
    .eq("federation_id", amdFed?.id || "");

  const totalAhmd = amdWorkersDirect?.length || 0;
  const availAhmd = amdWorkersDirect?.filter(w => w.availability_status === "AVAILABLE").length || 0;
  console.log(`Ahmedabad Fed ID: ${amdFed?.id} (${amdFed?.name})`);
  console.log(`Ahmedabad Total Workers: ${totalAhmd} (Expected: 32)`);
  console.log(`Ahmedabad Available Workers: ${availAhmd} (Expected: 31)`);

  // 3. Ravi Patel Verification
  console.log("\n[4] RAVI PATEL (PROTECTED WORKER) AUDIT:");
  console.log("----------------------------------------");
  const raviId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
  const { data: raviWorker } = await supabase
    .from("workers")
    .select("id, profile_id, federation_id, availability_status, rating_average, rating_count, profiles (full_name)")
    .eq("id", raviId)
    .single();
  const { data: raviBookings } = await supabase.from("bookings").select("id, status, created_at").eq("worker_id", raviId);
  const raviCompleted = raviBookings?.filter(b => b.status === "BOOKING_COMPLETED" || b.status === "SERVICE_COMPLETED").length || 0;
  console.log(`Ravi Patel Name: ${(raviWorker as any)?.profiles?.full_name}`);
  console.log(`Ravi Patel Rating: ${raviWorker?.rating_average} ⭐ (Count: ${raviWorker?.rating_count})`);
  console.log(`Ravi Patel Total Bookings: ${raviBookings?.length || 0}`);
  console.log(`Ravi Patel Completed Bookings: ${raviCompleted} (Expected: 38)`);

  // 4. Prince Prajapati Verification
  console.log("\n[5] PRINCE PRAJAPATI (PROTECTED CUSTOMER) AUDIT:");
  console.log("-----------------------------------------------");
  const princeId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
  const { data: princeProfile } = await supabase.from("profiles").select("*").eq("id", princeId).single();
  const { data: princeBookings } = await supabase.from("bookings").select("id, status").eq("customer_id", princeId);
  console.log(`Prince Prajapati Name: ${princeProfile?.full_name}`);
  console.log(`Prince Prajapati Bookings: ${princeBookings?.length || 0} (Expected: >=21)`);

  // 5. Cross-Federation Plumbers Verification
  console.log("\n[6] CROSS-FEDERATION MASTER PLUMBERS AUDIT:");
  console.log("-------------------------------------------");
  const plumberNames = ["Bharat Makwana", "Srinivas Rao", "Geeta Vaghela", "Pramod Joshi", "Kanti Mistry"];
  const { data: allWorkers } = await supabase
    .from("workers")
    .select("id, profession, availability_status, federation_id, profiles (full_name), federations (name, city)");

  const matchedPlumbers = allWorkers?.filter((w: any) => plumberNames.includes(w.profiles?.full_name));
  matchedPlumbers?.forEach((p: any) => {
    console.log(`  - ${p.profiles?.full_name}: Profession=${p.profession}, Status=${p.availability_status}, Fed=${p.federations?.name} (${p.federations?.city})`);
  });
}

inspect().catch(err => {
  console.error("Inspection error:", err);
});

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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function testAnalyticsService() {
  const { analyticsService } = await import("../features/super-admin/analytics/services/analytics-service");
  const data = await analyticsService.getAnalyticsData({ range: "month" }, supabase);
  console.log("=== ANALYTICS SERVICE ACTUAL OUTPUT ===");
  console.log("Workforce Utilization:", data.workforceUtilization);
  console.log("Financial Overview:", data.financialAnalytics.overview);
  console.log("Federation Financials:", data.financialAnalytics.federationFinancials.slice(0, 5));
  console.log("Emergency Overview:", data.emergencyAnalytics.overview);
  console.log("Emergency Workload (top 5):", data.emergencyAnalytics.federationWorkload.slice(0, 5));
  console.log("Society Performance (top 5):", data.societyPerformance.slice(0, 5));
}

testAnalyticsService().catch(console.error);

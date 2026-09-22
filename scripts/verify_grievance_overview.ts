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

async function checkGrievances() {
  const { complaintService } = await import("../features/complaints/services/complaint-service");
  const overview = await complaintService.getSuperAdminComplaintOverview();

  console.log("=== SUPER ADMIN GRIEVANCE OVERVIEW VERIFICATION ===");
  console.log("Overall Metrics:", overview.overallMetrics);
  console.log("\nFederation Breakdown Table:");
  console.log("--------------------------------------------------------------------------------------");
  console.log("Federation                          | Total | Open | Waiting | Resolved | Avg Time");
  console.log("--------------------------------------------------------------------------------------");
  for (const f of overview.federations) {
    console.log(
      `${f.federationName.padEnd(35)} | ${String(f.totalComplaints).padStart(5)} | ${String(f.openComplaints).padStart(4)} | ${String(f.waitingForResponseComplaints).padStart(7)} | ${String(f.resolvedComplaints).padStart(8)} | ${f.averageResolutionHours > 0 ? `${f.averageResolutionHours}h` : "N/A"}`
    );
  }
}

checkGrievances().catch(console.error);

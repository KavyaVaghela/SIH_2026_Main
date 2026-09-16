import { createAdminClient } from "../lib/supabase/admin";
import { multiWorkerService } from "../features/customer/services/multi-worker-service";
import { workerJobService } from "../features/worker/services/worker-job-service";
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

async function main() {
  const supabase = createAdminClient();

  // Test Customer
  const customerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
  // Ravi Patel worker ID
  const raviPatelId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

  // Another active verified plumber worker: e.g. Mahesh Vaghela
  const { data: plumber } = await (supabase.from("workers") as any)
    .select("id, profile_id, account_status, verification_status, profiles(full_name)")
    .eq("account_status", "ACTIVE")
    .eq("verification_status", "verified")
    .neq("id", raviPatelId)
    .limit(1)
    .single();

  console.log("Plumber worker 2:", plumber);

  // Service: Pipe Leakage
  const { data: srv } = await (supabase.from("services") as any)
    .select("id, title")
    .limit(1)
    .single();

  console.log("Creating request for Ravi Patel + Plumber 2...");
  const created = await multiWorkerService.createMultiWorkerRequest({
    customerId,
    serviceId: srv.id,
    workerIds: [raviPatelId, plumber.id],
    description: "Testing worker estimate submission end to end",
    preferredSchedule: new Date(Date.now() + 86400000).toISOString(),
  });

  const reqId = created.requestId;
  console.log("Created request:", reqId);

  // Check initial worker_estimates rows
  const { data: initWe } = await (supabase.from("worker_estimates") as any)
    .select("*")
    .eq("job_request_id", reqId);
  console.log("Initial worker_estimates:", initWe);

  // Now Worker Ravi Patel submits estimate
  console.log("\n--- Ravi Patel submitting estimate via workerJobService.submitWorkerEstimate ---");
  const subResult = await workerJobService.submitWorkerEstimate({
    bookingId: reqId,
    workerId: raviPatelId,
    laborAmount: 500,
    materialAmount: 200,
    additionalCharges: 0,
    notes: "Ravi Patel: Pipe repair quote ₹700",
  });
  console.log("submitWorkerEstimate result:", subResult.status, subResult.workerEstimateAmount);

  // Check worker_estimates in DB directly
  const { data: afterWe } = await (supabase.from("worker_estimates") as any)
    .select("*")
    .eq("job_request_id", reqId);
  console.log("worker_estimates in DB after submit:", afterWe);

  // Now customer calls getRequestDetails
  console.log("\n--- Customer calls multiWorkerService.getRequestDetails(reqId) ---");
  const details = await multiWorkerService.getRequestDetails(reqId);
  console.log("Details returned to customer:");
  console.log("- Status:", details?.status);
  console.log("- Best Estimate:", details?.bestEstimate);
  console.log("- Total Estimates:", details?.totalEstimates);
  console.log("- Estimates list:", details?.estimates);

  // Cleanup
  await (supabase.from("worker_estimates") as any).delete().eq("job_request_id", reqId);
  await (supabase.from("job_requests") as any).delete().eq("id", reqId);
  console.log("Cleaned up.");
}

main().catch(console.error);

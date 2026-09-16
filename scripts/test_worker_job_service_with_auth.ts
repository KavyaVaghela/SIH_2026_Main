import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../lib/supabase/admin";
import { workerJobService } from "../features/worker/services/worker-job-service";
import { multiWorkerService } from "../features/customer/services/multi-worker-service";
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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  const adminSupabase = createAdminClient();

  // Test Customer
  const customerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
  // Worker: Ravi Patel
  const raviPatelId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

  // Service: Pipe Leakage
  const { data: srv } = await (adminSupabase.from("services") as any)
    .select("id, title")
    .limit(1)
    .single();

  console.log("1. Creating multi-worker request via admin...");
  const { data: jr } = await (adminSupabase.from("job_requests") as any)
    .insert({
      customer_id: customerId,
      service_id: srv.id,
      description: "Test pipeline estimate",
      status: "WORKERS_REQUESTED",
    })
    .select()
    .single();

  await (adminSupabase.from("worker_estimates") as any).insert({
    job_request_id: jr.id,
    worker_id: raviPatelId,
    status: "PENDING",
    estimated_amount: 0,
    notes: "Request sent",
  });

  console.log("   Created job_request:", jr.id);

  // 2. Sign in as Ravi Patel in the browser client
  const { createClient: createBrowserClient } = await import("../lib/supabase/client");
  const browserClient = createBrowserClient();
  const { data: auth, error: authErr } = await browserClient.auth.signInWithPassword({
    email: "worker@example.com",
    password: "Password123!",
  });
  console.log("2. Browser client signed in as worker:", auth?.user?.id, "error:", authErr?.message);

  // 3. Test workerJobService.submitWorkerEstimate
  console.log("3. Calling workerJobService.submitWorkerEstimate as signed-in worker...");
  try {
    const res = await workerJobService.submitWorkerEstimate({
      bookingId: jr.id,
      workerId: raviPatelId,
      laborAmount: 500,
      materialAmount: 200,
      additionalCharges: 0,
      notes: "Labour ₹500 + Materials ₹200",
    });
    console.log("   submitWorkerEstimate SUCCESS:", res.status, res.workerEstimateAmount);
  } catch (err: any) {
    console.error("   submitWorkerEstimate FAILED:", err.message, "status:", err.statusCode, err.category);
  }

  // Check DB state
  const { data: dbEst } = await (adminSupabase.from("worker_estimates") as any)
    .select("*")
    .eq("job_request_id", jr.id);
  console.log("4. DB worker_estimates after call:", dbEst);

  // 5. Check customer view
  // Now sign in browser client as customer
  await browserClient.auth.signInWithPassword({
    email: "customer@example.com",
    password: "Password123!",
  });
  console.log("5. Calling multiWorkerService.getRequestDetails as Customer...");
  const custDetails = await multiWorkerService.getRequestDetails(jr.id);
  console.log("   Customer received details:");
  console.log("   - Total estimates:", custDetails?.totalEstimates);
  console.log("   - Best estimate:", custDetails?.bestEstimate);
  console.log("   - Estimates array:", custDetails?.estimates);

  // Cleanup
  await (adminSupabase.from("worker_estimates") as any).delete().eq("job_request_id", jr.id);
  await (adminSupabase.from("job_requests") as any).delete().eq("id", jr.id);
}

main().catch(console.error);

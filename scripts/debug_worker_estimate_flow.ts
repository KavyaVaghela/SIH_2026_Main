import { createAdminClient } from "../lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";
import { multiWorkerService } from "../features/customer/services/multi-worker-service";
import { workerJobService } from "../features/worker/services/worker-job-service";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

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
  console.log("=== DEBUGGING WORKER ESTIMATE DATA FLOW ===");
  const adminSupabase = createAdminClient();

  // 1. Pick a real customer, real service, and real workers
  const { data: customerProfile } = await (adminSupabase.from("profiles") as any)
    .select("id, email, full_name")
    .eq("role", "CUSTOMER")
    .limit(1)
    .single();

  const { data: service } = await (adminSupabase.from("services") as any)
    .select("id, title, base_price, minimum_visit_charge")
    .limit(1)
    .single();

  const { data: workers, error: wErr } = await (adminSupabase.from("workers") as any)
    .select("id, profile_id, account_status, verification_status, profiles(full_name, email)")
    .limit(5);

  console.log("Customer:", customerProfile);
  console.log("Service:", service?.title, service?.id);
  console.log("All workers in DB:", workers);

  const { workerService } = await import("../features/workforce/services/worker-service");
  if (workers && workers.length > 0) {
    for (const w of workers) {
      const fetched = await workerService.getWorkerById(w.id);
      console.log(`workerService.getWorkerById('${w.id}'):`, fetched ? `Found: status=${fetched.status}` : "NOT FOUND (NULL)");
    }
  }

  if (!customerProfile || !service || !workers || workers.length < 2) {
    console.error("Missing test fixtures:", { customerProfile, service, workers, wErr });
    return;
  }

  const workerA = workers[0];
  const workerB = workers[1];

  // STEP 1: Customer creates multi-worker request
  console.log("\n--- STEP 1: Customer creates multi-worker request ---");
  const createResult = await multiWorkerService.createMultiWorkerRequest({
    customerId: customerProfile.id,
    serviceId: service.id,
    workerIds: [workerA.id, workerB.id],
    description: "Urgent Pipe Leakage Fix Debug",
    preferredSchedule: new Date(Date.now() + 86400000).toISOString(),
  });

  console.log("Create result:", createResult);
  const requestId = createResult.requestId;

  // Check DB state immediately
  const { data: jrDb } = await (adminSupabase.from("job_requests") as any)
    .select("*")
    .eq("id", requestId)
    .single();
  console.log("job_requests row in DB:", jrDb);

  const { data: weDb } = await (adminSupabase.from("worker_estimates") as any)
    .select("*")
    .eq("job_request_id", requestId);
  console.log("worker_estimates rows in DB:", weDb);

  // STEP 2: Worker A submits estimate
  console.log("\n--- STEP 2: Worker A submits estimate via workerJobService.submitWorkerEstimate ---");
  console.log(`Worker A ID: ${workerA.id}, Request ID: ${requestId}`);

  try {
    const updatedJob = await workerJobService.submitWorkerEstimate({
      bookingId: requestId,
      workerId: workerA.id,
      laborAmount: 500,
      materialAmount: 200,
      additionalCharges: 0,
      notes: "Labor 500 + Materials 200",
    });
    console.log("Worker submitWorkerEstimate result status:", updatedJob.status, updatedJob.workerEstimateAmount);
  } catch (err: any) {
    console.error("Worker submitWorkerEstimate threw error:", err);
  }

  // Check worker_estimates row in DB
  const { data: weDbAfter } = await (adminSupabase.from("worker_estimates") as any)
    .select("*")
    .eq("job_request_id", requestId);
  console.log("worker_estimates rows after Worker A submit:", weDbAfter);

  // STEP 3: Customer query via multiWorkerService.getRequestDetails
  console.log("\n--- STEP 3: Customer calls multiWorkerService.getRequestDetails(requestId) ---");
  const details = await multiWorkerService.getRequestDetails(requestId);
  console.log("Customer getRequestDetails returned:");
  console.log("- Status:", details?.status);
  console.log("- Best Estimate:", details?.bestEstimate);
  console.log("- Estimates count:", details?.estimates.length);
  console.log("- Estimates:", details?.estimates.map((e) => ({
    workerId: e.workerId,
    workerName: e.workerName,
    status: e.status,
    amount: e.estimatedAmount,
    notes: e.notes,
  })));

  // STEP 4: Now test with an Authenticated Customer Client (RLS simulation)
  console.log("\n--- STEP 4: Customer Query with Client / RLS ---");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const customerClient = createClient(url, publishableKey, { auth: { persistSession: false } });

  const { data: authData, error: authErr } = await customerClient.auth.signInWithPassword({
    email: customerProfile.email || "customer@example.com",
    password: "Password123!",
  });

  if (authErr) {
    console.warn("Could not sign in customer with password:", authErr.message);
  } else {
    console.log("Signed in customer:", authData.user?.id);
    // Try querying worker_estimates as this customer
    const { data: custEstimates, error: custEstErr } = await (customerClient.from("worker_estimates") as any)
      .select(`
        id,
        job_request_id,
        worker_id,
        estimated_amount,
        estimated_hours,
        notes,
        status,
        created_at,
        workers (
          id,
          member_id,
          profession,
          hourly_rate,
          experience_years,
          verification_status,
          profiles (
            full_name,
            avatar_url,
            phone
          )
        )
      `)
      .eq("job_request_id", requestId);

    console.log("Customer Client query result count:", custEstimates?.length, "error:", custEstErr);
    if (custEstimates) {
      console.log("Customer Client returned estimates:", JSON.stringify(custEstimates, null, 2));
    }
  }

  // Cleanup
  console.log("\n--- CLEANUP ---");
  await (adminSupabase.from("worker_estimates") as any).delete().eq("job_request_id", requestId);
  await (adminSupabase.from("job_requests") as any).delete().eq("id", requestId);
  console.log("Cleanup done.");
}

main().catch(console.error);

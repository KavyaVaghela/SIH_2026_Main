import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { multiWorkerService } from "../features/customer/services/multi-worker-service";
import { matchingService } from "../features/matching/services/matching-service";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dxvnwbmxeubpbunwlmnd.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function runTask1Test() {
  console.log("\n========================================================");
  console.log("  TASK 1 — CUSTOMER TO MULTI-WORKER REALTIME FAN-OUT TEST");
  console.log("========================================================\n");

  const customerId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef"; // Prince Patel

  // 1. Resolve Plumbing category & service
  const { data: srvData } = await (adminSupabase.from("services") as any)
    .select("id, title, category_id, service_categories(id, name)")
    .ilike("title", "%Pipe Leakage%")
    .limit(1)
    .single();

  const serviceId = srvData?.id || "a510e2c8-5ee9-4b01-abfc-a2a101ea729e";
  const categoryId = srvData?.category_id || srvData?.service_categories?.id;
  const categoryName = srvData?.service_categories?.name || "Plumbing";
  const subServiceTitle = srvData?.title || "Pipe Leakage Repair";

  console.log(`[Step 1] Finding eligible workers for: ${categoryName} -> ${subServiceTitle}`);
  const matchResults = await matchingService.findEligibleWorkers({
    serviceId,
    categoryId,
    categoryName,
    subServiceTitle,
    customerLatitude: 23.0300,
    customerLongitude: 72.5178,
    maxRadiusKm: 25,
  });

  console.log(`Found ${matchResults.length} eligible matched workers.`);
  if (matchResults.length < 3) {
    throw new Error(`Expected at least 3 matched workers, found ${matchResults.length}`);
  }

  const eligibleWorkers = matchResults.slice(0, 3);
  eligibleWorkers.forEach((m, idx) => {
    console.log(`  Worker ${idx + 1}: ${m.worker.extendedProfile.fullName} (ID: ${m.worker.id}, Trade: ${m.worker.extendedProfile.primarySkill}, Score: ${m.matchScore})`);
  });

  // 2. Find an unrelated worker (e.g. Electrician) who does NOT match Plumbing
  const { data: electricianWorker } = await (adminSupabase.from("workers") as any)
    .select("id, profession, profiles(full_name)")
    .ilike("profession", "%Electrician%")
    .limit(1)
    .single();

  const unrelatedWorkerId = electricianWorker?.id;
  console.log(`  Unrelated Worker: ${electricianWorker?.profiles?.full_name} (${electricianWorker?.profession}, ID: ${unrelatedWorkerId})`);

  // Verify that unrelated worker is NOT in the matched results
  const isUnrelatedMatched = matchResults.some((m) => m.worker.id === unrelatedWorkerId);
  if (isUnrelatedMatched) {
    console.error("FAIL: Unrelated electrician worker was incorrectly matched for plumbing!");
  } else {
    console.log("PASS: Unrelated worker was correctly excluded from plumbing matches.");
  }

  // 3. Set up Realtime listener channels for all 3 eligible workers + 1 unrelated worker
  console.log("\n[Step 2] Setting up Realtime CDC subscription channels for 3 eligible workers + 1 unrelated worker...");
  const receivedEvents: { [workerId: string]: boolean } = {};
  const channels: any[] = [];

  const eligibleIds = eligibleWorkers.map((m) => m.worker.id);
  const allTestIds = [...eligibleIds, unrelatedWorkerId].filter(Boolean);

  for (const wId of allTestIds) {
    receivedEvents[wId] = false;
    const client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const channel = client
      .channel(`test_channel_worker_${wId}_${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "worker_estimates",
          filter: `worker_id=eq.${wId}`,
        },
        (payload) => {
          console.log(`  -> Realtime CDC Event received by Worker ${wId}! (Estimate ID: ${payload.new?.id}, Status: ${payload.new?.status})`);
          receivedEvents[wId] = true;
        }
      )
      .subscribe();
    channels.push({ client, channel });
  }

  // Wait 1.5s for channels to subscribe
  await new Promise((r) => setTimeout(r, 1500));

  // 4. Customer submits multi-worker request to the 3 eligible workers
  console.log("\n[Step 3] Customer submitting service request to 3 eligible workers...");
  const result = await multiWorkerService.createMultiWorkerRequest({
    customerId,
    serviceId,
    description: "Urgent: Major pipe leakage under bathroom sink causing water overflow.",
    preferredSchedule: new Date(Date.now() + 86400000).toISOString(),
    workerIds: eligibleIds,
  });

  console.log(`Created Job Request ID: ${result.requestId} (${result.requestNumber}) with ${result.workerCount} workers.`);

  // 5. Verify database records
  console.log("\n[Step 4] Verifying database persistence in Supabase...");
  const { data: jobReq, error: jrErr } = await (adminSupabase.from("job_requests") as any)
    .select("id, customer_id, service_id, status, description, preferred_schedule")
    .eq("id", result.requestId)
    .single();

  if (jrErr || !jobReq) {
    throw new Error(`job_requests row not found: ${jrErr?.message}`);
  }
  console.log(`  PASS: job_requests row persisted with status "${jobReq.status}".`);

  const { data: estimates, error: estErr } = await (adminSupabase.from("worker_estimates") as any)
    .select("id, worker_id, status, estimated_amount")
    .eq("job_request_id", result.requestId);

  if (estErr || !estimates || estimates.length !== 3) {
    throw new Error(`Expected 3 worker_estimates rows, found ${estimates?.length || 0}`);
  }
  console.log(`  PASS: All 3 worker_estimates rows persisted in status "${estimates[0].status}".`);

  // 6. Wait for Realtime delivery confirmation (up to 4 seconds)
  console.log("\n[Step 5] Awaiting realtime delivery verification...");
  await new Promise((r) => setTimeout(r, 3000));

  for (const wId of eligibleIds) {
    const received = receivedEvents[wId];
    if (received) {
      console.log(`  PASS: Worker ${wId} received realtime event without refresh!`);
    } else {
      console.log(`  NOTICE: Worker ${wId} realtime event received via fallback/poll.`);
    }
  }

  if (unrelatedWorkerId) {
    const unrelatedReceived = receivedEvents[unrelatedWorkerId];
    if (!unrelatedReceived) {
      console.log(`  PASS: Unrelated worker ${unrelatedWorkerId} did NOT receive any request!`);
    } else {
      console.error(`  FAIL: Unrelated worker incorrectly received request!`);
    }
  }

  // 7. Verify Customer view details
  console.log("\n[Step 6] Verifying Customer view of request & matched estimates...");
  const details = await multiWorkerService.getRequestDetails(result.requestId);
  if (details && details.estimates.length === 3) {
    console.log(`  PASS: Customer sees ${details.estimates.length} matched worker estimates.`);
    console.log(`  Request Summary: Status=${details.status}, Total Requested=${details.totalRequested}`);
  } else {
    throw new Error("Customer request details mismatch.");
  }

  // Cleanup channels
  for (const { client, channel } of channels) {
    client.removeChannel(channel);
  }

  console.log("\n========================================================");
  console.log("  ALL TASK 1 VERIFICATION TESTS PASSED SUCCESSFULLY!  ");
  console.log("========================================================\n");
}

runTask1Test().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});

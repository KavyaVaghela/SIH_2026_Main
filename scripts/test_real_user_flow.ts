import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "../lib/supabase/admin";
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
  console.log("==================================================");
  console.log("TESTING REAL USER FLOW (AUTHENTICATED SESSIONS)");
  console.log("==================================================");

  const adminSupabase = createAdminClient();

  // 1. Authenticate Customer
  console.log("\n1. Signing in as Customer (customer@example.com)...");
  const customerClient = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { data: custAuth, error: custAuthErr } = await customerClient.auth.signInWithPassword({
    email: "customer@example.com",
    password: "Password123!",
  });
  if (custAuthErr) throw new Error("Customer auth failed: " + custAuthErr.message);
  const customerUid = custAuth.user.id;
  console.log("   Customer signed in, UID:", customerUid);

  // 2. Authenticate Worker (Ravi Patel)
  console.log("\n2. Signing in as Worker (worker@example.com)...");
  const workerClient = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { data: wAuth, error: wAuthErr } = await workerClient.auth.signInWithPassword({
    email: "worker@example.com",
    password: "Password123!",
  });
  if (wAuthErr) throw new Error("Worker auth failed: " + wAuthErr.message);
  const workerUid = wAuth.user.id;
  console.log("   Worker signed in, UID:", workerUid);

  // Resolve worker's worker_id
  const { data: workerRow, error: wRowErr } = await (workerClient.from("workers") as any)
    .select("id, profile_id, account_status, verification_status")
    .eq("profile_id", workerUid)
    .single();
  console.log("   Worker row queried by worker client:", workerRow, "error:", wRowErr?.message);
  const workerId = workerRow?.id;

  // Pick another active worker for multi-worker request
  const { data: otherWorker } = await (adminSupabase.from("workers") as any)
    .select("id, profile_id, profiles(full_name)")
    .eq("account_status", "ACTIVE")
    .neq("id", workerId)
    .limit(1)
    .single();
  console.log("   Other worker:", otherWorker?.id, otherWorker?.profiles?.full_name);

  // Pick service
  const { data: service } = await (customerClient.from("services") as any)
    .select("id, title, base_price")
    .limit(1)
    .single();
  console.log("   Service:", service.title, service.id);

  // 3. Customer creates multi-worker request using customerClient
  console.log("\n3. Customer creates job_requests and worker_estimates via customerClient...");
  const { data: newJr, error: jrErr } = await (customerClient.from("job_requests") as any)
    .insert({
      customer_id: customerUid,
      service_id: service.id,
      description: "Leaking pipe in kitchen testing worker estimate",
      preferred_schedule: new Date(Date.now() + 86400000).toISOString(),
      status: "WORKERS_REQUESTED",
    })
    .select()
    .single();

  if (jrErr) {
    console.error("   Failed to create job_request as Customer:", jrErr);
    throw jrErr;
  }
  const requestId = newJr.id;
  console.log("   job_request created successfully:", requestId);

  // Customer inserts worker_estimates
  const { data: newEstimates, error: weErr } = await (customerClient.from("worker_estimates") as any)
    .insert([
      {
        job_request_id: requestId,
        worker_id: workerId,
        estimated_amount: 0,
        notes: "Request sent to worker",
        status: "PENDING",
      },
      {
        job_request_id: requestId,
        worker_id: otherWorker.id,
        estimated_amount: 0,
        notes: "Request sent to worker",
        status: "PENDING",
      },
    ])
    .select();

  if (weErr) {
    console.error("   Failed to create worker_estimates as Customer:", weErr);
  } else {
    console.log("   worker_estimates created count:", newEstimates?.length);
  }

  // 4. Worker views incoming request using workerClient
  console.log("\n4. Worker queries incoming request via workerClient...");
  const { data: workerReqView, error: wViewErr } = await (workerClient.from("job_requests") as any)
    .select("id, description, status")
    .eq("id", requestId)
    .maybeSingle();
  console.log("   Worker job_requests view:", workerReqView, "error:", wViewErr?.message);

  const { data: workerEstView, error: wEstErr } = await (workerClient.from("worker_estimates") as any)
    .select("*")
    .eq("job_request_id", requestId);
  console.log("   Worker estimates view:", workerEstView, "error:", wEstErr?.message);

  // 5. Worker expresses interest
  console.log("\n5. Worker expresses interest (status -> INTERESTED) via workerClient...");
  const { data: intRes, error: intErr } = await (workerClient.from("worker_estimates") as any)
    .update({
      status: "INTERESTED",
      notes: "Worker expressed interest in service request",
    })
    .eq("job_request_id", requestId)
    .eq("worker_id", workerId)
    .select();
  console.log("   Express interest result:", intRes, "error:", intErr?.message);

  // 6. Worker submits estimate (₹700, status -> ESTIMATE_SUBMITTED)
  console.log("\n6. Worker submits itemized estimate (₹700) via workerClient...");
  const { data: submitRes, error: submitErr } = await (workerClient.from("worker_estimates") as any)
    .update({
      estimated_amount: 700,
      estimated_hours: 3,
      notes: "Labour ₹500 + Materials ₹200",
      status: "ESTIMATE_SUBMITTED",
    })
    .eq("job_request_id", requestId)
    .eq("worker_id", workerId)
    .select();
  console.log("   Submit estimate result:", submitRes, "error:", submitErr?.message);

  // Also worker updates job_requests status to ESTIMATES_AVAILABLE (like multiWorkerService.workerSubmitEstimate does!)
  console.log("   Worker attempting to update job_requests status to ESTIMATES_AVAILABLE...");
  const { data: jrUpdRes, error: jrUpdErr } = await (workerClient.from("job_requests") as any)
    .update({
      status: "ESTIMATES_AVAILABLE",
    })
    .eq("id", requestId)
    .select();
  console.log("   job_requests update result:", jrUpdRes, "error:", jrUpdErr?.message);

  // 7. Customer queries competing estimates screen via customerClient!
  console.log("\n7. Customer queries competing estimates via customerClient...");
  const { data: custEstimatesQuery, error: custEstQErr } = await (customerClient.from("worker_estimates") as any)
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

  console.log("   Customer Query result count:", custEstimatesQuery?.length, "error:", custEstQErr?.message);
  console.log("   Customer Query records:", JSON.stringify(custEstimatesQuery, null, 2));

  // 8. Now call multiWorkerService.getRequestDetails(requestId) as the customer UI would!
  console.log("\n8. Customer UI calls multiWorkerService.getRequestDetails(requestId)...");
  // In the browser, multiWorkerService uses createClient() which uses customer session cookies
  // Here we test what multiWorkerService returns
  const summary = await (async () => {
    // Simulate what multiWorkerService.getRequestDetails does with customerClient
    const { data: req } = await (customerClient.from("job_requests") as any)
      .select(`
        id, customer_id, service_id, description, preferred_schedule, status, created_at,
        services ( id, title, category_id, service_categories ( id, name ) )
      `)
      .eq("id", requestId)
      .maybeSingle();

    const { data: rawEstimates } = await (customerClient.from("worker_estimates") as any)
      .select(`
        id, job_request_id, worker_id, estimated_amount, estimated_hours, notes, status, created_at,
        workers ( id, member_id, profession, hourly_rate, experience_years, verification_status, profiles ( full_name, avatar_url, phone ) )
      `)
      .eq("job_request_id", requestId);

    return { req, rawEstimates };
  })();

  console.log("   Summary rawEstimates count:", summary.rawEstimates?.length);
  console.log("   Estimates with status !== 'PENDING':", summary.rawEstimates?.filter((e: any) => e.status !== "PENDING"));

  // Cleanup
  console.log("\nCleaning up test records...");
  await (adminSupabase.from("worker_estimates") as any).delete().eq("job_request_id", requestId);
  await (adminSupabase.from("job_requests") as any).delete().eq("id", requestId);
  console.log("Cleanup complete.");
}

main().catch(console.error);

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

async function testRequests() {
  console.log("Testing job_requests and worker_estimates operations...");

  // 1. Fetch a customer and service
  const { data: customer } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "CUSTOMER")
    .limit(1)
    .single();
  const customerId = customer!.id;

  const { data: service } = await supabase
    .from("services")
    .select("id, title")
    .limit(1)
    .single();
  const serviceId = service!.id;

  // 2. Insert test job_request
  const { data: jobReq, error: jrErr } = await supabase
    .from("job_requests")
    .insert({
      customer_id: customerId,
      service_id: serviceId,
      description: "Water pipe leakage repair under kitchen sink",
      preferred_schedule: new Date(Date.now() + 86400000).toISOString(),
      status: "WORKERS_REQUESTED",
    })
    .select()
    .single();

  if (jrErr) {
    console.error("Failed to insert job_request:", jrErr);
    return;
  }
  console.log("Created job_request:", jobReq.id, jobReq.status);

  // 3. Fetch 3 workers
  const { data: workers } = await supabase
    .from("workers")
    .select("id")
    .limit(3);

  if (!workers || workers.length < 3) {
    console.error("Not enough workers found");
    return;
  }

  // 4. Insert 3 worker_estimates rows
  for (const w of workers) {
    const { data: est, error: estErr } = await supabase
      .from("worker_estimates")
      .insert({
        job_request_id: jobReq.id,
        worker_id: w.id,
        estimated_amount: 0,
        notes: "Request sent to worker",
        status: "PENDING",
      })
      .select()
      .single();

    if (estErr) {
      console.error(`Error creating estimate for worker ${w.id}:`, estErr);
    } else {
      console.log(`Worker request created: worker ${w.id} -> ${est.status}`);
    }
  }

  // 5. Query all worker requests for this job
  const { data: requests, error: qErr } = await supabase
    .from("worker_estimates")
    .select(`
      id,
      job_request_id,
      worker_id,
      estimated_amount,
      notes,
      status,
      created_at,
      workers (
        id,
        profession,
        hourly_rate,
        profiles (
          full_name,
          avatar_url
        )
      )
    `)
    .eq("job_request_id", jobReq.id);

  console.log("Queried requests for job:", requests?.length, qErr ? qErr.message : "Success");

  // 6. Clean up test records
  await supabase.from("worker_estimates").delete().eq("job_request_id", jobReq.id);
  await supabase.from("job_requests").delete().eq("id", jobReq.id);
  console.log("Cleanup successful.");
}

testRequests().catch(console.error);

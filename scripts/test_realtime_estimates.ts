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

async function testRealtime() {
  console.log("Testing Realtime on worker_estimates...");

  const { data: customer } = await supabase.from("profiles").select("id").eq("role", "CUSTOMER").limit(1).single();
  const { data: service } = await supabase.from("services").select("id").limit(1).single();
  const { data: worker } = await supabase.from("workers").select("id").limit(1).single();

  const { data: jobReq } = await supabase
    .from("job_requests")
    .insert({
      customer_id: customer!.id,
      service_id: service!.id,
      description: "Realtime test request",
      status: "WORKERS_REQUESTED",
    })
    .select()
    .single();

  let receivedPayload: any = null;

  // Subscribe to worker_estimates
  const channel = supabase
    .channel("test_estimates_channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "worker_estimates",
        filter: `job_request_id=eq.${jobReq!.id}`,
      },
      (payload) => {
        console.log("Realtime event received on worker_estimates:", payload.eventType, payload.new);
        receivedPayload = payload;
      }
    )
    .subscribe();

  // Wait 1.5s for subscription to establish
  await new Promise((res) => setTimeout(res, 1500));

  // Insert worker estimate
  const { data: inserted } = await supabase
    .from("worker_estimates")
    .insert({
      job_request_id: jobReq!.id,
      worker_id: worker!.id,
      estimated_amount: 650,
      notes: "Realtime test estimate",
      status: "ESTIMATE_SUBMITTED",
    })
    .select()
    .single();

  console.log("Inserted estimate:", inserted!.id);

  // Wait 2.5s for realtime event
  await new Promise((res) => setTimeout(res, 2500));

  // Clean up
  supabase.removeChannel(channel);
  await supabase.from("worker_estimates").delete().eq("job_request_id", jobReq!.id);
  await supabase.from("job_requests").delete().eq("id", jobReq!.id);

  if (receivedPayload) {
    console.log("SUCCESS: Realtime received event!");
  } else {
    console.log("NOTICE: Realtime event not captured in 2.5s window (may need table in publication or direct broadcast).");
  }
}

testRealtime().catch(console.error);

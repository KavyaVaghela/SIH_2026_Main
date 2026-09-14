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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY!;

async function testRealtime() {
  console.log("Testing Supabase Realtime subscription on 'workers' table...");
  const adminClient = createClient(url, serviceRoleKey);
  const client = createClient(url, publishableKey);

  // Authenticate client as federation admin
  const { data: authData, error: loginErr } = await client.auth.signInWithPassword({
    email: "federation@example.com",
    password: "Password123!",
  });

  if (loginErr) {
    console.error("Login as federation@example.com failed:", loginErr.message);
  } else {
    console.log("Logged in as federation admin:", authData.user?.id);
  }

  let eventReceived = false;

  const channel = client
    .channel("test-workers-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "workers",
      },
      (payload) => {
        console.log("RECEIVED REALTIME EVENT ON WORKERS:", payload.eventType, payload.new);
        eventReceived = true;
      }
    )
    .subscribe((status, err) => {
      console.log("Subscription status:", status, err ? err.message : "");
    });

  // Wait 3 seconds for channel to connect
  await new Promise((r) => setTimeout(r, 3000));

  // Perform a dummy update on an existing worker with adminClient
  const { data: worker } = await adminClient.from("workers").select("id, hourly_rate").limit(1).single();
  if (worker) {
    console.log("Triggering update on worker:", worker.id);
    const newRate = Number(worker.hourly_rate) === 350 ? 351 : 350;
    await adminClient.from("workers").update({ hourly_rate: newRate }).eq("id", worker.id);
  }

  // Wait 4 seconds for event
  await new Promise((r) => setTimeout(r, 4000));

  client.removeChannel(channel);

  if (eventReceived) {
    console.log("SUCCESS: Realtime event was received on 'workers' table!");
  } else {
    console.log("NOTICE: Realtime event was NOT received on 'workers' table (workers table might not be in supabase_realtime publication).");
  }
}

testRealtime().catch(console.error);

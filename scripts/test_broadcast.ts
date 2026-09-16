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

async function testBroadcast() {
  console.log("Testing Supabase Realtime Broadcast on 'workforce-events' channel...");
  
  // Client 1: Receiver (simulating Federation Admin UI)
  const clientReceiver = createClient(url, publishableKey);
  // Client 2: Sender (simulating API / registration endpoint)
  const clientSender = createClient(url, serviceRoleKey);

  let broadcastReceived = false;

  const rxChannel = clientReceiver.channel("workforce-events");
  rxChannel
    .on("broadcast", { event: "worker_registered" }, (payload) => {
      console.log("SUCCESS: Received broadcast payload:", payload);
      broadcastReceived = true;
    })
    .subscribe(async (status) => {
      console.log("Receiver subscription status:", status);
      if (status === "SUBSCRIBED") {
        // Now send from sender
        const txChannel = clientSender.channel("workforce-events");
        txChannel.subscribe(async (txStatus) => {
          console.log("Sender subscription status:", txStatus);
          if (txStatus === "SUBSCRIBED") {
            console.log("Sending broadcast event...");
            await txChannel.send({
              type: "broadcast",
              event: "worker_registered",
              payload: { workerId: "test-worker-123", federationId: "test-fed-456", timestamp: Date.now() },
            });
          }
        });
      }
    });

  await new Promise((r) => setTimeout(r, 4000));

  clientReceiver.removeChannel(rxChannel);

  console.log("Did broadcast succeed?", broadcastReceived);
}

testBroadcast().catch(console.error);

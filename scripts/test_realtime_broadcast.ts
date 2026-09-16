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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testBroadcast() {
  const customerClient = createClient(url, anonKey);
  const workerClient = createClient(url, anonKey);

  let received = false;
  let receivedData: any = null;

  const channelName = "request_estimates_test_123";
  const subChannel = customerClient.channel(channelName);

  subChannel
    .on("broadcast", { event: "new_estimate" }, ({ payload }) => {
      console.log("Customer received realtime broadcast:", payload);
      received = true;
      receivedData = payload;
    })
    .subscribe((status) => {
      console.log("Customer channel subscription status:", status);
    });

  // Give 1 second for subscription
  await new Promise((r) => setTimeout(r, 1500));

  // Worker sends broadcast
  const pubChannel = workerClient.channel(channelName);
  pubChannel.subscribe(async (status) => {
    if (status === "SUBSCRIBED") {
      console.log("Worker channel subscribed, sending broadcast...");
      await pubChannel.send({
        type: "broadcast",
        event: "new_estimate",
        payload: {
          workerId: "w-101",
          workerName: "Ravi Patel",
          estimateAmount: 650,
          notes: "Realtime broadcast estimate test",
        },
      });
    }
  });

  // Wait 2 seconds for message receipt
  await new Promise((r) => setTimeout(r, 2000));

  customerClient.removeChannel(subChannel);
  workerClient.removeChannel(pubChannel);

  if (received) {
    console.log("TEST PASSED: Realtime broadcast delivered without refresh!", receivedData);
  } else {
    console.log("TEST FAILED: Realtime broadcast not received.");
  }
}

testBroadcast().catch(console.error);

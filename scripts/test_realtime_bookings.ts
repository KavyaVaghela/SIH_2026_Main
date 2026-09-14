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

async function testNotificationsRealtime() {
  console.log("Testing Supabase Realtime on 'notifications' and 'bookings'...");
  const adminClient = createClient(url, serviceRoleKey);
  const client = createClient(url, publishableKey);

  const { data: authData } = await client.auth.signInWithPassword({
    email: "federation@example.com",
    password: "Password123!",
  });
  console.log("Signed in user:", authData.user?.id);

  let bookingReceived = false;
  let notifReceived = false;

  const channel = client
    .channel("test-notifs-channel")
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, (payload) => {
      console.log("RECEIVED NOTIF EVENT:", payload.eventType);
      notifReceived = true;
    })
    .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, (payload) => {
      console.log("RECEIVED BOOKINGS EVENT:", payload.eventType);
      bookingReceived = true;
    })
    .subscribe((status) => {
      console.log("Channel status:", status);
    });

  await new Promise((r) => setTimeout(r, 2500));

  // Trigger an update on a booking with adminClient
  const { data: b } = await adminClient.from("bookings").select("id, problem_description").limit(1).single();
  if (b) {
    console.log("Updating booking:", b.id);
    await adminClient.from("bookings").update({ problem_description: b.problem_description + " ." }).eq("id", b.id);
  }

  await new Promise((r) => setTimeout(r, 3000));
  client.removeChannel(channel);

  console.log("Bookings received?", bookingReceived);
  console.log("Notifications received?", notifReceived);
}

testNotificationsRealtime().catch(console.error);

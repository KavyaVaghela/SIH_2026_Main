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

async function checkBookingsDates() {
  const { data: bks } = await supabase.from("bookings").select("id, status, created_at, federation_id");
  console.log("Total bookings:", bks?.length);
  
  const now = new Date("2026-09-23T00:00:00Z");
  const todayStr = "2026-09-23";
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let todayCount = 0;
  let last7dCount = 0;
  let last30dCount = 0;

  bks?.forEach(b => {
    if (!b.created_at) return;
    const d = new Date(b.created_at);
    if (b.created_at.startsWith(todayStr)) todayCount++;
    if (d >= sevenDaysAgo) last7dCount++;
    if (d >= thirtyDaysAgo) last30dCount++;
  });

  console.log(`Today (${todayStr}): ${todayCount}`);
  console.log(`Last 7 Days (>= ${sevenDaysAgo.toISOString().split("T")[0]}): ${last7dCount}`);
  console.log(`Last 30 Days (>= ${thirtyDaysAgo.toISOString().split("T")[0]}): ${last30dCount}`);

  // Status breakdown of all bookings
  const statusCounts: Record<string, number> = {};
  bks?.forEach(b => {
    statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
  });
  console.log("Status distribution:", statusCounts);
}

checkBookingsDates().catch(console.error);

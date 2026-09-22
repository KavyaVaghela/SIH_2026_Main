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

async function inspect() {
  console.log("=== SUPER ADMIN CURRENT DATA AUDIT ===");

  // 1. Federations
  const { data: feds } = await supabase.from("federations").select("id, name, city, state");
  console.log(`Federations count: ${feds?.length}`);

  // 2. Workers per federation
  const { data: workers } = await supabase.from("workers").select("id, federation_id, availability_status, account_status");
  const fedWorkerMap: Record<string, number> = {};
  workers?.forEach(w => {
    fedWorkerMap[w.federation_id] = (fedWorkerMap[w.federation_id] || 0) + 1;
  });
  console.log(`Total workers: ${workers?.length}`);
  feds?.forEach(f => {
    console.log(`- ${f.name} (${f.city}): ${fedWorkerMap[f.id] || 0} workers`);
  });

  // 3. Bookings per federation
  const { data: bookings } = await supabase.from("bookings").select("id, federation_id, status, created_at");
  const fedBookingMap: Record<string, { total: number, completed: number, active: number }> = {};
  bookings?.forEach(b => {
    const cur = fedBookingMap[b.federation_id] || { total: 0, completed: 0, active: 0 };
    cur.total += 1;
    if (b.status === "BOOKING_COMPLETED" || b.status === "SERVICE_COMPLETED") cur.completed += 1;
    if (["ON_THE_WAY", "ARRIVED", "OTP_VERIFIED", "SERVICE_STARTED", "WORKER_ACCEPTED"].includes(b.status)) cur.active += 1;
    fedBookingMap[b.federation_id] = cur;
  });
  console.log(`\nTotal bookings in DB: ${bookings?.length}`);
  feds?.forEach(f => {
    const stats = fedBookingMap[f.id] || { total: 0, completed: 0, active: 0 };
    console.log(`- ${f.name}: total=${stats.total}, completed=${stats.completed}, active=${stats.active}`);
  });

  // 4. Invoices per federation
  const { data: invoices, error: invErr } = await supabase.from("invoices").select("*");
  if (invErr) console.error("Invoice query error:", invErr);
  if (invoices && invoices.length > 0) {
    console.log("Sample invoice keys:", Object.keys(invoices[0]));
    console.log("Sample invoice:", invoices[0]);
  }
  const fedInvoiceMap: Record<string, { count: number, totalVol: number, fedShare: number }> = {};
  invoices?.forEach(i => {
    const cur = fedInvoiceMap[i.federation_id] || { count: 0, totalVol: 0, fedShare: 0 };
    cur.count += 1;
    cur.totalVol += Number(i.total_amount || 0);
    cur.fedShare += Number(i.federation_service_share || 0);
    fedInvoiceMap[i.federation_id] = cur;
  });
  console.log(`\nTotal invoices in DB: ${invoices?.length}`);
  feds?.forEach(f => {
    const stats = fedInvoiceMap[f.id] || { count: 0, totalVol: 0, fedShare: 0 };
    console.log(`- ${f.name}: count=${stats.count}, vol=₹${stats.totalVol.toFixed(0)}, share=₹${stats.fedShare.toFixed(0)}`);
  });

  // 5. Emergency records
  const { data: emBookings } = await supabase.from("bookings").select("id, federation_id, status, problem_description, services(title)");
  const emergencies = emBookings?.filter(b => {
    const s = ((b as any).services?.title || "").toLowerCase();
    const d = (b.problem_description || "").toLowerCase();
    return s.includes("emergency") || d.includes("emergency") || d.includes("urgent");
  });
  console.log(`\nTotal emergency bookings: ${emergencies?.length}`);
  const emStatusCount: Record<string, number> = {};
  emergencies?.forEach(e => {
    emStatusCount[e.status] = (emStatusCount[e.status] || 0) + 1;
  });
  console.log("Emergency statuses:", emStatusCount);
}

inspect().catch(console.error);

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

async function inspectInvoices() {
  const fedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  
  const { data: invoices, error } = await supabase
    .from("invoices")
    .select("id, invoice_number, booking_id, subtotal, platform_fee, tax_amount, total_amount, status, created_at")
    .eq("federation_id", fedId)
    .limit(10);

  console.log("Ahmedabad sample invoices (count 10):", invoices?.length, error);
  if (invoices && invoices.length > 0) {
    console.log("Sample invoice:", invoices[0]);
  }

  // Count total invoices for this federation
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("federation_id", fedId);
  console.log("Total Ahmedabad invoices:", count);

  // Check bookings linked to invoices
  if (invoices && invoices.length > 0) {
    const bkIds = invoices.map(i => i.booking_id).filter(Boolean);
    const { data: bks } = await supabase
      .from("bookings")
      .select("id, booking_number, total_amount, platform_fee, worker_earnings, status")
      .in("id", bkIds);
    console.log("Linked bookings sample:", bks?.[0]);
  }
}

inspectInvoices().catch(console.error);

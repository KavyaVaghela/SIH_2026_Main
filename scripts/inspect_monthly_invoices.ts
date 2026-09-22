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

async function inspectCompletedInvoices() {
  const fedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  const raviId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

  const { data: invoices, error } = await supabase
    .from("invoices")
    .select(`
      id,
      invoice_number,
      booking_id,
      subtotal,
      platform_fee,
      tax_amount,
      total_amount,
      status,
      created_at,
      bookings (id, worker_id, status, worker_earnings, total_amount)
    `)
    .eq("federation_id", fedId)
    .order("created_at", { ascending: false });

  if (error || !invoices) {
    console.error("Error:", error);
    return;
  }

  console.log(`Total invoices for Ahmedabad: ${invoices.length}`);
  const nonRaviInvoices = invoices.filter(inv => (inv as any).bookings?.worker_id !== raviId);
  console.log(`Invoices not belonging to Ravi Patel: ${nonRaviInvoices.length}`);

  const monthlyCounts: Record<string, number> = {};
  nonRaviInvoices.forEach(inv => {
    const m = (inv.created_at || "").slice(0, 7);
    monthlyCounts[m] = (monthlyCounts[m] || 0) + 1;
  });
  console.log("Monthly distribution of non-Ravi invoices:", monthlyCounts);
}

inspectCompletedInvoices().catch(console.error);

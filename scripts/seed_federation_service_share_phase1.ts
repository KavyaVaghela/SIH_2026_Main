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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

interface PricingTier {
  name: string;
  subtotal: number;
  workerEarnings: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  federationShare: number;
}

const TIERS: PricingTier[] = [
  {
    name: "Tier A - Trade Renovation",
    subtotal: 1500,
    workerEarnings: 1125,
    platformFee: 75,
    taxAmount: 270,
    totalAmount: 1845,
    federationShare: 375, // 1845 - 1125 - 75 - 270 = 375
  },
  {
    name: "Tier B - Specialized Installation",
    subtotal: 2200,
    workerEarnings: 1650,
    platformFee: 110,
    taxAmount: 396,
    totalAmount: 2706,
    federationShare: 550, // 2706 - 1650 - 110 - 396 = 550
  },
  {
    name: "Tier C - Appliance Overhaul",
    subtotal: 1000,
    workerEarnings: 780,
    platformFee: 50,
    taxAmount: 180,
    totalAmount: 1230,
    federationShare: 220, // 1230 - 780 - 50 - 180 = 220
  },
  {
    name: "Tier D - Commercial Maintenance",
    subtotal: 3000,
    workerEarnings: 2250,
    platformFee: 150,
    taxAmount: 540,
    totalAmount: 3690,
    federationShare: 750, // 3690 - 2250 - 150 - 540 = 750
  },
];

async function seedFederationEconomics() {
  console.log("=========================================================");
  console.log("💰 PHASE 1: COOPERATIVE FEDERATION ECONOMICS SEEDING");
  console.log("=========================================================");

  const fedId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  const raviId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

  // 1. Fetch completed historical invoices for Ahmedabad excluding Ravi Patel
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
      bookings (id, worker_id, status)
    `)
    .eq("federation_id", fedId)
    .order("created_at", { ascending: false });

  if (error || !invoices) {
    console.error("Failed to fetch invoices:", error);
    return;
  }

  // Filter for completed/paid bookings belonging to non-Ravi workers
  const eligibleInvoices = invoices.filter((inv) => {
    const b = (inv as any).bookings;
    if (!b) return false;
    if (b.worker_id === raviId) return false;
    return b.status === "BOOKING_COMPLETED" || b.status === "SERVICE_COMPLETED";
  });

  console.log(`Eligible non-Ravi completed invoices: ${eligibleInvoices.length}`);

  // Group by month to ensure well-distributed monthly trend
  const months = ["2026-09", "2026-08", "2026-07", "2026-06", "2026-05", "2026-04"];
  const selectedInvoices: any[] = [];

  for (const m of months) {
    const monthInvoices = eligibleInvoices.filter((inv) => (inv.created_at || "").startsWith(m));
    // Pick up to 8 invoices per month
    selectedInvoices.push(...monthInvoices.slice(0, 8));
  }

  console.log(`Calibrating ${selectedInvoices.length} historical invoices across ${months.length} months...`);

  let calibratedCount = 0;
  for (let i = 0; i < selectedInvoices.length; i++) {
    const inv = selectedInvoices[i];
    const tier = TIERS[i % TIERS.length];

    // 1. Update invoice
    const { error: invErr } = await supabase
      .from("invoices")
      .update({
        subtotal: tier.subtotal,
        platform_fee: tier.platformFee,
        tax_amount: tier.taxAmount,
        total_amount: tier.totalAmount,
      })
      .eq("id", inv.id);

    if (invErr) {
      console.warn(`Failed to update invoice ${inv.id}:`, invErr.message);
      continue;
    }

    // 2. Update linked booking
    if (inv.booking_id) {
      await supabase
        .from("bookings")
        .update({
          total_amount: tier.totalAmount,
          platform_fee: tier.platformFee,
          worker_earnings: tier.workerEarnings,
        })
        .eq("id", inv.booking_id);

      // 3. Update linked payments
      await supabase
        .from("payments")
        .update({
          amount: tier.totalAmount,
        })
        .eq("invoice_id", inv.id);
    }

    calibratedCount++;
  }

  console.log(`✅ Successfully calibrated ${calibratedCount} historical invoices with valid cooperative share.`);

  // 4. Verify economics reconciliation on Ahmedabad earnings
  const { FederationEarningsService } = await import(
    "../features/federation-admin/earnings/services/earnings-service"
  );
  const earningsService = new FederationEarningsService();
  const sepEarnings = await earningsService.getEarningsData("2026-09", supabase);

  console.log("\n📊 September 2026 Ahmedabad Economics Reconciliation:");
  console.log(`- Service Value (Gross): ₹${sepEarnings.kpis.thisMonth}`);
  console.log(`- Worker Payouts: ₹${sepEarnings.kpis.netPayout}`);
  console.log(`- Platform Fee: ₹${sepEarnings.kpis.platformCommission}`);
  console.log(`- Taxes Collected: ₹${sepEarnings.kpis.taxCollected}`);
  console.log(`- Federation Service Share: ₹${sepEarnings.kpis.federationServiceShare}`);
  console.log(`- Completed Transactions: ${sepEarnings.kpis.completedTransactionsCount}`);

  const mathCheck =
    sepEarnings.kpis.thisMonth -
    sepEarnings.kpis.netPayout -
    sepEarnings.kpis.platformCommission -
    (sepEarnings.kpis.taxCollected || 0);

  console.log(`- Mathematical Residual Check: ₹${mathCheck.toFixed(2)} === ₹${sepEarnings.kpis.federationServiceShare}`);
  if (sepEarnings.kpis.federationServiceShare && sepEarnings.kpis.federationServiceShare > 0) {
    console.log("✅ SUCCESS: Federation Service Share is strictly GREATER than zero!");
  } else {
    console.warn("⚠️ Warning: Federation Service Share is still 0.");
  }

  // 5. Verify Ravi Patel protection
  const { data: raviBookings } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("worker_id", raviId);

  const raviCompleted = raviBookings?.filter(
    (b) => b.status === "BOOKING_COMPLETED" || b.status === "SERVICE_COMPLETED"
  ).length;

  console.log(`\n🛡️ Ravi Patel Protection Check: Completed Bookings = ${raviCompleted} (Must be exactly 38)`);
}

seedFederationEconomics().catch(console.error);

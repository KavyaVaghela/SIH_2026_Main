import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// 1. CONFIGURATION & CLIENT INITIALIZATION
// ---------------------------------------------------------------------------
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
if (!supabaseUrl || !secretKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, secretKey);

// ---------------------------------------------------------------------------
// 2. PROTECTED ENTITY IDS (STRICTLY PRESERVED)
// ---------------------------------------------------------------------------
const PROTECTED_RAVI_PATEL_WORKER_ID = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
const PROTECTED_PRINCE_PRAJAPATI_PROFILE_ID = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";

// The 7 Ahmedabad under-utilized workers (MUST NOT RECEIVE 14-DAY WORKLOAD, MUST REMAIN AVAILABLE)
const AHMEDABAD_UNDERUTILIZED_WORKER_IDS = new Set([
  "011635a9-5d9a-4310-9d13-81d506e3dc29", // Kiran Patel
  "3f843d0a-c6c3-4ab7-a258-9f132442638d", // Dhruv Moradiya
  "0f5b3bca-0ca6-4a8a-b050-24dde848937b", // Peter Parker
  "50293908-db27-4cb0-8e4a-cb2a274b165b", // Krish Kalal
  "143bbb64-b2cd-4a68-ab97-b43fe02361df", // Sanjay Parmar
  "7963c4df-7033-43d6-9280-b1418d43a4da", // Sunita Sharma
  "10d74e2a-62ce-4260-adf9-67e16de838fb", // Bhavin Mistri
]);

// The 5 cross-federation qualified plumbers (MUST REMAIN AVAILABLE, WORKED HOURS < 32)
const CROSS_FED_PLUMBER_IDS = new Set([
  "f898e309-b22e-45b7-9ae2-9d8d544b86f3", // Bharat Makwana (Gandhinagar)
  "ab12804a-49b8-4a79-a320-3683256b87ae", // Srinivas Rao (Vadodara)
  "e5c790e4-e8a8-423a-ba91-ff96a00e3ade", // Geeta Vaghela (Rajkot)
  "8a603a45-04fe-4e09-8b33-058cff4acb40", // Pramod Joshi (Surat)
  "c1de97ea-0747-49b6-887e-572066579cc3", // Kanti Mistry (Surat)
]);

// ---------------------------------------------------------------------------
// 3. MAIN ENRICHMENT ROUTINE
// ---------------------------------------------------------------------------
async function main() {
  console.log("================================================================");
  console.log("🚀 PHASE 6 — SUPER ADMIN FINAL DATA & ANALYTICS ENRICHMENT");
  console.log("================================================================");

  // 1. Fetch reference lookups
  console.log("\n1. Fetching relational references...");
  const { data: federations } = await adminClient.from("federations").select("id, name, city, code");
  const { data: workers } = await adminClient.from("workers").select("id, federation_id, profession, availability_status, account_status");
  const { data: customers } = await adminClient.from("profiles").select("id, full_name, email").eq("role", "CUSTOMER").neq("id", PROTECTED_PRINCE_PRAJAPATI_PROFILE_ID);
  const { data: services } = await adminClient.from("services").select("id, title, category_id");
  const { data: addresses } = await adminClient.from("addresses").select("id, profile_id");
  const fallbackAddressId = addresses?.[0]?.id || "";
  const addressByCustomer = new Map<string, string>();
  addresses?.forEach(a => {
    if (a.profile_id) addressByCustomer.set(a.profile_id, a.id);
  });

  const amdFed = federations?.find(f => f.name.includes("Ahmedabad Skilled"));
  const surFed = federations?.find(f => f.name.includes("Surat Technicians"));
  const vadFed = federations?.find(f => f.name.includes("Vadodara Artisan"));
  const gandhiFed = federations?.find(f => f.name.includes("Gujarat Household"));
  const rajFed = federations?.find(f => f.name.includes("Saurashtra Skilled"));

  console.log(`  - Ahmedabad Fed: ${amdFed?.id}`);
  console.log(`  - Surat Fed: ${surFed?.id}`);
  console.log(`  - Vadodara Fed: ${vadFed?.id}`);
  console.log(`  - Gandhinagar Fed: ${gandhiFed?.id}`);
  console.log(`  - Rajkot Fed: ${rajFed?.id}`);

  const customerList = customers || [];
  if (customerList.length === 0) {
    throw new Error("No non-protected customer profiles found!");
  }

  // Service lookup by keyword
  const findService = (keyword: string) => {
    return services?.find(s => s.title.toLowerCase().includes(keyword.toLowerCase())) || services?.[0];
  };

  const drainageService = findService("Drainage Blockage");
  const pipeWorkService = findService("Water Tank / Pipeline");
  const switchRepairService = findService("Switch / Socket");
  const fanRepairService = findService("Fan Repair");
  const tileRepairService = findService("Broken Tile");
  const cleanService = findService("Drainage") || services?.[0];

  // ---------------------------------------------------------------------------
  // 4. SEED EMERGENCY BOOKINGS (~36 RECORDS, 77.8% COMPLETION RATE)
  // ---------------------------------------------------------------------------
  console.log("\n2. Seeding genuine historical Emergency Bookings & Incidents...");

  const emergencyDefinitions = [
    // --- AHMEDABAD (18 incidents: 14 completed, 2 active, 1 unassigned, 1 cancelled) ---
    { fedId: amdFed?.id, desc: "Urgent main water line burst in basement parking", status: "BOOKING_COMPLETED", daysAgo: 45, trade: "Plumbing", srv: pipeWorkService, amount: 1850 },
    { fedId: amdFed?.id, desc: "Emergency electrical short circuit near distribution box", status: "BOOKING_COMPLETED", daysAgo: 40, trade: "Electrical", srv: switchRepairService, amount: 2200 },
    { fedId: amdFed?.id, desc: "Bathroom pipeline burst and severe apartment flooding", status: "BOOKING_COMPLETED", daysAgo: 38, trade: "Plumbing", srv: pipeWorkService, amount: 1950 },
    { fedId: amdFed?.id, desc: "Emergency lockout - front door security latch broken", status: "BOOKING_COMPLETED", daysAgo: 50, trade: "Carpentry", srv: drainageService, amount: 1400 },
    { fedId: amdFed?.id, desc: "Urgent drainage overflow hazard in ground floor clinic", status: "BOOKING_COMPLETED", daysAgo: 60, trade: "Plumbing", srv: drainageService, amount: 2100 },
    { fedId: amdFed?.id, desc: "Main meter sparking emergency at cooperative housing society", status: "BOOKING_COMPLETED", daysAgo: 70, trade: "Electrical", srv: switchRepairService, amount: 2400 },
    { fedId: amdFed?.id, desc: "Ceiling water pipeline burst above server room", status: "BOOKING_COMPLETED", daysAgo: 85, trade: "Plumbing", srv: pipeWorkService, amount: 2800 },
    { fedId: amdFed?.id, desc: "Emergency electrical burning smell and tripped breaker", status: "BOOKING_COMPLETED", daysAgo: 95, trade: "Electrical", srv: switchRepairService, amount: 1600 },
    { fedId: amdFed?.id, desc: "Urgent overhead water tank inlet valve burst", status: "BOOKING_COMPLETED", daysAgo: 110, trade: "Plumbing", srv: pipeWorkService, amount: 1750 },
    { fedId: amdFed?.id, desc: "Kitchen main drain pipe severe burst & backup", status: "BOOKING_COMPLETED", daysAgo: 125, trade: "Plumbing", srv: drainageService, amount: 1900 },
    { fedId: amdFed?.id, desc: "Emergency air conditioner electrical wire short circuit", status: "BOOKING_COMPLETED", daysAgo: 135, trade: "Electrical", srv: fanRepairService, amount: 1850 },
    { fedId: amdFed?.id, desc: "Urgent commercial shop shutter lockout and bent latch", status: "BOOKING_COMPLETED", daysAgo: 145, trade: "Carpentry", srv: drainageService, amount: 1650 },
    { fedId: amdFed?.id, desc: "High-pressure municipal supply pipe burst near meter", status: "BOOKING_COMPLETED", daysAgo: 155, trade: "Plumbing", srv: pipeWorkService, amount: 2300 },
    { fedId: amdFed?.id, desc: "Emergency exhaust fan burning and heavy spark", status: "BOOKING_COMPLETED", daysAgo: 165, trade: "Electrical", srv: fanRepairService, amount: 1350 },
    // Active / in-progress
    { fedId: amdFed?.id, desc: "Urgent bathroom pipeline joint split and active gush", status: "SERVICE_STARTED", daysAgo: 0.1, trade: "Plumbing", srv: pipeWorkService, amount: 1900 },
    { fedId: amdFed?.id, desc: "Emergency elevator room distribution line spark", status: "ON_THE_WAY", daysAgo: 0.2, trade: "Electrical", srv: switchRepairService, amount: 2500 },
    // Dispatched / Unassigned
    { fedId: amdFed?.id, desc: "Urgent residential main drainage blockage and backflow", status: "REQUEST_SENT", daysAgo: 0.3, trade: "Plumbing", srv: drainageService, amount: 1800, unassigned: true },
    // Cancelled
    { fedId: amdFed?.id, desc: "Emergency lockout - resident found spare key with neighbor", status: "CANCELLED", daysAgo: 20, trade: "Carpentry", srv: drainageService, amount: 1200 },

    // --- SURAT (10 incidents: 8 completed, 1 active, 1 unassigned) ---
    { fedId: surFed?.id, desc: "Urgent commercial warehouse water pipe burst", status: "BOOKING_COMPLETED", daysAgo: 30, trade: "Plumbing", srv: pipeWorkService, amount: 2400 },
    { fedId: surFed?.id, desc: "Emergency textile unit switchboard short circuit", status: "BOOKING_COMPLETED", daysAgo: 42, trade: "Electrical", srv: switchRepairService, amount: 2600 },
    { fedId: surFed?.id, desc: "Emergency lockout at textile office complex", status: "BOOKING_COMPLETED", daysAgo: 55, trade: "Carpentry", srv: drainageService, amount: 1500 },
    { fedId: surFed?.id, desc: "Urgent underground storage tank valve burst", status: "BOOKING_COMPLETED", daysAgo: 75, trade: "Plumbing", srv: pipeWorkService, amount: 2200 },
    { fedId: surFed?.id, desc: "Emergency factory exhaust fan short circuit & smoke", status: "BOOKING_COMPLETED", daysAgo: 90, trade: "Electrical", srv: fanRepairService, amount: 1950 },
    { fedId: surFed?.id, desc: "Urgent residential bathroom drain blockage burst", status: "BOOKING_COMPLETED", daysAgo: 115, trade: "Plumbing", srv: drainageService, amount: 1700 },
    { fedId: surFed?.id, desc: "High voltage capacitor box spark emergency", status: "BOOKING_COMPLETED", daysAgo: 130, trade: "Electrical", srv: switchRepairService, amount: 2750 },
    { fedId: surFed?.id, desc: "Urgent kitchen pipeline leak flooding bakery floor", status: "BOOKING_COMPLETED", daysAgo: 150, trade: "Plumbing", srv: pipeWorkService, amount: 2100 },
    // Active
    { fedId: surFed?.id, desc: "Emergency diamond market storefront lockout", status: "ARRIVED", daysAgo: 0.15, trade: "Carpentry", srv: drainageService, amount: 1800 },
    // Unassigned
    { fedId: surFed?.id, desc: "Urgent textile shop main water inlet pipe rupture", status: "WORKER_REVIEWING", daysAgo: 0.25, trade: "Plumbing", srv: pipeWorkService, amount: 2200, unassigned: true },

    // --- VADODARA (5 incidents: 4 completed, 1 active) ---
    { fedId: vadFed?.id, desc: "Emergency electrical panel sparking in industrial shed", status: "BOOKING_COMPLETED", daysAgo: 35, trade: "Electrical", srv: switchRepairService, amount: 2500 },
    { fedId: vadFed?.id, desc: "Urgent water tank overflow line burst in apartment", status: "BOOKING_COMPLETED", daysAgo: 65, trade: "Plumbing", srv: pipeWorkService, amount: 1800 },
    { fedId: vadFed?.id, desc: "Emergency commercial office door lockout", status: "BOOKING_COMPLETED", daysAgo: 100, trade: "Carpentry", srv: drainageService, amount: 1500 },
    { fedId: vadFed?.id, desc: "Urgent drainage pipe crack and toxic backflow", status: "BOOKING_COMPLETED", daysAgo: 140, trade: "Plumbing", srv: drainageService, amount: 2200 },
    // Active
    { fedId: vadFed?.id, desc: "Emergency laboratory exhaust wiring short circuit", status: "BOOKING_CONFIRMED", daysAgo: 0.1, trade: "Electrical", srv: switchRepairService, amount: 2400 },

    // --- GANDHINAGAR (3 incidents: 2 completed, 1 cancelled) ---
    { fedId: gandhiFed?.id, desc: "Emergency government quarter water pipe burst", status: "BOOKING_COMPLETED", daysAgo: 50, trade: "Plumbing", srv: pipeWorkService, amount: 1900 },
    { fedId: gandhiFed?.id, desc: "Urgent sector clinic electrical switch spark emergency", status: "BOOKING_COMPLETED", daysAgo: 80, trade: "Electrical", srv: switchRepairService, amount: 2100 },
    // Cancelled
    { fedId: gandhiFed?.id, desc: "Emergency door lockout - master key retrieved from security", status: "CANCELLED", daysAgo: 25, trade: "Carpentry", srv: drainageService, amount: 1100 },
  ];

  let emInserted = 0;
  for (let i = 0; i < emergencyDefinitions.length; i++) {
    const em = emergencyDefinitions[i];
    const emId = `00000003-0000-4000-8000-${String(i + 1).padStart(12, "0")}`;

    // Check if already exists
    const { data: existing } = await (adminClient.from("bookings") as any).select("id").eq("id", emId).single();
    if (existing) continue;

    // Pick a compatible worker from that federation who is NOT protected under-utilized
    const fedWorkers = (workers || []).filter(w =>
      w.federation_id === em.fedId &&
      !AHMEDABAD_UNDERUTILIZED_WORKER_IDS.has(w.id) &&
      !CROSS_FED_PLUMBER_IDS.has(w.id) &&
      w.id !== PROTECTED_RAVI_PATEL_WORKER_ID
    );
    const assignedWorker = em.unassigned ? null : (fedWorkers[i % fedWorkers.length]?.id || null);
    const customer = customerList[i % customerList.length];
    const addressId = addressByCustomer.get(customer.id) || fallbackAddressId;

    const createdAt = new Date(Date.now() - em.daysAgo * 86400000).toISOString();
    const actualStart = new Date(Date.now() - em.daysAgo * 86400000 + 15 * 60000).toISOString();
    const actualEnd = new Date(Date.now() - em.daysAgo * 86400000 + 120 * 60000).toISOString();

    // 1. Insert Booking
    const { error: bErr } = await (adminClient.from("bookings") as any).insert({
      id: emId,
      booking_number: `EMG-BK-${String(i + 101).padStart(5, "0")}`,
      customer_id: customer.id,
      worker_id: assignedWorker,
      federation_id: em.fedId,
      service_id: em.srv.id,
      address_id: addressId,
      status: em.status,
      problem_description: em.desc,
      total_amount: em.amount,
      platform_fee: Math.round(em.amount * 0.10),
      worker_earnings: Math.round(em.amount * 0.90),
      scheduled_start_at: createdAt,
      scheduled_end_at: actualEnd,
      actual_start_at: em.status === "BOOKING_COMPLETED" ? actualStart : null,
      actual_end_at: em.status === "BOOKING_COMPLETED" ? actualEnd : null,
      created_at: createdAt,
      updated_at: em.status === "BOOKING_COMPLETED" ? actualEnd : createdAt,
    });

    if (bErr) {
      console.error(`Error inserting emergency booking ${emId}:`, bErr.message);
      continue;
    }
    emInserted++;

    // 2. If completed, insert invoice, payment, review
    if (em.status === "BOOKING_COMPLETED" && assignedWorker) {
      const subtotal = Number((em.amount * 0.90).toFixed(2));
      const platformFee = Number((em.amount * 0.05).toFixed(2));
      const taxAmount = Number((em.amount * 0.05).toFixed(2));
      const totalAmount = Number((subtotal + platformFee + taxAmount).toFixed(2));

      const invId = `00000003-1000-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("invoices") as any).upsert({
        id: invId,
        invoice_number: `INV-EMG-${String(i + 101).padStart(5, "0")}`,
        booking_id: emId,
        customer_id: customer.id,
        federation_id: em.fedId,
        subtotal,
        platform_fee: platformFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: "paid",
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      const payId = `00000003-2000-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("payments") as any).upsert({
        id: payId,
        payment_number: `PAY-EMG-${String(i + 101).padStart(5, "0")}`,
        invoice_id: invId,
        booking_id: emId,
        customer_id: customer.id,
        amount: totalAmount,
        status: "PAID",
        gateway_provider: "razorpay",
        paid_at: actualEnd,
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      // Review for majority of completed
      if (i % 3 !== 0) {
        const revId = `00000003-3000-4000-8000-${String(i + 1).padStart(12, "0")}`;
        const rating = (i % 5 === 0) ? 4 : 5;
        const comment = rating === 5
          ? "Outstanding rapid emergency response! The technician arrived within 25 minutes and stopped the critical leak immediately."
          : "Quick emergency dispatch and professional repair. Solved the hazard cleanly.";

        await (adminClient.from("reviews") as any).upsert({
          id: revId,
          booking_id: emId,
          customer_id: customer.id,
          worker_id: assignedWorker,
          rating,
          comment,
          created_at: new Date(Date.parse(actualEnd) + 3600000).toISOString(),
        });
      }
    }

    // 3. Mirror into emergency_incidents table
    const incId = `00000003-4000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    const incStatus = em.status === "BOOKING_COMPLETED" ? "resolved"
      : em.status === "CANCELLED" ? "cancelled"
      : em.unassigned ? "dispatched"
      : "in_progress";

    await (adminClient.from("emergency_incidents") as any).upsert({
      id: incId,
      emergency_id: `EMG-2026-${String(i + 1001).padStart(4, "0")}`,
      customer_id: customer.id,
      federation_id: em.fedId,
      status: incStatus,
      priority: (i % 3 === 0) ? "CRITICAL" : "HIGH",
      trade_required: em.trade,
      description: em.desc,
      latitude: 23.0225 + (i * 0.005),
      longitude: 72.5714 + (i * 0.005),
      response_matrix_code: `CODE-EMG-${em.trade.toUpperCase().slice(0, 3)}`,
      created_at: createdAt,
      updated_at: actualEnd,
    });
  }
  console.log(`  ✅ Inserted ${emInserted} genuine historical emergency records.`);

  // ---------------------------------------------------------------------------
  // 5. ENRICH TOP FEDERATIONS ACTIVITY (SURAT, VADODARA, GANDHINAGAR, RAJKOT)
  // ---------------------------------------------------------------------------
  console.log("\n3. Enriching Top Performing Federations Activity for Natural Benchmarking...");

  // FEDERATION A: SURAT TECHNICIANS GUILD (Rank #1 target ~90–92 pts)
  console.log("  -> Configuring Surat Technicians Guild (Rank #1 target)...");
  const suratWorkers = (workers || []).filter(w =>
    w.federation_id === surFed?.id &&
    !CROSS_FED_PLUMBER_IDS.has(w.id)
  );

  // Set 6 workers to BUSY (Manthu King is already busy, making 7 / 14 = 50.0% utilization)
  const suratBusyWorkers = suratWorkers.slice(0, 6);
  for (const w of suratBusyWorkers) {
    await adminClient.from("workers").update({ availability_status: "BUSY" }).eq("id", w.id);
  }

  for (let i = 0; i < 26; i++) {
    const bId = `00000004-1000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    const { data: existing } = await (adminClient.from("bookings") as any).select("id").eq("id", bId).single();
    if (existing) continue;

    const isCancelled = i === 25;
    const worker = suratWorkers[i % suratWorkers.length];
    const customer = customerList[i % customerList.length];
    const addressId = addressByCustomer.get(customer.id) || fallbackAddressId;
    const daysAgo = 25 + (i * 4); // Spread across 25 to 130 days ago (no 14-day capacity pollution)
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    const actualEnd = new Date(Date.now() - daysAgo * 86400000 + 90 * 60000).toISOString();
    const amount = 850 + (i % 5) * 150;

    const { error: sErr } = await (adminClient.from("bookings") as any).insert({
      id: bId,
      booking_number: `SUR-BK-${String(i + 201).padStart(5, "0")}`,
      customer_id: customer.id,
      worker_id: worker.id,
      federation_id: surFed?.id,
      service_id: (i % 2 === 0 ? switchRepairService.id : fanRepairService.id),
      address_id: addressId,
      status: isCancelled ? "CANCELLED" : "BOOKING_COMPLETED",
      problem_description: isCancelled ? "Client rescheduled with local contractor" : "Cooperative electrical appliance installation & wiring inspection",
      total_amount: amount,
      platform_fee: Math.round(amount * 0.10),
      worker_earnings: Math.round(amount * 0.90),
      scheduled_start_at: createdAt,
      scheduled_end_at: actualEnd,
      actual_start_at: isCancelled ? null : createdAt,
      actual_end_at: isCancelled ? null : actualEnd,
      created_at: createdAt,
      updated_at: actualEnd,
    });

    if (sErr) {
      console.error("Surat insert error:", sErr.message);
      continue;
    }

    if (!isCancelled) {
      const invId = `00000004-1100-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("invoices") as any).upsert({
        id: invId,
        invoice_number: `INV-SUR-${String(i + 201).padStart(5, "0")}`,
        booking_id: bId,
        customer_id: customer.id,
        federation_id: surFed?.id,
        subtotal: Number((amount * 0.90).toFixed(2)),
        platform_fee: Number((amount * 0.05).toFixed(2)),
        tax_amount: Number((amount * 0.05).toFixed(2)),
        total_amount: amount,
        status: "paid",
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      const payId = `00000004-1200-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("payments") as any).upsert({
        id: payId,
        payment_number: `PAY-SUR-${String(i + 201).padStart(5, "0")}`,
        invoice_id: invId,
        booking_id: bId,
        customer_id: customer.id,
        amount,
        status: "PAID",
        gateway_provider: "razorpay",
        paid_at: actualEnd,
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      // Reviews: mostly 5s (85%), some 4s (15%) -> rating ~4.85
      if (i % 6 !== 0) {
        const rating = (i % 7 === 0) ? 4 : 5;
        const revId = `00000004-1300-4000-8000-${String(i + 1).padStart(12, "0")}`;
        await (adminClient.from("reviews") as any).upsert({
          id: revId,
          booking_id: bId,
          customer_id: customer.id,
          worker_id: worker.id,
          rating,
          comment: rating === 5 ? "Flawless service delivery by Surat Technicians Guild craftsman." : "Good prompt work and clean installation.",
          created_at: new Date(Date.parse(actualEnd) + 3600000).toISOString(),
        });
      }
    }
  }

  // FEDERATION B: VADODARA ARTISAN COOPERATIVE (Rank #2 target ~84–88 pts)
  console.log("  -> Configuring Vadodara Artisan Cooperative (Rank #2 target)...");
  const vadodaraWorkers = (workers || []).filter(w =>
    w.federation_id === vadFed?.id &&
    !CROSS_FED_PLUMBER_IDS.has(w.id)
  );

  // Set 6 non-plumber workers to BUSY (6 / 12 = 50.0% utilization)
  const vadBusyWorkers = vadodaraWorkers.slice(0, 6);
  for (const w of vadBusyWorkers) {
    await adminClient.from("workers").update({ availability_status: "BUSY" }).eq("id", w.id);
  }

  for (let i = 0; i < 32; i++) {
    const bId = `00000004-2000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    const { data: existing } = await (adminClient.from("bookings") as any).select("id").eq("id", bId).single();
    if (existing) continue;

    const isCancelled = (i === 15 || i === 31);
    const isInProgress = (i === 30);
    const worker = vadodaraWorkers[i % vadodaraWorkers.length];
    const customer = customerList[i % customerList.length];
    const addressId = addressByCustomer.get(customer.id) || fallbackAddressId;
    const daysAgo = 25 + (i * 4);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    const actualEnd = new Date(Date.now() - daysAgo * 86400000 + 90 * 60000).toISOString();
    const amount = 750 + (i % 6) * 120;

    const { error: vErr } = await (adminClient.from("bookings") as any).insert({
      id: bId,
      booking_number: `VAD-BK-${String(i + 101).padStart(5, "0")}`,
      customer_id: customer.id,
      worker_id: worker.id,
      federation_id: vadFed?.id,
      service_id: (i % 2 === 0 ? tileRepairService.id : switchRepairService.id),
      address_id: addressId,
      status: isCancelled ? "CANCELLED" : isInProgress ? "SERVICE_STARTED" : "BOOKING_COMPLETED",
      problem_description: isCancelled ? "Order cancelled by customer due to timing conflict" : "Artisan tile alignment and precision electrical wiring maintenance",
      total_amount: amount,
      platform_fee: Math.round(amount * 0.10),
      worker_earnings: Math.round(amount * 0.90),
      scheduled_start_at: createdAt,
      scheduled_end_at: actualEnd,
      actual_start_at: isCancelled ? null : createdAt,
      actual_end_at: (isCancelled || isInProgress) ? null : actualEnd,
      created_at: createdAt,
      updated_at: actualEnd,
    });

    if (vErr) {
      console.error("Vadodara insert error:", vErr.message);
      continue;
    }

    if (!isCancelled && !isInProgress) {
      const invId = `00000004-2100-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("invoices") as any).upsert({
        id: invId,
        invoice_number: `INV-VAD-${String(i + 101).padStart(5, "0")}`,
        booking_id: bId,
        customer_id: customer.id,
        federation_id: vadFed?.id,
        subtotal: Number((amount * 0.90).toFixed(2)),
        platform_fee: Number((amount * 0.05).toFixed(2)),
        tax_amount: Number((amount * 0.05).toFixed(2)),
        total_amount: amount,
        status: "paid",
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      const payId = `00000004-2200-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("payments") as any).upsert({
        id: payId,
        payment_number: `PAY-VAD-${String(i + 101).padStart(5, "0")}`,
        invoice_id: invId,
        booking_id: bId,
        customer_id: customer.id,
        amount,
        status: "PAID",
        gateway_provider: "razorpay",
        paid_at: actualEnd,
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      // Reviews: mostly 5s and 4s -> rating ~4.70
      if (i % 5 !== 0) {
        const rating = (i % 3 === 0) ? 4 : 5;
        const revId = `00000004-2300-4000-8000-${String(i + 1).padStart(12, "0")}`;
        await (adminClient.from("reviews") as any).upsert({
          id: revId,
          booking_id: bId,
          customer_id: customer.id,
          worker_id: worker.id,
          rating,
          comment: rating === 5 ? "Vadodara artisan craftsmanship was top tier." : "Satisfactory service delivered cleanly.",
          created_at: new Date(Date.parse(actualEnd) + 3600000).toISOString(),
        });
      }
    }
  }

  // FEDERATION C: GUJARAT HOUSEHOLD SERVICES FEDERATION (Rank #3 target ~80–84 pts)
  console.log("  -> Configuring Gujarat Household Services Federation (Rank #3 target)...");
  const gandhiWorkers = (workers || []).filter(w =>
    w.federation_id === gandhiFed?.id &&
    !CROSS_FED_PLUMBER_IDS.has(w.id)
  );

  // Set 4 non-plumber workers to BUSY (4 / 9 = 44.4% utilization)
  const gandhiBusyWorkers = gandhiWorkers.slice(0, 4);
  for (const w of gandhiBusyWorkers) {
    await adminClient.from("workers").update({ availability_status: "BUSY" }).eq("id", w.id);
  }

  for (let i = 0; i < 34; i++) {
    const bId = `00000004-3000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    const { data: existing } = await (adminClient.from("bookings") as any).select("id").eq("id", bId).single();
    if (existing) continue;

    const isCancelled = (i === 16 || i === 33);
    const isInProgress = (i === 31 || i === 32);
    const worker = gandhiWorkers[i % gandhiWorkers.length];
    const customer = customerList[i % customerList.length];
    const addressId = addressByCustomer.get(customer.id) || fallbackAddressId;
    const daysAgo = 25 + (i * 4);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    const actualEnd = new Date(Date.now() - daysAgo * 86400000 + 90 * 60000).toISOString();
    const amount = 650 + (i % 5) * 110;

    const { error: gErr } = await (adminClient.from("bookings") as any).insert({
      id: bId,
      booking_number: `GUJ-BK-${String(i + 101).padStart(5, "0")}`,
      customer_id: customer.id,
      worker_id: worker.id,
      federation_id: gandhiFed?.id,
      service_id: cleanService.id,
      address_id: addressId,
      status: isCancelled ? "CANCELLED" : isInProgress ? "SERVICE_STARTED" : "BOOKING_COMPLETED",
      problem_description: isCancelled ? "Cancelled by user" : "Comprehensive household cooperative sanitation & cleaning routine",
      total_amount: amount,
      platform_fee: Math.round(amount * 0.10),
      worker_earnings: Math.round(amount * 0.90),
      scheduled_start_at: createdAt,
      scheduled_end_at: actualEnd,
      actual_start_at: isCancelled ? null : createdAt,
      actual_end_at: (isCancelled || isInProgress) ? null : actualEnd,
      created_at: createdAt,
      updated_at: actualEnd,
    });

    if (gErr) {
      console.error("Gandhinagar insert error:", gErr.message);
      continue;
    }

    if (!isCancelled && !isInProgress) {
      const invId = `00000004-3100-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("invoices") as any).upsert({
        id: invId,
        invoice_number: `INV-GUJ-${String(i + 101).padStart(5, "0")}`,
        booking_id: bId,
        customer_id: customer.id,
        federation_id: gandhiFed?.id,
        subtotal: Number((amount * 0.90).toFixed(2)),
        platform_fee: Number((amount * 0.05).toFixed(2)),
        tax_amount: Number((amount * 0.05).toFixed(2)),
        total_amount: amount,
        status: "paid",
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      const payId = `00000004-3200-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("payments") as any).upsert({
        id: payId,
        payment_number: `PAY-GUJ-${String(i + 101).padStart(5, "0")}`,
        invoice_id: invId,
        booking_id: bId,
        customer_id: customer.id,
        amount,
        status: "PAID",
        gateway_provider: "razorpay",
        paid_at: actualEnd,
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      // Reviews: mix of 5s, 4s, and rare 3 -> rating ~4.60
      if (i % 4 !== 0) {
        const rating = (i % 6 === 0) ? 3 : (i % 2 === 0) ? 4 : 5;
        const revId = `00000004-3300-4000-8000-${String(i + 1).padStart(12, "0")}`;
        await (adminClient.from("reviews") as any).upsert({
          id: revId,
          booking_id: bId,
          customer_id: customer.id,
          worker_id: worker.id,
          rating,
          comment: rating === 5 ? "Very thorough cleaning service." : rating === 4 ? "Good reliable work." : "Decent work, slightly delayed arrival.",
          created_at: new Date(Date.parse(actualEnd) + 3600000).toISOString(),
        });
      }
    }
  }

  // FEDERATION D: SAURASHTRA SKILLED WORKERS GUILD (Rajkot, ~70–74 pts)
  console.log("  -> Configuring Saurashtra Skilled Workers Guild (Rajkot)...");
  const rajkotWorkers = (workers || []).filter(w =>
    w.federation_id === rajFed?.id &&
    !CROSS_FED_PLUMBER_IDS.has(w.id)
  );

  // Set 3 workers to BUSY (3 / 8 = 37.5% utilization)
  for (const w of rajkotWorkers.slice(0, 3)) {
    await adminClient.from("workers").update({ availability_status: "BUSY" }).eq("id", w.id);
  }

  for (let i = 0; i < 15; i++) {
    const bId = `00000004-4000-4000-8000-${String(i + 1).padStart(12, "0")}`;
    const { data: existing } = await (adminClient.from("bookings") as any).select("id").eq("id", bId).single();
    if (existing) continue;

    const isCancelled = i === 14;
    const worker = rajkotWorkers[i % rajkotWorkers.length];
    const customer = customerList[i % customerList.length];
    const addressId = addressByCustomer.get(customer.id) || fallbackAddressId;
    const daysAgo = 30 + (i * 6);
    const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
    const actualEnd = new Date(Date.now() - daysAgo * 86400000 + 90 * 60000).toISOString();
    const amount = 700 + (i % 4) * 100;

    const { error: rErr } = await (adminClient.from("bookings") as any).insert({
      id: bId,
      booking_number: `RJK-BK-${String(i + 101).padStart(5, "0")}`,
      customer_id: customer.id,
      worker_id: worker.id,
      federation_id: rajFed?.id,
      service_id: switchRepairService.id,
      address_id: addressId,
      status: isCancelled ? "CANCELLED" : "BOOKING_COMPLETED",
      problem_description: isCancelled ? "Client cancelled booking" : "Rajkot artisan electrical fixture installation",
      total_amount: amount,
      platform_fee: Math.round(amount * 0.10),
      worker_earnings: Math.round(amount * 0.90),
      scheduled_start_at: createdAt,
      scheduled_end_at: actualEnd,
      actual_start_at: isCancelled ? null : createdAt,
      actual_end_at: isCancelled ? null : actualEnd,
      created_at: createdAt,
      updated_at: actualEnd,
    });

    if (rErr) {
      console.error("Rajkot insert error:", rErr.message);
      continue;
    }

    if (!isCancelled) {
      const invId = `00000004-4100-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("invoices") as any).upsert({
        id: invId,
        invoice_number: `INV-RJK-${String(i + 101).padStart(5, "0")}`,
        booking_id: bId,
        customer_id: customer.id,
        federation_id: rajFed?.id,
        subtotal: Number((amount * 0.90).toFixed(2)),
        platform_fee: Number((amount * 0.05).toFixed(2)),
        tax_amount: Number((amount * 0.05).toFixed(2)),
        total_amount: amount,
        status: "paid",
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      const payId = `00000004-4200-4000-8000-${String(i + 1).padStart(12, "0")}`;
      await (adminClient.from("payments") as any).upsert({
        id: payId,
        payment_number: `PAY-RJK-${String(i + 101).padStart(5, "0")}`,
        invoice_id: invId,
        booking_id: bId,
        customer_id: customer.id,
        amount,
        status: "PAID",
        gateway_provider: "razorpay",
        paid_at: actualEnd,
        created_at: actualEnd,
        updated_at: actualEnd,
      });

      // Reviews: rating ~4.40
      if (i % 3 !== 0) {
        const rating = (i % 2 === 0) ? 4 : 5;
        const revId = `00000004-4300-4000-8000-${String(i + 1).padStart(12, "0")}`;
        await (adminClient.from("reviews") as any).upsert({
          id: revId,
          booking_id: bId,
          customer_id: customer.id,
          worker_id: worker.id,
          rating,
          comment: "Good cooperative repair service in Rajkot.",
          created_at: new Date(Date.parse(actualEnd) + 3600000).toISOString(),
        });
      }
    }
  }

  // PLATFORM-WIDE DIVERSITY: Add 3-4 bookings to Mumbai, Pune, and Central India
  console.log("  -> Adding platform-wide comparative activity for other federations...");
  const otherFeds = federations?.filter(f =>
    f.id !== amdFed?.id &&
    f.id !== surFed?.id &&
    f.id !== vadFed?.id &&
    f.id !== gandhiFed?.id &&
    f.id !== rajFed?.id
  ) || [];

  for (let fIdx = 0; fIdx < Math.min(4, otherFeds.length); fIdx++) {
    const fed = otherFeds[fIdx];
    for (let i = 0; i < 3; i++) {
      const bId = `00000004-5000-4000-${String(fIdx).padStart(4, "0")}-${String(i + 1).padStart(12, "0")}`;
      const { data: existing } = await (adminClient.from("bookings") as any).select("id").eq("id", bId).single();
      if (existing) continue;

      const customer = customerList[i % customerList.length];
      const addressId = addressByCustomer.get(customer.id) || fallbackAddressId;
      const daysAgo = 40 + (i * 10);
      const createdAt = new Date(Date.now() - daysAgo * 86400000).toISOString();
      const actualEnd = new Date(Date.now() - daysAgo * 86400000 + 90 * 60000).toISOString();

      await (adminClient.from("bookings") as any).insert({
        id: bId,
        booking_number: `OTH-BK-${fIdx}-${i + 1}`,
        customer_id: customer.id,
        worker_id: null,
        federation_id: fed.id,
        service_id: drainageService.id,
        address_id: addressId,
        status: i === 2 ? "CANCELLED" : "BOOKING_COMPLETED",
        problem_description: "General cooperative trade request",
        total_amount: 800,
        platform_fee: 80,
        worker_earnings: 720,
        scheduled_start_at: createdAt,
        scheduled_end_at: actualEnd,
        created_at: createdAt,
        updated_at: actualEnd,
      });
    }
  }

  console.log("\n================================================================");
  console.log("🎉 ALL ENRICHMENT DATA APPLIED SUCCESSFULLY!");
  console.log("================================================================");
}

main().catch(err => {
  console.error("Fatal enrichment error:", err);
  process.exit(1);
});

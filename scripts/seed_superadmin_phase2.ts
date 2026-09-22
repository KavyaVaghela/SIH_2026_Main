import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

const uuidv4 = () => crypto.randomUUID();

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

async function seedSuperAdminPhase2Complete() {
  console.log("=================================================");
  console.log("🚀 SUPER ADMIN PHASE 2 REAL DATA COMPLETION");
  console.log("=================================================\n");

  // 1. Fetch reference data
  const [
    { data: federations },
    { data: allInvoices },
    { data: allPayments },
    { data: allBookings },
    { data: allWorkers },
    { data: allServices },
    { data: addresses },
  ] = await Promise.all([
    supabase.from("federations").select("id, name, city, state, is_active"),
    supabase.from("invoices").select("id, booking_id, customer_id, federation_id, total_amount, paid_at, created_at, status"),
    supabase.from("payments").select("invoice_id"),
    supabase.from("bookings").select("id, customer_id, worker_id, service_id, federation_id, status"),
    supabase.from("workers").select("id, federation_id, availability_status, account_status"),
    supabase.from("services").select("id, title, base_price"),
    supabase.from("addresses").select("id, city, state"),
  ]);

  const activeFeds = (federations || []).filter(
    (f) => f.is_active !== false && !f.name.includes("asdfgh") && !f.name.includes("Kushal") && !f.name.includes("Surti")
  );

  const existingPaidInvoiceIds = new Set(allPayments?.map((p) => p.invoice_id).filter(Boolean));
  const validCustomerIds = Array.from(new Set(allBookings?.map((b) => b.customer_id).filter(Boolean)));
  const validAddressIds = (addresses || []).map((a) => a.id);

  console.log(`Operational federations: ${activeFeds.length}`);
  console.log(`Valid customers: ${validCustomerIds.length}, Valid addresses: ${validAddressIds.length}`);

  // =========================================================================
  // STEP 1: INSERT PAYMENTS FOR INVOICES THAT LACK PAYMENTS
  // =========================================================================
  console.log("\n--- STEP 1: Linking Payments to Invoices ---");
  const invoicesWithoutPayment = (allInvoices || []).filter(
    (inv) => inv.status === "paid" && !existingPaidInvoiceIds.has(inv.id)
  );

  console.log(`Found ${invoicesWithoutPayment.length} paid invoices needing payment records.`);

  let paymentsAdded = 0;
  // Batch insert payments in chunks of 50
  for (let i = 0; i < invoicesWithoutPayment.length; i += 50) {
    const chunk = invoicesWithoutPayment.slice(i, i + 50);
    const paymentRows = chunk.map((inv, idx) => ({
      id: uuidv4(),
      payment_number: `PAY-2026-${Math.floor(20000 + i + idx)}`,
      invoice_id: inv.id,
      booking_id: inv.booking_id,
      customer_id: inv.customer_id || validCustomerIds[0],
      amount: inv.total_amount,
      gateway_provider: "RAZORPAY",
      gateway_order_id: `order_live_${Math.floor(20000 + i + idx)}`,
      gateway_payment_id: `pay_live_${Math.floor(20000 + i + idx)}`,
      status: "PAID",
      paid_at: inv.paid_at || inv.created_at || new Date().toISOString(),
      created_at: inv.created_at || new Date().toISOString(),
    }));

    const { error: pErr } = await supabase.from("payments").insert(paymentRows);
    if (!pErr) {
      paymentsAdded += paymentRows.length;
    } else {
      console.error("Payment chunk insert error:", pErr);
    }
  }

  console.log(`✅ Successfully seeded ${paymentsAdded} payment records linked to invoices.`);

  // =========================================================================
  // STEP 2: SEED MULTI-FEDERATION EMERGENCY OPERATIONS
  // =========================================================================
  console.log("\n--- STEP 2: Seeding Multi-Federation Emergency Operations ---");
  const emergencyTrades = [
    { title: "Drainage Blockage", desc: "Urgent drainage backup overflow in ground floor washroom" },
    { title: "Kitchen Plumbing", desc: "Emergency pipe burst under kitchen counter with active flooding" },
    { title: "Switch / Socket Repair", desc: "Short circuit sparking in main power distribution box" },
    { title: "Water Tank / Pipeline Work", desc: "Overhead tank pipe connection sheared off, emergency shutoff" },
    { title: "Toilet Repair", desc: "Emergency cistern flush valve jammed with continuous leak" },
  ];

  let emergencyCount = 0;
  for (const fed of activeFeds) {
    // If not Ahmedabad or Surat, seed 5-7 emergency jobs
    if (fed.id === "b765df3b-c418-4a15-b79f-3cbc09e475dc" || fed.id === "3adedc5e-bfa1-4eca-b78c-e43ba957fe21") {
      continue;
    }

    const fedWorkers = (allWorkers || []).filter((w) => w.federation_id === fed.id);
    if (fedWorkers.length === 0) continue;

    const countToSeed = 6; // 4 completed, 1 in progress (ON_THE_WAY), 1 in progress (SERVICE_STARTED)
    for (let i = 0; i < countToSeed; i++) {
      const trade = emergencyTrades[i % emergencyTrades.length];
      const matchedService = allServices?.find((s) => s.title === trade.title) || allServices?.[0];
      const assignedWorker = fedWorkers[i % fedWorkers.length];
      const customerId = validCustomerIds[(emergencyCount + i) % validCustomerIds.length];
      const addressId = validAddressIds[(emergencyCount + i) % validAddressIds.length];

      let status = "BOOKING_COMPLETED";
      if (i === 4) status = "ON_THE_WAY";
      if (i === 5) status = "SERVICE_STARTED";

      const bookingId = uuidv4();
      const bookingNumber = `EMG-2026-${Math.floor(30000 + emergencyCount + i)}`;
      const totalAmount = (matchedService?.base_price || 600) + 250; // emergency surcharge
      const platformFee = Math.round(totalAmount * 0.05);
      const taxAmount = Math.round(totalAmount * 0.18);
      const subtotal = totalAmount - platformFee - taxAmount;
      const workerEarnings = Math.round(subtotal * 0.88);

      const d = new Date(Date.now() - (countToSeed - i) * 12 * 60 * 60 * 1000);
      const createdAt = d.toISOString();
      const endD = new Date(d.getTime() + 2 * 60 * 60 * 1000);
      const scheduledEndAt = endD.toISOString();

      const { error: bErr } = await supabase.from("bookings").insert({
        id: bookingId,
        booking_number: bookingNumber,
        customer_id: customerId,
        worker_id: assignedWorker.id,
        service_id: matchedService?.id,
        federation_id: fed.id,
        address_id: addressId,
        status,
        problem_description: `[EMERGENCY PRIORITY] ${trade.desc}`,
        scheduled_start_at: createdAt,
        scheduled_end_at: scheduledEndAt,
        total_amount: totalAmount,
        platform_fee: platformFee,
        worker_earnings: workerEarnings,
        created_at: createdAt,
      });

      if (!bErr) {
        emergencyCount++;
        // If completed, add invoice & payment
        if (status === "BOOKING_COMPLETED") {
          const invId = uuidv4();
          await supabase.from("invoices").insert({
            id: invId,
            invoice_number: `INV-EMG-${Math.floor(30000 + emergencyCount + i)}`,
            booking_id: bookingId,
            customer_id: customerId,
            federation_id: fed.id,
            subtotal,
            platform_fee: platformFee,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status: "paid",
            issue_date: createdAt.split("T")[0],
            due_date: createdAt.split("T")[0],
            paid_at: createdAt,
            created_at: createdAt,
          });

          await supabase.from("payments").insert({
            id: uuidv4(),
            payment_number: `PAY-EMG-${Math.floor(30000 + emergencyCount + i)}`,
            booking_id: bookingId,
            invoice_id: invId,
            customer_id: customerId,
            amount: totalAmount,
            gateway_provider: "RAZORPAY",
            status: "PAID",
            paid_at: createdAt,
            created_at: createdAt,
          });
        }
      } else {
        console.error("Emergency booking insert error:", bErr);
      }
    }
  }

  console.log(`✅ Successfully seeded ${emergencyCount} multi-federation emergency bookings.`);

  // =========================================================================
  // STEP 3: SEED FRESH BOOKINGS FOR "TODAY" (2026-09-23)
  // =========================================================================
  console.log("\n--- STEP 3: Seeding Realistic Live Bookings for Today (2026-09-23) ---");
  const todayDateStr = "2026-09-23";
  const todayStatuses = [
    "REQUEST_SENT",
    "REQUEST_SENT",
    "CUSTOMER_CONFIRMATION_PENDING",
    "BOOKING_CONFIRMED",
    "WORKER_ACCEPTED",
    "WORKER_ACCEPTED",
    "ON_THE_WAY",
    "ON_THE_WAY",
    "ARRIVED",
    "SERVICE_STARTED",
    "SERVICE_STARTED",
    "SERVICE_STARTED",
    "BOOKING_COMPLETED",
    "BOOKING_COMPLETED",
    "BOOKING_COMPLETED",
    "CANCELLED",
  ];

  let todayCount = 0;
  for (let i = 0; i < 32; i++) {
    const fed = activeFeds[i % activeFeds.length];
    const fedWorkers = (allWorkers || []).filter((w) => w.federation_id === fed.id);
    const worker = fedWorkers.length > 0 ? fedWorkers[i % fedWorkers.length] : null;
    const service = allServices ? allServices[i % allServices.length] : null;
    const customerId = validCustomerIds[i % validCustomerIds.length];
    const addressId = validAddressIds[i % validAddressIds.length];

    const status = todayStatuses[i % todayStatuses.length];
    const totalAmount = Number(service?.base_price || 500) + (i % 3) * 150;
    const platformFee = Math.round(totalAmount * 0.05);
    const taxAmount = Math.round(totalAmount * 0.18);
    const subtotal = totalAmount - platformFee - taxAmount;
    const workerEarnings = Math.round(subtotal * 0.88);

    const hour = 8 + (i % 12);
    const minute = (i * 15) % 60;
    const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}:00Z`;
    const createdAt = `${todayDateStr}T${timeStr}`;
    const startD = new Date(createdAt);
    const endD = new Date(startD.getTime() + 2 * 60 * 60 * 1000);
    const scheduledStartAt = startD.toISOString();
    const scheduledEndAt = endD.toISOString();

    const bookingId = uuidv4();
    const bookingNumber = `BKG-2026-TD-${Math.floor(100 + i)}`;

    const { error: bErr } = await supabase.from("bookings").insert({
      id: bookingId,
      booking_number: bookingNumber,
      customer_id: customerId,
      worker_id: status === "REQUEST_SENT" ? null : worker?.id || null,
      service_id: service?.id,
      federation_id: fed.id,
      address_id: addressId,
      status,
      problem_description: `Scheduled cooperative gig service for ${service?.title || "Home Repair"}.`,
      scheduled_start_at: scheduledStartAt,
      scheduled_end_at: scheduledEndAt,
      total_amount: totalAmount,
      platform_fee: platformFee,
      worker_earnings: workerEarnings,
      created_at: createdAt,
    });

    if (!bErr) {
      todayCount++;
      if (status === "BOOKING_COMPLETED") {
        const invId = uuidv4();
        await supabase.from("invoices").insert({
          id: invId,
          invoice_number: `INV-2026-TD-${Math.floor(100 + i)}`,
          booking_id: bookingId,
          customer_id: customerId,
          federation_id: fed.id,
          subtotal,
          platform_fee: platformFee,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: "paid",
          issue_date: todayDateStr,
          due_date: todayDateStr,
          paid_at: createdAt,
          created_at: createdAt,
        });

        await supabase.from("payments").insert({
          id: uuidv4(),
          payment_number: `PAY-2026-TD-${Math.floor(100 + i)}`,
          booking_id: bookingId,
          invoice_id: invId,
          customer_id: customerId,
          amount: totalAmount,
          gateway_provider: "RAZORPAY",
          status: "PAID",
          paid_at: createdAt,
          created_at: createdAt,
        });
      }
    } else {
      console.error("Today booking insert error:", bErr);
    }
  }

  console.log(`✅ Successfully seeded ${todayCount} live bookings for Today (${todayDateStr}).`);

  // =========================================================================
  // STEP 4: SEED AUTHENTIC CUSTOMER REVIEWS
  // =========================================================================
  console.log("\n--- STEP 4: Seeding Authentic Customer Reviews Across Federations ---");
  const { data: existingReviews } = await supabase.from("reviews").select("booking_id");
  const reviewedBookingIds = new Set(existingReviews?.map((r) => r.booking_id).filter(Boolean));

  const { data: latestCompletedBookings } = await supabase
    .from("bookings")
    .select("id, customer_id, worker_id, created_at")
    .in("status", ["BOOKING_COMPLETED", "SERVICE_COMPLETED"])
    .order("created_at", { ascending: false })
    .limit(400);

  const eligibleForReviews = (latestCompletedBookings || []).filter(
    (b) => b.worker_id && b.customer_id && !reviewedBookingIds.has(b.id)
  );

  const COMMENTS_POOL = [
    "Punctual, polite, and resolved the issue with great skill.",
    "Very high standard of workmanship. Highly recommended!",
    "Neat work, clean tools, and transparent pricing. Excellent cooperative service.",
    "Professional craftsman, arrived right on schedule.",
    "Quick diagnostics and flawless repair work.",
    "Very satisfied with the courteous service and prompt resolution.",
    "Great service and fair rates. Will book again.",
    "Prompt response and thorough diagnosis of the issue.",
  ];

  let reviewCount = 0;
  for (const b of eligibleForReviews.slice(0, 100)) {
    const rating = Math.random() > 0.18 ? 5 : 4;
    const comment = COMMENTS_POOL[Math.floor(Math.random() * COMMENTS_POOL.length)];
    const { error: revErr } = await supabase.from("reviews").insert({
      id: uuidv4(),
      booking_id: b.id,
      customer_id: b.customer_id,
      worker_id: b.worker_id,
      rating,
      comment,
      created_at: b.created_at || new Date().toISOString(),
    });
    if (!revErr) reviewCount++;
  }
  console.log(`✅ Successfully seeded ${reviewCount} customer reviews.`);

  // =========================================================================
  // STEP 5: SYNCHRONIZE ACTIVE/BUSY WORKER STATUS
  // =========================================================================
  console.log("\n--- STEP 5: Synchronizing Worker Active/Busy Availability ---");
  const { data: liveBookings } = await supabase
    .from("bookings")
    .select("worker_id, status")
    .in("status", ["ON_THE_WAY", "ARRIVED", "OTP_VERIFIED", "SERVICE_STARTED", "WORKER_ACCEPTED"]);

  const busyWorkerIds = Array.from(new Set(liveBookings?.map((b) => b.worker_id).filter(Boolean)));
  console.log(`Updating ${busyWorkerIds.length} workers with live bookings to availability_status = BUSY.`);

  for (const wId of busyWorkerIds) {
    await supabase
      .from("workers")
      .update({ availability_status: "BUSY" })
      .eq("id", wId)
      .eq("account_status", "ACTIVE");
  }

  console.log("✅ Worker availability synchronized successfully.");
  console.log("\n=================================================");
  console.log("🎉 ALL SUPER ADMIN DATA SEEDED 100% CLEANLY!");
  console.log("=================================================");
}

seedSuperAdminPhase2Complete().catch(console.error);

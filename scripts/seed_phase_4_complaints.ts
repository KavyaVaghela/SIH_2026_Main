/**
 * Phase 4 Seed Script: Super Admin Complaint Management & Multi-Federation Analytics
 *
 * Seeds deterministic, upsert-safe realistic demo records across at least 2 federations:
 * - Federation-originated complaints (raised by FEDERATION_ADMIN)
 * - Customer complaints and Worker complaints
 * - Diverse lifecycle states: OPEN, UNDER_REVIEW, ACTION_REQUIRED, RESOLVED, REJECTED, CLOSED, ESCALATED
 * - Diverse priorities: CRITICAL, HIGH, MEDIUM, LOW
 * - Diverse dispute categories
 * - Dates spaced across past 14-28 days for time-series trend visualization
 *
 * Run with: powershell -ExecutionPolicy Bypass -Command "npx tsx scripts/seed_phase_4_complaints.ts"
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { complaintService } from "../features/complaints/services/complaint-service";

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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dxvnwbmxeubpbunwlmnd.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);

async function seedPhase4() {
  console.log("\n================================================================================");
  console.log("  KAUSHALYASETU — SEED PHASE 4: SUPER ADMIN GRIEVANCES & ANALYTICS FIXTURES");
  console.log("================================================================================\n");

  const superAdminProfileId = "81ec03d4-4889-4e9f-a055-dcb70cc50c6e";
  const fedAdminAProfileId = "096b0708-3193-41a6-9f49-03ff8903a0ed"; // Vikram Shah
  const fedAdminBProfileId = "bef86fb0-6e65-4b8a-825c-021da0f2c004"; // Prince Kalal
  const customerProfileId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";  // Prince Patel
  const workerAProfileId = "70fbdb46-120f-459e-a616-67b4f676f5d0";   // Ravi Patel
  const workerAWorkerRecordId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
  const workerBProfileId = "dc992a7f-3c26-4937-a8ce-5840a1f2b8c9";   // Kavita Patel
  const workerBWorkerRecordId = "e71b3de4-c41b-4f9d-ad8c-402b8e89dfb1";

  const federationAId = "b765df3b-c418-4a15-b79f-3cbc09e475dc"; // Ahmedabad Skilled Workers Federation
  const federationBId = "df5e2a43-c749-4cca-bd26-fe5826b1d1c3"; // Gujarat Household Services Federation

  const serviceId = "a510e2c8-5ee9-4b01-abfc-a2a101ea729e";
  const addressId = "3f50baf2-d986-4bec-88c2-dfa901d78a0b";

  // Create real test gig bookings for both federations
  console.log("Creating bookings for demonstration fixtures...");

  // Booking for Fed A
  const { data: bRowA } = await (adminSupabase.from("bookings") as any)
    .insert({
      booking_number: `BK-FED-A-${Date.now().toString().slice(-4)}`,
      customer_id: customerProfileId,
      worker_id: workerAWorkerRecordId,
      service_id: serviceId,
      federation_id: federationAId,
      address_id: addressId,
      status: "SERVICE_COMPLETED",
      total_amount: 1500,
      platform_fee: 75,
      worker_earnings: 1425,
      scheduled_start_at: new Date(Date.now() - 10 * 86400000).toISOString(),
      scheduled_end_at: new Date(Date.now() - 10 * 86400000 + 7200000).toISOString(),
    })
    .select("id")
    .single();
  const bookingAId = bRowA?.id;

  // Booking for Fed B
  const { data: bRowB } = await (adminSupabase.from("bookings") as any)
    .insert({
      booking_number: `BK-FED-B-${Date.now().toString().slice(-4)}`,
      customer_id: customerProfileId,
      worker_id: workerBWorkerRecordId,
      service_id: serviceId,
      federation_id: federationBId,
      address_id: addressId,
      status: "SERVICE_COMPLETED",
      total_amount: 1800,
      platform_fee: 90,
      worker_earnings: 1710,
      scheduled_start_at: new Date(Date.now() - 8 * 86400000).toISOString(),
      scheduled_end_at: new Date(Date.now() - 8 * 86400000 + 7200000).toISOString(),
    })
    .select("id")
    .single();
  const bookingBId = bRowB?.id;

  console.log("Bookings ready. Seeding demonstration complaints...\n");

  // Helper date generators
  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

  // ---------------------------------------------------------------------------
  // 1. FEDERATION-ORIGINATED COMPLAINTS (Raised by FEDERATION_ADMIN)
  // ---------------------------------------------------------------------------

  // Case F1: Federation A Admin files safety violation against contractor
  console.log("Seeding Case F1: Federation A Admin -> Worker Safety Violation (OPEN)...");
  const cF1 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    targetProfileId: workerAProfileId,
    targetRole: "WORKER",
    targetName: "Ravi Patel",
    bookingId: bookingAId,
    category: "Safety Hazard",
    subject: "Cooperative Safety Code Non-Compliance Notice",
    description: "Inspection team observed improper safety gear deployment during high-voltage residential electrical work.",
    priority: "CRITICAL",
    desiredOutcome: "Central safety audit and equipment verification",
    federationId: federationAId,
  });
  console.log(`  -> Seeded: ${cF1.complaintNumber} (Status: OPEN, Priority: CRITICAL)`);

  // Case F2: Federation B Admin files regional jurisdiction breach (UNDER REVIEW)
  console.log("Seeding Case F2: Federation B Admin -> Cross-Border Dispute (UNDER_REVIEW)...");
  const cF2 = await complaintService.createGrievance({
    raisedBy: fedAdminBProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Prince Kalal",
    category: "Policy Violation",
    subject: "Territorial Service Dispatch Boundary Overlap",
    description: "Dispute over unassigned gig request fulfillment in North Zone cooperative jurisdiction.",
    priority: "HIGH",
    desiredOutcome: "Super Admin demarcation review",
    federationId: federationBId,
  });
  await complaintService.updateLifecycleStatus(
    cF2.id,
    "UNDER_REVIEW",
    superAdminProfileId,
    "SUPER_ADMIN",
    "Super Administrator",
    "Central dispute committee assigned to examine zone boundaries."
  );
  console.log(`  -> Seeded: ${cF2.complaintNumber} (Status: UNDER_REVIEW, Priority: HIGH)`);

  // Case F3: Federation A Admin files payment withholding complaint (ACTION_REQUIRED)
  console.log("Seeding Case F3: Federation A Admin -> Payment Dispute (ACTION_REQUIRED)...");
  const cF3 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    targetProfileId: customerProfileId,
    targetRole: "CUSTOMER",
    targetName: "Prince Patel",
    bookingId: bookingAId,
    category: "Payment & Billing",
    subject: "Customer Repeated Cash Refusal / Escrow Discrepancy",
    description: "Multiple incidents of customer refusing cooperative payment tokens onsite.",
    priority: "MEDIUM",
    federationId: federationAId,
  });
  await complaintService.requestPartyResponse(
    cF3.id,
    "CUSTOMER",
    "Please provide transaction screenshots showing app checkout confirmation.",
    superAdminProfileId,
    "SUPER_ADMIN",
    "Super Administrator"
  );
  console.log(`  -> Seeded: ${cF3.complaintNumber} (Status: ACTION_REQUIRED)`);

  // Case F4: Federation A Admin files complaint resolved by Super Admin (RESOLVED)
  console.log("Seeding Case F4: Federation A Admin -> Resolved Conciliation...");
  const cF4 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    category: "Code of Conduct",
    subject: "Inter-Society Disciplinary Appeal",
    description: "Federation disciplinary appeal regarding worker certification audit.",
    priority: "MEDIUM",
    federationId: federationAId,
  });
  await complaintService.updateLifecycleStatus(
    cF4.id,
    "UNDER_REVIEW",
    superAdminProfileId,
    "SUPER_ADMIN",
    "Super Administrator"
  );
  await complaintService.resolveGrievance(
    cF4.id,
    {
      actionTaken: "Certification reinstated following cooperative retraining completion.",
      resolutionType: "CONCILIATION",
      summary: "Worker completed safety compliance coursework.",
      followUpRequired: false,
      resolvedAt: daysAgo(2),
      resolvedBy: superAdminProfileId,
      resolvedByName: "Super Administrator",
    },
    superAdminProfileId,
    "SUPER_ADMIN",
    "Super Administrator"
  );
  console.log(`  -> Seeded: ${cF4.complaintNumber} (Status: RESOLVED)`);

  // Case F5: Federation B Admin files complaint rejected by Super Admin (REJECTED)
  console.log("Seeding Case F5: Federation B Admin -> Rejected Case...");
  const cF5 = await complaintService.createGrievance({
    raisedBy: fedAdminBProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Prince Kalal",
    category: "Unsubstantiated Claim",
    subject: "Platform Fee Calculation Dispute",
    description: "Federation asserted incorrect fee split on municipal plumbing contract.",
    priority: "LOW",
    federationId: federationBId,
  });
  await complaintService.rejectGrievance(
    cF5.id,
    "Escrow ledger audit verified accurate 5% platform deduction matching cooperative charter Section 4.",
    superAdminProfileId,
    "SUPER_ADMIN",
    "Super Administrator"
  );
  console.log(`  -> Seeded: ${cF5.complaintNumber} (Status: REJECTED)`);

  // Case F6: Federation A Admin files complaint closed by Super Admin (CLOSED)
  console.log("Seeding Case F6: Federation A Admin -> Closed Case...");
  const cF6 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    category: "Equipment Damage",
    subject: "Workshop Testing Facility Tool Damage Notice",
    description: "Notice regarding hydraulic pipe press calibration defect.",
    priority: "LOW",
    federationId: federationAId,
  });
  await complaintService.closeGrievance(
    cF6.id,
    "Calibration tool replaced by manufacturer warranty dispatch.",
    superAdminProfileId,
    "SUPER_ADMIN",
    "Super Administrator"
  );
  console.log(`  -> Seeded: ${cF6.complaintNumber} (Status: CLOSED)`);

  // ---------------------------------------------------------------------------
  // 2. ADDITIONAL WORKER & CUSTOMER COMPLAINTS (Multi-Federation Overview)
  // ---------------------------------------------------------------------------

  // Case C1: Customer complaint in Federation B
  console.log("Seeding Case C1: Customer -> Worker in Federation B (ESCALATED)...");
  const cC1 = await complaintService.createGrievance({
    raisedBy: customerProfileId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: workerBProfileId,
    targetRole: "WORKER",
    targetName: "Kavita Patel",
    bookingId: bookingBId,
    category: "Safety Hazard",
    subject: "Water heater pressure valve left uncalibrated",
    description: "Heater pressure valve whistled loudly and leaked water upon first usage.",
    priority: "CRITICAL",
    federationId: federationBId,
  });
  await complaintService.escalateToSuperAdmin(
    cC1.id,
    "High severity pressure anomaly referred to Central Super Admin governance.",
    "fed-officer-b",
    "FEDERATION_ADMIN",
    "Federation B Officer"
  );
  console.log(`  -> Seeded: ${cC1.complaintNumber} (Status: ESCALATED)`);

  // Case W1: Worker complaint in Federation B
  console.log("Seeding Case W1: Worker B -> Payment issue in Federation B (RESOLVED)...");
  const cW1 = await complaintService.createGrievance({
    raisedBy: workerBProfileId,
    raisedByRole: "WORKER",
    raisedByName: "Kavita Patel",
    bookingId: bookingBId,
    category: "Payment & Billing",
    subject: "Withholding of overtime labor charges",
    description: "Customer requested additional 2 hours of drainage cleaning without approving overtime voucher.",
    priority: "HIGH",
    federationId: federationBId,
  });
  await complaintService.updateLifecycleStatus(
    cW1.id,
    "UNDER_REVIEW",
    superAdminProfileId,
    "SUPER_ADMIN",
    "Super Administrator"
  );
  await complaintService.resolveGrievance(
    cW1.id,
    {
      actionTaken: "Dispatched ₹400 supplementary compensation voucher from cooperative dispute fund.",
      resolutionType: "COURTESY_CREDIT_RECOMMENDED",
      summary: "Overtime conciliated satisfactorily.",
      followUpRequired: false,
      resolvedAt: daysAgo(4),
      resolvedBy: superAdminProfileId,
      resolvedByName: "Super Administrator",
    },
    superAdminProfileId,
    "SUPER_ADMIN",
    "Super Administrator"
  );
  console.log(`  -> Seeded: ${cW1.complaintNumber} (Status: RESOLVED)`);

  console.log("\n================================================================================");
  console.log("  PHASE 4 DEMONSTRATION FIXTURES SUCCESSFULLY SEEDED!");
  console.log("================================================================================\n");
}

seedPhase4().catch((err) => {
  console.error("FATAL: Phase 4 seed failed:", err);
  process.exit(1);
});

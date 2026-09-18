/**
 * Phase 4A Seed Script: Federation-Raised Complaints to Super Admin + Escalated Grievances
 *
 * Seeds deterministic, upsert-safe realistic records:
 * 1. Federation-originated OPEN complaint (Fed A -> Super Admin)
 * 2. Federation-originated UNDER_REVIEW complaint (Fed A -> Super Admin)
 * 3. Federation-originated ACTION_REQUIRED complaint (Fed A -> Super Admin)
 * 4. Federation-originated RESOLVED complaint (Fed A -> Super Admin)
 * 5. Federation-originated REJECTED complaint (Fed A -> Super Admin)
 * 6. Federation-originated CLOSED complaint (Fed A -> Super Admin)
 * 7. Booking-linked Customer complaint with ESCALATED status (Fed A)
 * 8. Cross-federation complaint (Fed B -> Super Admin) for tenant isolation verification
 *
 * Run with: powershell -ExecutionPolicy Bypass -Command "npx tsx scripts/seed_phase_4a_complaints.ts"
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

export async function seedPhase4A() {
  console.log("\n================================================================================");
  console.log("  KAUSHALYASETU — SEED PHASE 4A: FEDERATION COMPLAINTS & ESCALATIONS");
  console.log("================================================================================\n");

  const superAdminProfileId = "81ec03d4-4889-4e9f-a055-dcb70cc50c6e"; // System Administrator
  const fedAdminAProfileId = "096b0708-3193-41a6-9f49-03ff8903a0ed"; // Vikram Shah (Ahmedabad)
  const fedAdminBProfileId = "bef86fb0-6e65-4b8a-825c-021da0f2c004"; // Prince Kalal (Household)
  const customerProfileId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";  // Prince Patel
  const workerAProfileId = "70fbdb46-120f-459e-a616-67b4f676f5d0";   // Ravi Patel
  const workerAWorkerRecordId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

  const federationAId = "b765df3b-c418-4a15-b79f-3cbc09e475dc"; // Ahmedabad Skilled Workers Federation
  const federationBId = "df5e2a43-c749-4cca-bd26-fe5826b1d1c3"; // Gujarat Household Services Federation

  const serviceId = "a510e2c8-5ee9-4b01-abfc-a2a101ea729e";
  const addressId = "3f50baf2-d986-4bec-88c2-dfa901d78a0b";

  // Create booking for escalated customer complaint
  console.log("Creating/checking booking for escalated customer complaint...");
  const { data: bRow } = await (adminSupabase.from("bookings") as any)
    .insert({
      booking_number: `BK-ESC-${Date.now().toString().slice(-4)}`,
      customer_id: customerProfileId,
      worker_id: workerAWorkerRecordId,
      service_id: serviceId,
      federation_id: federationAId,
      address_id: addressId,
      status: "SERVICE_COMPLETED",
      total_amount: 2200,
      platform_fee: 110,
      worker_earnings: 2090,
      scheduled_start_at: new Date(Date.now() - 5 * 86400000).toISOString(),
      scheduled_end_at: new Date(Date.now() - 5 * 86400000 + 7200000).toISOString(),
    })
    .select("id")
    .single();

  const bookingEscId = bRow?.id;
  console.log(`Booking ready: ${bookingEscId}\n`);

  const results: Record<string, string> = {};

  // 1. Federation-originated OPEN complaint (Fed A -> Super Admin)
  console.log("1. Seeding Federation-originated OPEN complaint (Fed A -> Super Admin)...");
  const c1 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    category: "Platform issue",
    subject: "Cooperative Payment Settlement Delay on Payout Gateway",
    description: "Weekly automated escrow payout for 28 skilled electricians has been delayed past the standard settlement window. Central banking API response code 504.",
    priority: "HIGH",
    additionalInfo: "Settlement batch reference #SE-2026-0918-A. Urgent contractor inquiries pending.",
    federationId: federationAId,
  });
  results.open = c1.id;
  console.log(`   -> Created ${c1.complaintNumber} (${c1.status})\n`);

  // 2. Federation-originated UNDER_REVIEW complaint
  console.log("2. Seeding Federation-originated UNDER_REVIEW complaint (Fed A -> Super Admin)...");
  const c2 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    category: "Federation administration issue",
    subject: "Territorial Dispatch Boundary Conflict in North District",
    description: "Overlapping dispatch boundary detected between Ahmedabad North and Gandhinagar South cooperative zones. Requesting demarcation review.",
    priority: "MEDIUM",
    federationId: federationAId,
  });
  await complaintService.updateLifecycleStatus(
    c2.id,
    "UNDER_REVIEW",
    superAdminProfileId,
    "SUPER_ADMIN",
    "System Administrator",
    "Super Admin assigned central boundary officer to evaluate GPS polygon borders."
  );
  results.underReview = c2.id;
  console.log(`   -> Created ${c2.complaintNumber} (Transitioned to UNDER_REVIEW)\n`);

  // 3. Federation-originated ACTION_REQUIRED complaint
  console.log("3. Seeding Federation-originated ACTION_REQUIRED complaint (Fed A -> Super Admin)...");
  const c3 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    category: "Workforce/platform issue",
    subject: "Bulk Worker Accreditation Verification Blocked",
    description: "14 newly certified HVAC technicians are unable to receive verified badges on the KaushalyaSetu mobile application.",
    priority: "HIGH",
    federationId: federationAId,
  });
  await complaintService.updateLifecycleStatus(
    c3.id,
    "UNDER_REVIEW",
    superAdminProfileId,
    "SUPER_ADMIN",
    "System Administrator",
    "Super Admin began initial investigation."
  );
  await complaintService.updateLifecycleStatus(
    c3.id,
    "ACTION_REQUIRED",
    superAdminProfileId,
    "SUPER_ADMIN",
    "System Administrator",
    "Super Admin requested certified certificate serial numbers from Federation Admin."
  );
  results.actionRequired = c3.id;
  console.log(`   -> Created ${c3.complaintNumber} (Transitioned to ACTION_REQUIRED)\n`);

  // 4. Federation-originated RESOLVED complaint
  console.log("4. Seeding Federation-originated RESOLVED complaint (Fed A -> Super Admin)...");
  const c4 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    category: "Technical issue",
    subject: "Federation Admin Portal Metric Sync Discrepancy",
    description: "Realtime aggregate active workforce counter was undercounting verified on-duty specialists.",
    priority: "LOW",
    federationId: federationAId,
  });
  await complaintService.updateLifecycleStatus(
    c4.id,
    "UNDER_REVIEW",
    superAdminProfileId,
    "SUPER_ADMIN",
    "System Administrator",
    "Super Admin began evaluating workforce counter aggregation."
  );
  await complaintService.resolveGrievance(
    c4.id,
    {
      resolutionType: "POLICY_CLARIFIED",
      summary: "Workforce aggregation cache invalidated and background refresh cron adjusted.",
      actionTaken: "Deployed fix to aggregate worker counter view; counters reconciled.",
      followUpRequired: false,
      resolvedBy: superAdminProfileId,
      resolvedByName: "System Administrator",
      resolvedAt: new Date().toISOString(),
    },
    superAdminProfileId,
    "SUPER_ADMIN",
    "System Administrator"
  );
  results.resolved = c4.id;
  console.log(`   -> Created ${c4.complaintNumber} (Resolved by Super Admin)\n`);

  // 5. Federation-originated REJECTED complaint
  console.log("5. Seeding Federation-originated REJECTED complaint (Fed A -> Super Admin)...");
  const c5 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    category: "Policy/operational issue",
    subject: "Exemption Request for Late Night Emergency Tariff Surcharge",
    description: "Requesting blanket exemption from state statutory tariff caps for after-hours emergency plumbing calls.",
    priority: "LOW",
    federationId: federationAId,
  });
  await complaintService.rejectGrievance(
    c5.id,
    "Statutory state tariff caps are mandated by state labor law regulations and cannot be exempted via administrative discretion.",
    superAdminProfileId,
    "SUPER_ADMIN",
    "System Administrator"
  );
  results.rejected = c5.id;
  console.log(`   -> Created ${c5.complaintNumber} (Rejected by Super Admin)\n`);

  // 6. Federation-originated CLOSED complaint
  console.log("6. Seeding Federation-originated CLOSED complaint (Fed A -> Super Admin)...");
  const c6 = await complaintService.createGrievance({
    raisedBy: fedAdminAProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Vikram Shah",
    category: "Other",
    subject: "Annual Federation Portal Audit Inquiry",
    description: "Routine inquiry on annual compliance audit data exports.",
    priority: "LOW",
    federationId: federationAId,
  });
  await complaintService.closeGrievance(
    c6.id,
    "Compliance data archive link transmitted to federation secretarial office. Inquiry concluded.",
    superAdminProfileId,
    "SUPER_ADMIN",
    "System Administrator"
  );
  results.closed = c6.id;
  console.log(`   -> Created ${c6.complaintNumber} (Closed by Super Admin)\n`);

  // 7. Booking-linked Customer complaint with ESCALATED status belonging to Federation A
  console.log("7. Seeding booking-linked complaint with ESCALATED status (Fed A)...");
  const c7 = await complaintService.createGrievance({
    raisedBy: customerProfileId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: workerAProfileId,
    targetRole: "WORKER",
    targetName: "Ravi Patel",
    bookingId: bookingEscId,
    category: "Property Damage",
    subject: "Major Water Pipe Fracture During Valve Replacement",
    description: "Main kitchen line burst during repair causing water damage to subfloor. Worker responded with dispute of pre-existing pipe corrosion.",
    priority: "CRITICAL",
    desiredOutcome: "Compensation conciliation",
    federationId: federationAId,
  });

  // Record worker statement
  await complaintService.requestPartyResponse(
    c7.id,
    "WORKER",
    "Please provide statement regarding water pipe damage.",
    fedAdminAProfileId,
    "FEDERATION_ADMIN",
    "Vikram Shah"
  );
  await complaintService.submitPartyResponse(
    c7.id,
    "Pre-existing copper line had extensive galvanic corrosion prior to repair work.",
    [],
    workerAProfileId,
    "WORKER",
    "Ravi Patel"
  );

  // Escalate to Super Admin
  await complaintService.escalateToSuperAdmin(
    c7.id,
    "Severe property damage compensation claim exceeding federation local conciliation ceiling (₹25,000 threshold). Escalated to Central Oversight.",
    fedAdminAProfileId,
    "FEDERATION_ADMIN",
    "Vikram Shah"
  );
  results.escalated = c7.id;
  console.log(`   -> Created ${c7.complaintNumber} (Status: ESCALATED, Booking: ${bookingEscId})\n`);

  // 8. Cross-federation case for Federation B (Fed B -> Super Admin)
  console.log("8. Seeding Cross-Federation complaint (Fed B -> Super Admin)...");
  const c8 = await complaintService.createGrievance({
    raisedBy: fedAdminBProfileId,
    raisedByRole: "FEDERATION_ADMIN",
    raisedByName: "Prince Kalal",
    category: "Platform issue",
    subject: "Household Cleaning Material Supply Chain Delay",
    description: "Federation B bulk detergent distribution delayed from central procurement warehouse.",
    priority: "MEDIUM",
    federationId: federationBId,
  });
  results.crossFed = c8.id;
  console.log(`   -> Created ${c8.complaintNumber} (Belongs to Fed B: ${federationBId})\n`);

  console.log("================================================================================");
  console.log("  SEED PHASE 4A COMPLETED SUCCESSFULLY!");
  console.log("================================================================================\n");

  return results;
}

// Execute if run directly
if (require.main === module || process.argv[1]?.includes("seed_phase_4a_complaints")) {
  seedPhase4A()
    .then((res) => {
      console.log("Seeded Record IDs:", JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seed Phase 4A Failed:", err);
      process.exit(1);
    });
}

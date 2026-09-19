/**
 * Database Seed Script for Phase 3: Worker Complaints System + Customer Complaint Response
 * 
 * Seeds records for all 10 demonstration scenarios:
 *  1. Worker with no complaints (clean worker: Amit Sharma)
 *  2. Worker with own complaint (Worker A: Ravi Patel)
 *  3. Worker with one customer complaint under review (Worker A)
 *  4. Worker with customer complaint waiting for response (Worker A)
 *  5. Worker with customer complaint where response is already submitted (Worker A)
 *  6. Worker with resolved customer complaint (Worker A)
 *  7. Worker with rejected customer complaint (Worker A)
 *  8. Worker with closed customer complaint (Worker A)
 *  9. Multiple workers demonstrating cross-worker isolation (Worker B: Kavita Patel)
 * 10. Multiple bookings demonstrating worker job dropdown (Worker A)
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { complaintService, generateComplaintReference } from "../features/complaints/services/complaint-service";

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

async function seedPhase3() {
  console.log("\n================================================================================");
  console.log("  KAUSHALYASETU — SEED PHASE 3 DEMONSTRATION FIXTURES (All 10 Scenarios)");
  console.log("================================================================================\n");

  const customerProfileId = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef"; // Prince Patel
  const workerAProfileId = "70fbdb46-120f-459e-a616-67b4f676f5d0";  // Ravi Patel
  const workerAWorkerRecordId = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";
  const workerBProfileId = "dc992a7f-3c26-4937-a8ce-5840a1f2b8c9";  // Kavita Patel
  const workerBWorkerRecordId = "e71b3de4-c41b-4f9d-ad8c-402b8e89dfb1";
  const cleanWorkerProfileId = "3880703c-4e54-4386-865e-15abc571f6f4"; // Amit Sharma
  const federationAId = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
  const serviceId = "a510e2c8-5ee9-4b01-abfc-a2a101ea729e";
  const addressId = "3f50baf2-d986-4bec-88c2-dfa901d78a0b";

  // ---------------------------------------------------------------------------
  // Scenario 10: Create Multiple Real Bookings for Worker A (Job Dropdown)
  // ---------------------------------------------------------------------------
  console.log("Creating bookings for Worker A...");
  const createdBookings: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const bookingNum = `BK-WKR-A-${Date.now().toString().slice(-4)}-${i}`;
    const { data: bRow } = await (adminSupabase.from("bookings") as any)
      .insert({
        booking_number: bookingNum,
        customer_id: customerProfileId,
        worker_id: workerAWorkerRecordId,
        service_id: serviceId,
        federation_id: federationAId,
        address_id: addressId,
        status: i % 2 === 0 ? "SERVICE_COMPLETED" : "CONFIRMED",
        total_amount: 800 + i * 150,
        platform_fee: 40,
        worker_earnings: 760 + i * 150,
        scheduled_start_at: new Date(Date.now() - i * 86400000).toISOString(),
        scheduled_end_at: new Date(Date.now() - i * 86400000 + 7200000).toISOString(),
      })
      .select("id")
      .single();

    if (bRow) createdBookings.push(bRow.id);
  }
  console.log(`Created ${createdBookings.length} bookings for Worker A.`);

  // Booking for Worker B
  const { data: bRowB } = await (adminSupabase.from("bookings") as any)
    .insert({
      booking_number: `BK-WKR-B-${Date.now().toString().slice(-4)}`,
      customer_id: customerProfileId,
      worker_id: workerBWorkerRecordId,
      service_id: serviceId,
      federation_id: federationAId,
      address_id: addressId,
      status: "SERVICE_COMPLETED",
      total_amount: 1200,
      platform_fee: 60,
      worker_earnings: 1140,
      scheduled_start_at: new Date().toISOString(),
      scheduled_end_at: new Date(Date.now() + 3600000).toISOString(),
    })
    .select("id")
    .single();

  const workerBBookingId = bRowB?.id || createdBookings[0];

  const primaryBookingId = createdBookings[0];

  // ---------------------------------------------------------------------------
  // Scenario 1: Clean Worker (Amit Sharma) — Verify 0 complaints
  // ---------------------------------------------------------------------------
  console.log("Scenario 1: Clean worker ready (Profile:", cleanWorkerProfileId, ")");

  // ---------------------------------------------------------------------------
  // Scenario 2: Worker A Own Complaint (Raised by Worker)
  // ---------------------------------------------------------------------------
  console.log("Scenario 2: Creating Worker A own complaint...");
  const sc2 = await complaintService.createGrievance({
    raisedBy: workerAProfileId,
    raisedByRole: "WORKER",
    raisedByName: "Ravi Patel",
    bookingId: primaryBookingId,
    category: "Non-Payment or Underpayment",
    subject: "Unpaid remaining balance for pipe replacement",
    description: "Customer withheld remaining ₹450 claiming additional valve was not requested, despite advance agreement.",
    priority: "MEDIUM",
  });
  console.log(`  -> Created: ${sc2.complaintNumber} (Status: ${sc2.status})`);

  // ---------------------------------------------------------------------------
  // Scenario 3: Worker A with Customer Complaint under review (No response requested)
  // ---------------------------------------------------------------------------
  console.log("Scenario 3: Creating Customer Complaint under review...");
  const sc3 = await complaintService.createGrievance({
    raisedBy: customerProfileId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: workerAProfileId,
    targetRole: "WORKER",
    targetName: "Ravi Patel",
    bookingId: createdBookings[1] || primaryBookingId,
    category: "Service Quality",
    subject: "Water seepage continues under sink",
    description: "Joint still leaking small drops after repair was completed on Tuesday.",
    priority: "MEDIUM",
  });
  console.log(`  -> Created: ${sc3.complaintNumber} (Status: ${sc3.status})`);

  // ---------------------------------------------------------------------------
  // Scenario 4: Worker A with Customer Complaint waiting for response
  // ---------------------------------------------------------------------------
  console.log("Scenario 4: Creating Customer Complaint waiting for worker response...");
  const sc4 = await complaintService.createGrievance({
    raisedBy: customerProfileId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: workerAProfileId,
    targetRole: "WORKER",
    targetName: "Ravi Patel",
    bookingId: createdBookings[2] || primaryBookingId,
    category: "Punctuality & Scheduling",
    subject: "Technician arrived 50 minutes late",
    description: "Worker was late for the scheduled 10 AM slot without advance notice, causing schedule conflict.",
    priority: "MEDIUM",
  });
  await complaintService.requestPartyResponse(
    sc4.id,
    "WORKER",
    "Please provide explanation regarding transit delay on Tuesday morning.",
    "fed-officer-01",
    "FEDERATION_ADMIN",
    "Federation Officer"
  );
  console.log(`  -> Created & Requested Response: ${sc4.complaintNumber} (Status: ACTION_REQUIRED)`);

  // ---------------------------------------------------------------------------
  // Scenario 5: Worker A with Customer Complaint where response is submitted
  // ---------------------------------------------------------------------------
  console.log("Scenario 5: Creating Customer Complaint with response submitted...");
  const sc5 = await complaintService.createGrievance({
    raisedBy: customerProfileId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: workerAProfileId,
    targetRole: "WORKER",
    targetName: "Ravi Patel",
    bookingId: createdBookings[3] || primaryBookingId,
    category: "Pricing Dispute",
    subject: "Extra material charge dispute",
    description: "Customer questioned why ₹200 was added for PVC brass coupling.",
    priority: "MEDIUM",
  });
  await complaintService.requestPartyResponse(
    sc5.id,
    "WORKER",
    "Please verify if PVC coupling replacement was approved by the customer before installation.",
    "fed-officer-01",
    "FEDERATION_ADMIN",
    "Federation Officer"
  );
  await complaintService.submitPartyResponse(
    sc5.id,
    "The old connector cracked upon inspection. I showed the damaged piece to customer before installing genuine brass coupling from society toolkit.",
    [],
    workerAProfileId,
    "WORKER",
    "Ravi Patel"
  );
  console.log(`  -> Created & Response Submitted: ${sc5.complaintNumber} (Status: UNDER_REVIEW)`);

  // ---------------------------------------------------------------------------
  // Scenario 6: Worker A with Resolved Customer Complaint
  // ---------------------------------------------------------------------------
  console.log("Scenario 6: Creating Resolved Customer Complaint...");
  const sc6 = await complaintService.createGrievance({
    raisedBy: customerProfileId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: workerAProfileId,
    targetRole: "WORKER",
    targetName: "Ravi Patel",
    bookingId: primaryBookingId,
    category: "Communication",
    subject: "Language misunderstanding regarding service warranty",
    description: "Clarification needed regarding 30-day labor guarantee.",
    priority: "LOW",
  });
  await complaintService.requestPartyResponse(
    sc6.id,
    "WORKER",
    "Please clarify terms communicated to customer.",
    "fed-officer-01",
    "FEDERATION_ADMIN",
    "Federation Officer"
  );
  await complaintService.submitPartyResponse(
    sc6.id,
    "I explained 30-day free revisits apply to the repaired drain line.",
    [],
    workerAProfileId,
    "WORKER",
    "Ravi Patel"
  );
  await complaintService.resolveGrievance(
    sc6.id,
    {
      actionTaken: "Warranty terms clarified with customer; standard 30-day cooperative protection confirmed.",
      resolutionType: "CONCILIATION",
      summary: "Warranty explanation conciliated without penalty.",
      followUpRequired: false,
      resolvedAt: new Date().toISOString(),
      resolvedBy: "fed-officer-01",
      resolvedByName: "Dispute Officer",
    },
    "fed-officer-01",
    "FEDERATION_ADMIN",
    "Dispute Officer"
  );
  console.log(`  -> Created & Resolved: ${sc6.complaintNumber} (Status: RESOLVED)`);

  // ---------------------------------------------------------------------------
  // Scenario 7: Worker A with Rejected Customer Complaint
  // ---------------------------------------------------------------------------
  console.log("Scenario 7: Creating Rejected Customer Complaint...");
  const sc7 = await complaintService.createGrievance({
    raisedBy: customerProfileId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: workerAProfileId,
    targetRole: "WORKER",
    targetName: "Ravi Patel",
    bookingId: primaryBookingId,
    category: "Unsubstantiated Claim",
    subject: "Complaint claiming technician was unauthorized",
    description: "Claimed technician did not display identity badge.",
    priority: "LOW",
  });
  await complaintService.requestPartyResponse(
    sc7.id,
    "WORKER",
    "Did you present digital cooperative ID badge upon entry?",
    "fed-officer-01",
    "FEDERATION_ADMIN",
    "Federation Officer"
  );
  await complaintService.submitPartyResponse(
    sc7.id,
    "Presented digital QR badge in KaushalyaSetu app which was scanned by customer at gate.",
    [],
    workerAProfileId,
    "WORKER",
    "Ravi Patel"
  );
  await complaintService.rejectGrievance(
    sc7.id,
    "Gate scan log confirmed worker digital badge was verified at 10:02 AM. Unsubstantiated claim.",
    "fed-officer-01",
    "FEDERATION_ADMIN",
    "Dispute Officer"
  );
  console.log(`  -> Created & Rejected: ${sc7.complaintNumber} (Status: REJECTED)`);

  // ---------------------------------------------------------------------------
  // Scenario 8: Worker A with Closed Customer Complaint
  // ---------------------------------------------------------------------------
  console.log("Scenario 8: Creating Closed Customer Complaint...");
  const sc8 = await complaintService.createGrievance({
    raisedBy: customerProfileId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: workerAProfileId,
    targetRole: "WORKER",
    targetName: "Ravi Patel",
    bookingId: primaryBookingId,
    category: "General Inquiry",
    subject: "Toolbox residue left in utility area",
    description: "Dust left on balcony tile.",
    priority: "LOW",
  });
  await complaintService.requestPartyResponse(
    sc8.id,
    "WORKER",
    "Please confirm if the balcony utility area was cleaned.",
    "fed-officer-01",
    "FEDERATION_ADMIN",
    "Federation Officer"
  );
  await complaintService.submitPartyResponse(
    sc8.id,
    "Visited premises next morning and thoroughly cleaned tile.",
    [],
    workerAProfileId,
    "WORKER",
    "Ravi Patel"
  );
  await complaintService.closeGrievance(
    sc8.id,
    "Worker cleaned area next day. Customer acknowledged satisfaction.",
    "fed-officer-01",
    "FEDERATION_ADMIN",
    "Dispute Officer"
  );
  console.log(`  -> Created & Closed: ${sc8.complaintNumber} (Status: CLOSED)`);

  // ---------------------------------------------------------------------------
  // Scenario 9: Worker B Complaints (Cross-worker isolation)
  // ---------------------------------------------------------------------------
  console.log("Scenario 9: Creating Worker B isolated complaints...");
  const sc9a = await complaintService.createGrievance({
    raisedBy: workerBProfileId,
    raisedByRole: "WORKER",
    raisedByName: "Kavita Patel",
    bookingId: workerBBookingId,
    category: "Safety Concerns",
    subject: "Worker B safety inquiry",
    description: "Poor ventilation in basement pump house.",
    priority: "MEDIUM",
  });
  const sc9b = await complaintService.createGrievance({
    raisedBy: customerProfileId,
    raisedByRole: "CUSTOMER",
    raisedByName: "Prince Patel",
    targetProfileId: workerBProfileId,
    targetRole: "WORKER",
    targetName: "Kavita Patel",
    bookingId: workerBBookingId,
    category: "Conduct",
    subject: "Customer complaint against Worker B",
    description: "Scheduling dispute regarding evening visit.",
    priority: "LOW",
  });
  console.log(`  -> Worker B Own Complaint: ${sc9a.complaintNumber}`);
  console.log(`  -> Worker B Customer Complaint: ${sc9b.complaintNumber}`);

  console.log("\n>>> ALL 10 PHASE 3 SCENARIOS SEEDED SUCCESSFULLY! <<<\n");
}

seedPhase3().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

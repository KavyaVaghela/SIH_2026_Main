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
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or secret key in .env.local");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Protected Test Accounts
const PRINCE_CUSTOMER_PROFILE_ID = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
const RAVI_WORKER_PROFILE_ID = "70fbdb46-120f-459e-a616-67b4f676f5d0";
const RAVI_WORKER_ID = "59eca4ff-a589-4363-ad76-24a4ff5b6e2e";

// Federations
const FED_AHMEDABAD = "b765df3b-c418-4a15-b79f-3cbc09e475dc";
const FED_SURAT = "3adedc5e-bfa1-4eca-b78c-e43ba957fe21";
const FED_VADODARA = "42ae3cf4-507f-41af-a419-ceee67482ebf";
const FED_GANDHINAGAR = "df5e2a43-c749-4cca-bd26-fe5826b1d1c3";
const FED_RAJKOT = "c160832d-8d70-4fb1-afac-2bf253424d52";

function getIsoDate(daysAgo: number, hour = 11, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

async function main() {
  console.log("================================================================================");
  console.log("PHASE 5: CONTROLLED DATA ENRICHMENT FOR REALISTIC CROSS-ROLE INTELLIGENCE");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // STAGE 0: VERIFY PROTECTED ACCOUNTS
  // ---------------------------------------------------------------------------
  console.log("--> Stage 0: Verifying protected test accounts...");
  const { data: prince } = await (adminClient.from("profiles") as any)
    .select("id, full_name, email, role")
    .eq("id", PRINCE_CUSTOMER_PROFILE_ID)
    .maybeSingle();

  const { data: ravi } = await (adminClient.from("profiles") as any)
    .select("id, full_name, email, role")
    .eq("id", RAVI_WORKER_PROFILE_ID)
    .maybeSingle();

  if (!prince || !ravi) {
    throw new Error("Protected accounts missing! Aborting to prevent inconsistent state.");
  }
  console.log(`    Protected Customer: ${prince.full_name} (${prince.id}) - Preserved`);
  console.log(`    Protected Worker: ${ravi.full_name} (${ravi.id}) - Preserved\n`);

  // ---------------------------------------------------------------------------
  // STAGE 1: NATURAL UNDER-UTILIZED WORKER CALIBRATION (AHMEDABAD)
  // ---------------------------------------------------------------------------
  console.log("--> Stage 1: Calibrating natural under-utilized workers in Ahmedabad...");
  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

  // Selected 7 active, verified Ahmedabad workers to naturally place below 40% threshold:
  // Kiran Patel (Painter), Dhruv Moradiya (Cleaner) -> 1 booking in 14d (~10% utilization)
  // Krish Kalal (Mason), Sanjay Parmar (Gardener), Peter Parker (Electrician) -> 2 bookings in 14d (~20% utilization)
  // Sunita Sharma (Painter), Bhavin Mistri (Appliance Tech) -> 2 bookings in 14d (~20% utilization)
  const targetWorkerNames = [
    { name: "Kiran Patel", targetBookingsIn14d: 1 },
    { name: "Dhruv Moradiya", targetBookingsIn14d: 1 },
    { name: "Krish Kalal", targetBookingsIn14d: 2 },
    { name: "Sanjay Parmar", targetBookingsIn14d: 2 },
    { name: "Peter Parker", targetBookingsIn14d: 2 },
    { name: "Sunita Sharma", targetBookingsIn14d: 2 },
    { name: "Bhavin Mistri", targetBookingsIn14d: 2 },
  ];

  let totalShifted = 0;
  for (const item of targetWorkerNames) {
    // Find worker ID
    const { data: profs } = await (adminClient.from("profiles") as any)
      .select("id, full_name")
      .ilike("full_name", `%${item.name}%`);

    if (!profs || profs.length === 0) continue;
    const profId = profs[0].id;

    const { data: wRec } = await (adminClient.from("workers") as any)
      .select("id, profession, federation_id")
      .eq("profile_id", profId)
      .eq("federation_id", FED_AHMEDABAD)
      .maybeSingle();

    if (!wRec) continue;

    // Fetch this worker's bookings in the 14-day window
    const { data: wBookings } = await (adminClient.from("bookings") as any)
      .select("id, created_at, scheduled_start_at, scheduled_end_at, actual_start_at, actual_end_at")
      .eq("worker_id", wRec.id)
      .gte("created_at", fourteenDaysAgo)
      .order("created_at", { ascending: true });

    if (wBookings && wBookings.length > item.targetBookingsIn14d) {
      const shiftCount = wBookings.length - item.targetBookingsIn14d;
      const toShift = wBookings.slice(0, shiftCount);

      for (let i = 0; i < toShift.length; i++) {
        const b = toShift[i];
        const daysAgo = 18 + (i * 3); // 18 to 27 days ago (outside 14d, within 30d)
        const shiftedCreatedAt = getIsoDate(daysAgo, 9, 0);
        const shiftedStartAt = getIsoDate(daysAgo, 10, 0);
        const shiftedEndAt = getIsoDate(daysAgo, 12, 0); // 2 hours duration

        await (adminClient.from("bookings") as any)
          .update({
            created_at: shiftedCreatedAt,
            scheduled_start_at: shiftedStartAt,
            scheduled_end_at: shiftedEndAt,
            actual_start_at: shiftedStartAt,
            actual_end_at: shiftedEndAt,
          })
          .eq("id", b.id);
        totalShifted++;
      }
      console.log(`    Shifted ${shiftCount} bookings for ${item.name} (${wRec.profession}) to historical window`);
    }
  }
  console.log(`    Total historical bookings recalibrated: ${totalShifted}\n`);

  // ---------------------------------------------------------------------------
  // STAGE 2: ENSURE CROSS-FEDERATION QUALIFIED CANDIDATES
  // ---------------------------------------------------------------------------
  console.log("--> Stage 2: Ensuring cross-federation qualified candidates (Plumbing & Electrical)...");

  // 1. Ensure Pramod Joshi (Surat Plumber, 8a603a45-04fe-4e09-8b33-058cff4acb40) has plumbing skill
  const SURAT_PLUMBER_WORKER_ID = "8a603a45-04fe-4e09-8b33-058cff4acb40";
  const { data: plumbingSkill } = await (adminClient.from("skills") as any)
    .select("id")
    .ilike("name", "Plumbing")
    .maybeSingle();

  if (plumbingSkill) {
    const { data: existingSkill } = await (adminClient.from("worker_skills") as any)
      .select("id")
      .eq("worker_id", SURAT_PLUMBER_WORKER_ID)
      .eq("skill_id", plumbingSkill.id)
      .maybeSingle();

    if (!existingSkill) {
      await (adminClient.from("worker_skills") as any).insert({
        worker_id: SURAT_PLUMBER_WORKER_ID,
        skill_id: plumbingSkill.id,
        proficiency_level: "EXPERT",
      });
      console.log("    Added verified Plumbing skill to Surat craftsman Pramod Joshi");
    }
  }

  // 2. Ensure level-4 plumbing certification
  const { data: plumbCert } = await (adminClient.from("certifications") as any)
    .select("id")
    .ilike("title", "%Plumbing%")
    .maybeSingle();

  if (plumbCert) {
    const { data: existingCert } = await (adminClient.from("worker_certifications") as any)
      .select("id")
      .eq("worker_id", SURAT_PLUMBER_WORKER_ID)
      .eq("certification_id", plumbCert.id)
      .maybeSingle();

    if (!existingCert) {
      await (adminClient.from("worker_certifications") as any).insert({
        worker_id: SURAT_PLUMBER_WORKER_ID,
        certification_id: plumbCert.id,
        certificate_number: "IPSC-SUR-2025-9012",
        issue_date: getIsoDate(120),
        status: "VERIFIED",
        is_verified: true,
        verification_date: getIsoDate(100),
      });
      console.log("    Added Level-4 IPSC Plumbing certification to Surat craftsman Pramod Joshi");
    }
  }

  // 3. Ensure Vadodara Plumber Srinivas Rao (ab12804a-49b8-4a79-a320-3683256b87ae) has plumbing skill
  const VADODARA_PLUMBER_WORKER_ID = "ab12804a-49b8-4a79-a320-3683256b87ae";
  if (plumbingSkill) {
    const { data: existingVPlumb } = await (adminClient.from("worker_skills") as any)
      .select("id")
      .eq("worker_id", VADODARA_PLUMBER_WORKER_ID)
      .eq("skill_id", plumbingSkill.id)
      .maybeSingle();

    if (!existingVPlumb) {
      await (adminClient.from("worker_skills") as any).insert({
        worker_id: VADODARA_PLUMBER_WORKER_ID,
        skill_id: plumbingSkill.id,
        proficiency_level: "EXPERT",
      });
      console.log("    Added verified Plumbing skill to Vadodara craftsman Srinivas Rao");
    }
  }

  // 4. Ensure Vadodara Electrician Tushar Patil (391647a6-8d8b-43cf-925e-17d9fd347d0b) has electrical skill & cert
  const VADODARA_ELEC_WORKER_ID = "391647a6-8d8b-43cf-925e-17d9fd347d0b";
  const { data: elecSkill } = await (adminClient.from("skills") as any)
    .select("id")
    .ilike("name", "Electrical")
    .maybeSingle();

  if (elecSkill) {
    const { data: existingVElec } = await (adminClient.from("worker_skills") as any)
      .select("id")
      .eq("worker_id", VADODARA_ELEC_WORKER_ID)
      .eq("skill_id", elecSkill.id)
      .maybeSingle();

    if (!existingVElec) {
      await (adminClient.from("worker_skills") as any).insert({
        worker_id: VADODARA_ELEC_WORKER_ID,
        skill_id: elecSkill.id,
        proficiency_level: "EXPERT",
      });
      console.log("    Added verified Electrical skill to Vadodara craftsman Tushar Patil");
    }
  }

  // 5. Ensure Surat Plumbers (Pramod Joshi & Kanti Mistry) have < 40% utilization in 14-day window
  const suratPlumberIds = [
    SURAT_PLUMBER_WORKER_ID,
    "c1de97ea-0747-49b6-887e-572066579cc3", // Kanti Mistry
  ];

  for (const spId of suratPlumberIds) {
    if (plumbingSkill) {
      const { data: skExists } = await (adminClient.from("worker_skills") as any)
        .select("id")
        .eq("worker_id", spId)
        .eq("skill_id", plumbingSkill.id)
        .maybeSingle();

      if (!skExists) {
        await (adminClient.from("worker_skills") as any).insert({
          worker_id: spId,
          skill_id: plumbingSkill.id,
          proficiency_level: "EXPERT",
        });
      }
    }

    const { data: spBookings } = await (adminClient.from("bookings") as any)
      .select("id, created_at")
      .eq("worker_id", spId)
      .gte("created_at", fourteenDaysAgo);

    if (spBookings && spBookings.length > 2) {
      const shiftB = spBookings.slice(0, spBookings.length - 2);
      for (let j = 0; j < shiftB.length; j++) {
        const dAgo = 20 + j * 3;
        await (adminClient.from("bookings") as any)
          .update({
            created_at: getIsoDate(dAgo, 9),
            scheduled_start_at: getIsoDate(dAgo, 10),
            scheduled_end_at: getIsoDate(dAgo, 12),
            actual_start_at: getIsoDate(dAgo, 10),
            actual_end_at: getIsoDate(dAgo, 12),
          })
          .eq("id", shiftB[j].id);
      }
      console.log(`    Recalibrated Surat Plumber ${spId} bookings to achieve <40% utilization`);
    }
  }

  // 6. Ensure Geeta Vaghela in Rajkot is AVAILABLE with plumbing skill
  await (adminClient.from("workers") as any)
    .update({ availability_status: "AVAILABLE", verification_status: "verified" })
    .eq("id", "e5c790e4-e8a8-423a-ba91-ff96a00e3ade");

  if (plumbingSkill) {
    const { data: gvSkill } = await (adminClient.from("worker_skills") as any)
      .select("id")
      .eq("worker_id", "e5c790e4-e8a8-423a-ba91-ff96a00e3ade")
      .eq("skill_id", plumbingSkill.id)
      .maybeSingle();

    if (!gvSkill) {
      await (adminClient.from("worker_skills") as any).insert({
        worker_id: "e5c790e4-e8a8-423a-ba91-ff96a00e3ade",
        skill_id: plumbingSkill.id,
        proficiency_level: "EXPERT",
      });
    }
  }

  console.log("    Cross-federation candidate skills & certifications verified.\n");

  // ---------------------------------------------------------------------------
  // STAGE 3: MULTI-TRADE DEMAND & CAPACITY PATTERNS (SURAT & VADODARA BOOKINGS)
  // ---------------------------------------------------------------------------
  console.log("--> Stage 3: Enriching realistic multi-trade demand and capacity patterns...");

  // Fetch reference services and addresses
  const { data: servicesList } = await (adminClient.from("services") as any)
    .select("id, title, category_id, service_categories(name)")
    .limit(30);

  const { data: addressesList } = await (adminClient.from("addresses") as any)
    .select("id, profile_id, city, address_line1")
    .limit(10);

  const { data: customersList } = await (adminClient.from("profiles") as any)
    .select("id, full_name, email, phone")
    .eq("role", "CUSTOMER")
    .neq("id", PRINCE_CUSTOMER_PROFILE_ID)
    .limit(15);

  const fallbackAddressId = addressesList?.[0]?.id || "00000000-0000-0000-0000-000000000001";
  const fallbackCustomer = customersList?.[0] || { id: "32d8e739-e47d-4ec2-8895-15d478f74e51" };

  // Helper to find service by category
  function findServiceByCat(catName: string) {
    return (
      servicesList?.find((s: any) =>
        s.service_categories?.name?.toLowerCase().includes(catName.toLowerCase())
      ) || servicesList?.[0]
    );
  }

  const electricalService = findServiceByCat("Electrical");
  const paintingService = findServiceByCat("Painting");
  const cleaningService = findServiceByCat("Cleaning");

  // Deterministic seed bookings for Surat Electrical (High demand + adequate capacity)
  // and Vadodara Carpentry (Moderate demand + adequate capacity)
  const additionalBookings = [
    // Surat Electrical demand (last 30d: 5 bookings, prev 30d: 4 bookings -> steady trend)
    {
      id: "b0000001-0000-4000-8000-000000000001",
      booking_number: "BK-SUR-EL-01",
      customer_id: customersList?.[1]?.id || fallbackCustomer.id,
      worker_id: null,
      service_id: electricalService?.id,
      federation_id: FED_SURAT,
      address_id: fallbackAddressId,
      status: "REQUEST_SENT",
      problem_description: "Commercial main distribution board breaker tripping frequently during high-load hours.",
      scheduled_start_at: getIsoDate(3, 10),
      scheduled_end_at: getIsoDate(3, 12),
      total_amount: 650,
      platform_fee: 32.5,
      worker_earnings: 617.5,
      created_at: getIsoDate(4, 9),
    },
    {
      id: "b0000001-0000-4000-8000-000000000002",
      booking_number: "BK-SUR-EL-02",
      customer_id: customersList?.[2]?.id || fallbackCustomer.id,
      worker_id: null,
      service_id: electricalService?.id,
      federation_id: FED_SURAT,
      address_id: fallbackAddressId,
      status: "WORKER_REVIEWING",
      problem_description: "New factory workshop three-phase internal power cabling and industrial outlet fitting.",
      scheduled_start_at: getIsoDate(5, 14),
      scheduled_end_at: getIsoDate(5, 17),
      total_amount: 1200,
      platform_fee: 60,
      worker_earnings: 1140,
      created_at: getIsoDate(6, 11),
    },
    {
      id: "b0000001-0000-4000-8000-000000000003",
      booking_number: "BK-SUR-EL-03",
      customer_id: customersList?.[3]?.id || fallbackCustomer.id,
      worker_id: null,
      service_id: electricalService?.id,
      federation_id: FED_SURAT,
      address_id: fallbackAddressId,
      status: "BOOKING_CONFIRMED",
      problem_description: "Inverter backup system wiring and battery terminal insulation inspection.",
      scheduled_start_at: getIsoDate(12, 10),
      scheduled_end_at: getIsoDate(12, 12),
      total_amount: 500,
      platform_fee: 25,
      worker_earnings: 475,
      created_at: getIsoDate(13, 8),
    },
    // Vadodara Painting demand
    {
      id: "b0000001-0000-4000-8000-000000000004",
      booking_number: "BK-VAD-PT-01",
      customer_id: customersList?.[4]?.id || fallbackCustomer.id,
      worker_id: null,
      service_id: paintingService?.id,
      federation_id: FED_VADODARA,
      address_id: fallbackAddressId,
      status: "REQUEST_SENT",
      problem_description: "Exterior waterproof emulsion coating for duplex ground floor boundary walls.",
      scheduled_start_at: getIsoDate(2, 9),
      scheduled_end_at: getIsoDate(2, 13),
      total_amount: 1800,
      platform_fee: 90,
      worker_earnings: 1710,
      created_at: getIsoDate(3, 10),
    },
    // Cleaning (Surplus capacity)
    {
      id: "b0000001-0000-4000-8000-000000000005",
      booking_number: "BK-AMD-CL-01",
      customer_id: customersList?.[0]?.id || fallbackCustomer.id,
      worker_id: null,
      service_id: cleaningService?.id,
      federation_id: FED_AHMEDABAD,
      address_id: fallbackAddressId,
      status: "REQUEST_SENT",
      problem_description: "Post-renovation deep cleaning of living hall and balcony tile scrubbing.",
      scheduled_start_at: getIsoDate(1, 10),
      scheduled_end_at: getIsoDate(1, 13),
      total_amount: 850,
      platform_fee: 42.5,
      worker_earnings: 807.5,
      created_at: getIsoDate(1, 8),
    },
  ];

  for (const bk of additionalBookings) {
    const { data: exists } = await (adminClient.from("bookings") as any)
      .select("id")
      .eq("id", bk.id)
      .maybeSingle();

    if (!exists && bk.service_id) {
      await (adminClient.from("bookings") as any).insert(bk);
    }
  }
  console.log(`    Multi-trade demand bookings seeded successfully.\n`);

  // ---------------------------------------------------------------------------
  // STAGE 4: MULTI-TIER COMPLAINTS INFRASTRUCTURE
  // ---------------------------------------------------------------------------
  console.log("--> Stage 4: Seeding multi-tier realistic complaints...");

  // Find workers for complaint targets
  const { data: amdWorkersList } = await (adminClient.from("workers") as any)
    .select("id, profile_id, profession, profiles:profile_id(full_name, phone)")
    .eq("federation_id", FED_AHMEDABAD)
    .limit(10);

  // 4A: Customer -> Federation Complaints (17 realistic complaints)
  const customerComplaintsDefs = [
    {
      ref: "KS-GRV-2026-3001",
      cat: "Service Quality",
      sub: "Workmanship Defect",
      subject: "Unresolved pipe joint leakage after bathroom renovation",
      desc: "The craftsman replaced the bathroom sink trap yesterday, but water is still steadily dripping underneath onto the vanity cabinet. Requires urgent inspection and tightening.",
      priority: "HIGH",
      status: "OPEN",
      daysAgo: 1,
    },
    {
      ref: "KS-GRV-2026-3002",
      cat: "Delay / Punctuality",
      sub: "Arrival Delay",
      subject: "Worker arrived 2.5 hours after confirmed time slot",
      desc: "Booking was scheduled strictly for 9:00 AM due to work commitments. Craftsman arrived after 11:30 AM without prior telephonic notification.",
      priority: "MEDIUM",
      status: "OPEN",
      daysAgo: 2,
    },
    {
      ref: "KS-GRV-2026-3003",
      cat: "Payment / Billing Issue",
      sub: "Estimate Variance",
      subject: "Discrepancy between app estimate and final amount",
      desc: "Initial estimate on the portal showed Rs 450. However, the invoiced total is Rs 750 without an itemized breakdown of additional materials provided.",
      priority: "MEDIUM",
      status: "IN_REVIEW",
      daysAgo: 3,
    },
    {
      ref: "KS-GRV-2026-3004",
      cat: "Worker Conduct",
      sub: "Unprofessional Behavior",
      subject: "Refusal to clean worksite debris after fan installation",
      desc: "Electrician left stripped wires, insulation shavings, and drywall dust on the living room floor and refused to clean upon polite request.",
      priority: "LOW",
      status: "RESOLVED",
      notes: "Craftsman counseled on cooperative service hygiene standards. 10% courtesy credit issued to customer wallet.",
      daysAgo: 7,
    },
    {
      ref: "KS-GRV-2026-3005",
      cat: "Service Quality",
      sub: "Incomplete Task",
      subject: "Kitchen tap installed with reversed hot/cold water lines",
      desc: "Craftsman accidentally connected the solar geyser line to the cold water lever. Water gets scalding hot when cold is turned on.",
      priority: "HIGH",
      status: "RESOLVED",
      notes: "Same-day revisit arranged at zero extra cost. Connections reversed and certified safe by senior supervisor.",
      daysAgo: 10,
    },
    {
      ref: "KS-GRV-2026-3006",
      cat: "Delay / Punctuality",
      sub: "Unscheduled Cancellation",
      subject: "Craftsman cancelled booking 10 minutes prior to scheduled start",
      desc: "Emergency plumbing booking was cancelled at the last minute stating transport issues, causing water damage in the hallway.",
      priority: "CRITICAL",
      status: "RESOLVED",
      notes: "Backup emergency technician dispatched within 25 minutes. Federation absorbed additional platform service fee.",
      daysAgo: 14,
    },
    {
      ref: "KS-GRV-2026-3007",
      cat: "Pricing Dispute",
      sub: "Labor Rate Disagreement",
      subject: "Overcharge on wall switchboard wiring labor",
      desc: "Job took 20 minutes to replace a single fuse, but 2 full hours of labor were recorded on the generated bill.",
      priority: "MEDIUM",
      status: "RESOLVED",
      notes: "Bill adjusted to minimum visit charge. Excess Rs 200 refunded via digital payment settlement.",
      daysAgo: 16,
    },
    {
      ref: "KS-GRV-2026-3008",
      cat: "Service Quality",
      sub: "Faulty Component",
      subject: "Submersible pump circuit tripped immediately after repair",
      desc: "Pump ran for 5 minutes and tripped the main MCB. Burnt smell from the starter capacitor.",
      priority: "HIGH",
      status: "IN_REVIEW",
      daysAgo: 4,
    },
    {
      ref: "KS-GRV-2026-3009",
      cat: "Worker Conduct",
      sub: "Communication",
      subject: "Communication barrier during emergency gas pipeline check",
      desc: "Technician was impatient when customer asked questions regarding the gas pipe clamp safety certificate.",
      priority: "LOW",
      status: "RESOLVED",
      notes: "Customer contacted by Federation Support lead. Copy of inspection certificate sent via email.",
      daysAgo: 21,
    },
    {
      ref: "KS-GRV-2026-3010",
      cat: "Payment / Billing Issue",
      sub: "Receipt Unavailable",
      subject: "GST invoice not generated after cash payment to worker",
      desc: "Paid Rs 1,200 for painting touch-up. Need GST receipt for society maintenance reimbursement audit.",
      priority: "MEDIUM",
      status: "RESOLVED",
      notes: "Official GST invoice #INV-AMD-2026-1049 generated and delivered to customer profile.",
      daysAgo: 25,
    },
    {
      ref: "KS-GRV-2026-3011",
      cat: "Service Quality",
      sub: "Paint Smudging",
      subject: "Paint splatters on wooden flooring and baseboards",
      desc: "Painters did not use masking tape on hardwood parquet flooring. Several stubborn enamel spots remain.",
      priority: "MEDIUM",
      status: "RESOLVED",
      notes: "Cleaning specialist sent with eco-friendly solvent. Floors restored to pristine condition.",
      daysAgo: 28,
    },
    {
      ref: "KS-GRV-2026-3012",
      cat: "Delay / Punctuality",
      sub: "Late Start",
      subject: "Carpentry repair started after lunch instead of morning",
      desc: "Appointment was 10:00 AM. Craftsman turned up at 2:15 PM citing delayed bus transit.",
      priority: "LOW",
      status: "RESOLVED",
      notes: "Craftsman issued a transport delay warning. Cooperative points adjusted.",
      daysAgo: 32,
    },
    {
      ref: "KS-GRV-2026-3013",
      cat: "Service Quality",
      sub: "Loose Fixture",
      subject: "Ceiling fan rod wobbling at high speeds",
      desc: "Fan shakes noticeably on speed 4 and 5. Screws on ceiling canopy appear loose.",
      priority: "HIGH",
      status: "IN_REVIEW",
      daysAgo: 2,
    },
    {
      ref: "KS-GRV-2026-3014",
      cat: "Worker Conduct",
      sub: "Safety Gear",
      subject: "Craftsman did not wear safety shoes during tile demolition",
      desc: "Customer noticed worker was wearing flip-flops while using hammer chisel on bathroom floor tiles.",
      priority: "MEDIUM",
      status: "RESOLVED",
      notes: "Federation safety equipment compliance check conducted. PPE kit re-issued to worker.",
      daysAgo: 35,
    },
    {
      ref: "KS-GRV-2026-3015",
      cat: "Payment / Billing Issue",
      sub: "Double Charge",
      subject: "Online payment debited twice during gateway failure",
      desc: "First transaction timed out, second went through. Bank statement shows two deductions of Rs 550.",
      priority: "HIGH",
      status: "RESOLVED",
      notes: "Gateway reconciliation confirmed duplicate authorization. Rs 550 reversed to source bank account.",
      daysAgo: 40,
    },
    {
      ref: "KS-GRV-2026-3016",
      cat: "Service Quality",
      sub: "Appliance Noise",
      subject: "Washing machine vibrating excessively after drum shocker replacement",
      desc: "Technician installed new shock absorbers, but spin cycle causes machine to walk across laundry area.",
      priority: "MEDIUM",
      status: "OPEN",
      daysAgo: 1,
    },
    {
      ref: "KS-GRV-2026-3017",
      cat: "Pricing Dispute",
      sub: "Material Markup",
      subject: "Billed Rs 600 for standard 15A switch that retails at Rs 180",
      desc: "Requesting audit of material bill. Technician stated it was imported modular grade.",
      priority: "MEDIUM",
      status: "IN_REVIEW",
      daysAgo: 5,
    },
  ];

  let custCmpCount = 0;
  for (let i = 0; i < customerComplaintsDefs.length; i++) {
    const d = customerComplaintsDefs[i];
    const cid = `c0000001-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`;
    const cust = customersList?.[i % (customersList?.length || 1)] || fallbackCustomer;
    const worker = amdWorkersList?.[i % (amdWorkersList?.length || 1)];

    const { data: exists } = await (adminClient.from("complaints") as any)
      .select("id")
      .eq("id", cid)
      .maybeSingle();

    if (!exists) {
      const structuredPayload = {
        version: 1,
        complaintNumber: d.ref,
        category: d.cat,
        subcategory: d.sub,
        subject: d.subject,
        description: d.desc,
        priority: d.priority,
        suggestedPriority: d.priority,
        triageReason: `Standard automated intake triage: ${d.cat} case.`,
        suggestedQueue: "Federation Customer Relations & Mediation Queue",
        status: d.status,
        raisedByRole: "CUSTOMER",
        raisedByName: cust.full_name || "Customer Member",
        raisedByPhone: cust.phone || "+91 98250 11000",
        targetRole: "WORKER",
        targetName: worker?.profiles?.full_name || "Assigned Craftsman",
        targetWorkerId: worker?.id,
        federationId: FED_AHMEDABAD,
        evidenceUrls: [],
        timeline: [
          {
            id: `tml-${cid}-1`,
            type: "CASE_CREATED",
            actorId: cust.id,
            actorRole: "CUSTOMER",
            actorName: cust.full_name,
            message: `Grievance registered under ${d.cat}.`,
            timestamp: getIsoDate(d.daysAgo, 10),
          },
          ...(d.status === "RESOLVED"
            ? [
                {
                  id: `tml-${cid}-2`,
                  type: "CASE_RESOLVED",
                  actorId: "fed-officer-01",
                  actorRole: "FEDERATION_ADMIN",
                  actorName: "Mediation Officer",
                  message: d.notes || "Case resolved with consensus between customer and craftsman.",
                  timestamp: getIsoDate(Math.max(0, d.daysAgo - 1), 16),
                },
              ]
            : []),
        ],
        auditTrail: [
          {
            id: `aud-${cid}-1`,
            complaintId: cid,
            actorId: cust.id,
            actorRole: "CUSTOMER",
            actorName: cust.full_name,
            action: "CREATE",
            notes: "Grievance initialized via platform dashboard.",
            timestamp: getIsoDate(d.daysAgo, 10),
          },
        ],
      };

      await (adminClient.from("complaints") as any).insert({
        id: cid,
        complaint_number: d.ref,
        booking_id: null,
        raised_by: cust.id,
        target_profile_id: worker?.profile_id || null,
        category: d.cat,
        description: JSON.stringify(structuredPayload),
        status: d.status,
        resolution_notes: d.notes || null,
        resolved_at: d.status === "RESOLVED" ? getIsoDate(Math.max(0, d.daysAgo - 1), 16) : null,
        created_at: getIsoDate(d.daysAgo, 10),
        updated_at: getIsoDate(Math.max(0, d.daysAgo - 1), 16),
      });
      custCmpCount++;
    }
  }
  console.log(`    Customer -> Federation complaints seeded: ${custCmpCount}`);

  // 4B: Worker -> Federation Grievances (12 realistic complaints)
  const workerGrievancesDefs = [
    {
      ref: "KS-WGR-2026-4001",
      cat: "Payment Dispute",
      sub: "Customer Cash Refusal",
      subject: "Customer refused to pay agreed labor charges upon completion",
      desc: "Completed kitchen sink unclogging and trap replacement. Customer claimed job took less time than expected and refused to pay the remaining Rs 250.",
      priority: "HIGH",
      status: "OPEN",
      daysAgo: 2,
    },
    {
      ref: "KS-WGR-2026-4002",
      cat: "Unsafe Working Conditions",
      sub: "Electrical Hazard",
      subject: "Uninsulated live wires dangling without main breaker isolation",
      desc: "Customer requested fan hook repair in open balcony where building monsoon water had accumulated around exposed conduit wires. Refused to shut down society meter.",
      priority: "CRITICAL",
      status: "OPEN",
      daysAgo: 1,
    },
    {
      ref: "KS-WGR-2026-4003",
      cat: "Customer Conduct",
      sub: "Verbal Abuse",
      subject: "Unreasonable verbal hostility regarding arrival time",
      desc: "Heavy monsoon waterlogging caused a 15-minute delay on S.G. Highway. Customer used abusive language upon arrival despite telephonic advance notice.",
      priority: "MEDIUM",
      status: "IN_REVIEW",
      daysAgo: 3,
    },
    {
      ref: "KS-WGR-2026-4004",
      cat: "Job Scope Mismatch",
      sub: "Unbilled Expansion",
      subject: "Customer insisted on 4 additional ceiling lights without modifying booking",
      desc: "Original booking was for single switchboard fix. Customer demanded wiring 4 false ceiling spotlights and threatened 1-star review when informed about extra charge.",
      priority: "HIGH",
      status: "IN_REVIEW",
      daysAgo: 4,
    },
    {
      ref: "KS-WGR-2026-4005",
      cat: "Payment Dispute",
      sub: "Material Non-Reimbursement",
      subject: "Customer disputed reimbursement for 32mm CPVC pipes purchased from hardware shop",
      desc: "Provided physical store cash receipt of Rs 480 for replacement pipes. Customer deducted amount from final settlement.",
      priority: "MEDIUM",
      status: "RESOLVED",
      notes: "Cooperative verified store receipt. Customer account billed and Rs 480 disbursed to worker welfare wallet.",
      daysAgo: 8,
    },
    {
      ref: "KS-WGR-2026-4006",
      cat: "Customer Conduct",
      sub: "Unreasonable Wait",
      subject: "Locked out of apartment premises for 45 minutes after confirmed arrival",
      desc: "Arrived at 11:00 AM on time. Customer was not home and neighbor stated they would arrive in '5 minutes'. Craftsman waited 45 minutes losing next slot.",
      priority: "LOW",
      status: "RESOLVED",
      notes: "Wait-time compensation fee of Rs 150 credited to craftsman as per cooperative fair wage guidelines.",
      daysAgo: 12,
    },
    {
      ref: "KS-WGR-2026-4007",
      cat: "Unsafe Working Conditions",
      sub: "Structural Instability",
      subject: "Cracked parapet wall during outdoor AC outdoor unit bracket installation",
      desc: "Third-floor balcony wall plaster was crumbling under drill torque. Unsafe to mount 45kg compressor bracket without structural anchoring.",
      priority: "HIGH",
      status: "RESOLVED",
      notes: "Job paused safely. Civil engineer inspection requested. Worker protected from cancellation penalty.",
      daysAgo: 15,
    },
    {
      ref: "KS-WGR-2026-4008",
      cat: "Job Scope Mismatch",
      sub: "Wrong Service Selected",
      subject: "Customer booked simple switch repair for full building three-phase outage",
      desc: "Arrived with household tool kit. Entire 4-storey commercial godown had burnt main service feeder line.",
      priority: "MEDIUM",
      status: "RESOLVED",
      notes: "Booking escalated to Industrial Electrical team. Visiting craftsman compensated for transit.",
      daysAgo: 18,
    },
    {
      ref: "KS-WGR-2026-4009",
      cat: "Payment Dispute",
      sub: "Digital Transaction Pending",
      subject: "UPI transaction failed on customer phone but claimed as completed",
      desc: "Customer showed a payment processing screen from their UPI app. Payment did not reflect on cooperative ledger for 24 hours.",
      priority: "MEDIUM",
      status: "RESOLVED",
      notes: "Bank reversal completed and customer made fresh settlement via platform payment link.",
      daysAgo: 22,
    },
    {
      ref: "KS-WGR-2026-4010",
      cat: "Customer Conduct",
      sub: "Aggressive Pet",
      subject: "Unrestrained guard dog prevented access to utility meter room",
      desc: "Customer refused to leash German Shepherd during electrical distribution panel inspection in backyard.",
      priority: "HIGH",
      status: "OPEN",
      daysAgo: 2,
    },
    {
      ref: "KS-WGR-2026-4011",
      cat: "Job Scope Mismatch",
      sub: "Heavy Lifting",
      subject: "Single technician booked for moving 200kg marble slab on 3rd floor",
      desc: "Customer booked general handyman service and expected solo craftsman to haul 8x4ft Italian marble slab upstairs.",
      priority: "MEDIUM",
      status: "IN_REVIEW",
      daysAgo: 5,
    },
    {
      ref: "KS-WGR-2026-4012",
      cat: "Unsafe Working Conditions",
      sub: "Chemical Fumes",
      subject: "Industrial solvent fumes in unventilated basement sump tank",
      desc: "Demanded sump cleaning immediately after chemical paint thinner was dumped into drainage without blower ventilation.",
      priority: "CRITICAL",
      status: "RESOLVED",
      notes: "Work halted under occupational safety norms. Mandatory 48-hour degassing enforced.",
      daysAgo: 26,
    },
  ];

  let wkrCmpCount = 0;
  for (let i = 0; i < workerGrievancesDefs.length; i++) {
    const d = workerGrievancesDefs[i];
    const cid = `00000002-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`;
    const worker = amdWorkersList?.[i % (amdWorkersList?.length || 1)];
    const cust = customersList?.[i % (customersList?.length || 1)] || fallbackCustomer;

    const { data: exists } = await (adminClient.from("complaints") as any)
      .select("id")
      .eq("id", cid)
      .maybeSingle();

    if (!exists && worker?.profile_id) {
      const structuredPayload = {
        version: 1,
        complaintNumber: d.ref,
        category: d.cat,
        subcategory: d.sub,
        subject: d.subject,
        description: d.desc,
        priority: d.priority,
        suggestedPriority: d.priority,
        triageReason: `Worker Grievance Protection Protocol: ${d.cat}.`,
        suggestedQueue: "Federation Worker Welfare & Fair Wage Grievance Desk",
        status: d.status,
        raisedByRole: "WORKER",
        raisedByName: worker.profiles?.full_name || "Verified Craftsman",
        raisedByPhone: worker.profiles?.phone || "+91 98251 22000",
        targetRole: "CUSTOMER",
        targetName: cust.full_name,
        targetProfileId: cust.id,
        federationId: FED_AHMEDABAD,
        evidenceUrls: [],
        timeline: [
          {
            id: `tml-${cid}-1`,
            type: "CASE_CREATED",
            actorId: worker.profile_id,
            actorRole: "WORKER",
            actorName: worker.profiles?.full_name,
            message: `Worker grievance registered under ${d.cat}.`,
            timestamp: getIsoDate(d.daysAgo, 14),
          },
        ],
        auditTrail: [
          {
            id: `aud-${cid}-1`,
            complaintId: cid,
            actorId: worker.profile_id,
            actorRole: "WORKER",
            actorName: worker.profiles?.full_name,
            action: "CREATE",
            notes: "Worker grievance filed via Kaushal Bandhu assistance module.",
            timestamp: getIsoDate(d.daysAgo, 14),
          },
        ],
      };

      await (adminClient.from("complaints") as any).insert({
        id: cid,
        complaint_number: d.ref,
        booking_id: null,
        raised_by: worker.profile_id,
        target_profile_id: cust.id,
        category: d.cat,
        description: JSON.stringify(structuredPayload),
        status: d.status,
        resolution_notes: d.notes || null,
        resolved_at: d.status === "RESOLVED" ? getIsoDate(Math.max(0, d.daysAgo - 1), 18) : null,
        created_at: getIsoDate(d.daysAgo, 14),
        updated_at: getIsoDate(Math.max(0, d.daysAgo - 1), 18),
      });
      wkrCmpCount++;
    }
  }
  console.log(`    Worker -> Federation grievances seeded: ${wkrCmpCount}`);

  // 4C: Federation -> Super Admin Complaints / Escalations (7 cases)
  const fedEscalationsDefs = [
    {
      ref: "KS-FED-ESC-5001",
      cat: "Platform Fee Settlement",
      fedId: FED_AHMEDABAD,
      fedName: "Ahmedabad Skilled Workers Federation",
      subject: "Delayed bi-weekly platform revenue share reconciliation for August 2026 cycle",
      desc: "The 1.5% cooperative administration dividend share of Rs 48,250 for Ahmedabad federation cycle closing 31st August has not cleared to Gujarat State Cooperative Bank nodal account.",
      priority: "HIGH",
      status: "OPEN",
      daysAgo: 3,
    },
    {
      ref: "KS-FED-ESC-5002",
      cat: "Cross-Federation Wage Dispute",
      fedId: FED_SURAT,
      fedName: "Surat Technicians Guild",
      subject: "Inter-district travel daily allowance rate mismatch for emergency flood deployment",
      desc: "Surat electrical technicians deployed to Bharuch industrial corridor under emergency mutual-aid agreement received local zone allowance rather than disaster relief tier-2 rate.",
      priority: "CRITICAL",
      status: "IN_REVIEW",
      daysAgo: 4,
    },
    {
      ref: "KS-FED-ESC-5003",
      cat: "Worker Welfare Subsidy",
      fedId: FED_VADODARA,
      fedName: "Vadodara Artisan Cooperative",
      subject: "State Labor Welfare Board insurance premium subsidy claim rejection notice",
      desc: "Annual government insurance subsidy claim for 24 registered carpentry craftsmen was returned citing missing ESIC universal account numbers. Requesting Super Admin nodal intervention.",
      priority: "HIGH",
      status: "OPEN",
      daysAgo: 2,
    },
    {
      ref: "KS-FED-ESC-5004",
      cat: "Technical System Escalation",
      fedId: FED_GANDHINAGAR,
      fedName: "Gujarat Household Services Federation",
      subject: "SMS OTP delivery latency spike affecting service completion handshakes",
      desc: "Between 5:00 PM and 8:00 PM peak hours, completion OTP delivery via National SMS Gateway experiences 4 to 8 minute delays, resulting in customer abandonment.",
      priority: "MEDIUM",
      status: "RESOLVED",
      notes: "Super Admin routed OTP traffic to secondary telecommunication route. Latency reduced to <4 seconds.",
      daysAgo: 9,
    },
    {
      ref: "KS-FED-ESC-5005",
      cat: "Cooperative Policy Clarification",
      fedId: FED_AHMEDABAD,
      fedName: "Ahmedabad Skilled Workers Federation",
      subject: "Clarification required on GST exemption thresholds for artisan cooperative micro-payouts",
      desc: "Seeking formal advisory regarding Section 12AA cooperative dividend tax withholding on quarterly craftsman bonus distributions.",
      priority: "LOW",
      status: "RESOLVED",
      notes: "Formal circular #CIR-2026-TAX-08 issued by Legal & Statutory Compliance Cell confirming exemption status.",
      daysAgo: 14,
    },
    {
      ref: "KS-FED-ESC-5006",
      cat: "Cross-Federation Wage Dispute",
      fedId: FED_RAJKOT,
      fedName: "Saurashtra Skilled Workers Guild",
      subject: "Dispute regarding tool breakage liability during inter-federation commercial project",
      desc: "Heavy-duty rotary hammer drill supplied by Rajkot guild suffered armature burn-out during Bhavnagar port warehouse installation.",
      priority: "MEDIUM",
      status: "RESOLVED",
      notes: "50-50 equipment amortized maintenance split approved between sending guild and project federation.",
      daysAgo: 20,
    },
    {
      ref: "KS-FED-ESC-5007",
      cat: "Platform Fee Settlement",
      fedId: FED_SURAT,
      fedName: "Surat Technicians Guild",
      subject: "Merchant payment gateway transaction charge dispute on high-value commercial bookings",
      desc: "Commercial HVAC maintenance booking was charged 2.2% payment processing surcharge instead of standard 1.2% cooperative institutional rate.",
      priority: "HIGH",
      status: "IN_REVIEW",
      daysAgo: 5,
    },
  ];

  // Federation Admin profile
  const { data: fedAdminProfile } = await (adminClient.from("profiles") as any)
    .select("id, full_name, email")
    .eq("role", "FEDERATION_ADMIN")
    .limit(1)
    .maybeSingle();

  const FED_ADMIN_PROFILE_ID = fedAdminProfile?.id || "d0561488-f1bf-46f4-a35c-c44bb63fda91";

  let fedEscCount = 0;
  for (let i = 0; i < fedEscalationsDefs.length; i++) {
    const d = fedEscalationsDefs[i];
    const cid = `f0000001-0000-4000-8000-${(i + 1).toString().padStart(12, "0")}`;

    const { data: exists } = await (adminClient.from("complaints") as any)
      .select("id")
      .eq("id", cid)
      .maybeSingle();

    if (!exists) {
      const structuredPayload = {
        version: 1,
        complaintNumber: d.ref,
        category: d.cat,
        referenceNumber: d.ref,
        subject: d.subject,
        description: d.desc,
        priority: d.priority,
        suggestedPriority: d.priority,
        status: d.status,
        isEscalated: true,
        escalation: {
          reason: `Federation Executive Escalation: ${d.subject}`,
          escalatedAt: getIsoDate(d.daysAgo, 15),
          escalatedBy: "Federation Operations Director",
        },
        internalNotes: [
          {
            id: `note-${cid}-1`,
            authorName: "Platform Governance Officer",
            authorRole: "SUPER_ADMIN",
            note: "Admitted for Super Admin statutory review & cooperative mediation.",
            timestamp: getIsoDate(d.daysAgo, 17),
          },
        ],
        raisedByRole: "FEDERATION_ADMIN",
        raisedByName: `${d.fedName} (Administrator)`,
        federationId: d.fedId,
        federationName: d.fedName,
      };

      await (adminClient.from("complaints") as any).insert({
        id: cid,
        complaint_number: d.ref,
        booking_id: null,
        raised_by: FED_ADMIN_PROFILE_ID,
        target_profile_id: null,
        category: d.cat,
        description: JSON.stringify(structuredPayload),
        status: d.status,
        resolution_notes: d.notes || null,
        resolved_at: d.status === "RESOLVED" ? getIsoDate(Math.max(0, d.daysAgo - 1), 18) : null,
        created_at: getIsoDate(d.daysAgo, 15),
        updated_at: getIsoDate(Math.max(0, d.daysAgo - 1), 18),
      });
      fedEscCount++;
    }
  }
  console.log(`    Federation -> Super Admin escalations seeded: ${fedEscCount}\n`);

  // ---------------------------------------------------------------------------
  // STAGE 5: ACTIVE PROJECTS & EMERGENCY INCIDENTS
  // ---------------------------------------------------------------------------
  console.log("--> Stage 5: Seeding active project allocations and emergency response commitments...");

  // 1. Project Allocations
  // Select two verified workers from Ahmedabad to lock on commercial projects:
  // Sunil More (Electrician) & Mahesh Vaghela (Mason)
  const { data: activeProjWorkers } = await (adminClient.from("workers") as any)
    .select("id, profession, profiles:profile_id(full_name)")
    .eq("federation_id", FED_AHMEDABAD)
    .in("profession", ["Electrician", "Mason"])
    .limit(2);

  const { data: existingProjReq } = await (adminClient.from("project_requests") as any)
    .select("id")
    .limit(1)
    .maybeSingle();

  const { data: existingReqSpec } = await (adminClient.from("project_requirements") as any)
    .select("id")
    .limit(1)
    .maybeSingle();

  if (activeProjWorkers && activeProjWorkers.length >= 2 && existingProjReq && existingReqSpec) {
    const projAllocs = [
      {
        id: "a0000001-0000-4000-8000-000000000001",
        project_request_id: existingProjReq.id,
        requirement_id: existingReqSpec.id,
        worker_id: activeProjWorkers[0].id,
        status: "ACTIVE",
        allocated_at: getIsoDate(2, 9),
      },
      {
        id: "a0000001-0000-4000-8000-000000000002",
        project_request_id: existingProjReq.id,
        requirement_id: existingReqSpec.id,
        worker_id: activeProjWorkers[1].id,
        status: "ACTIVE",
        allocated_at: getIsoDate(3, 9),
      },
    ];

    for (const pa of projAllocs) {
      const { data: exists } = await (adminClient.from("project_allocations") as any)
        .select("id")
        .eq("id", pa.id)
        .maybeSingle();

      if (!exists) {
        await (adminClient.from("project_allocations") as any).insert(pa);
      }
    }
    console.log(`    Active project allocations created for ${activeProjWorkers[0].profiles?.full_name} and ${activeProjWorkers[1].profiles?.full_name} (Project Lock Enabled)`);
  }

  // 2. Active Emergency Incident & Dispatch Pool
  // Select Rajesh Solanki (Solar/Electrical, Ahmedabad) for active emergency dispatch
  const { data: emWorker } = await (adminClient.from("workers") as any)
    .select("id, profiles:profile_id(full_name)")
    .eq("federation_id", FED_AHMEDABAD)
    .eq("profession", "Solar Technician")
    .limit(1)
    .maybeSingle();

  const EMERGENCY_INCIDENT_ID = "e0000001-0000-4000-8000-000000000001";
  const { data: existingEm } = await (adminClient.from("emergency_incidents") as any)
    .select("id")
    .eq("id", EMERGENCY_INCIDENT_ID)
    .maybeSingle();

  if (!existingEm) {
    await (adminClient.from("emergency_incidents") as any).insert({
      id: EMERGENCY_INCIDENT_ID,
      emergency_id: "EM-AMD-2026-901",
      customer_id: fallbackCustomer.id,
      federation_id: FED_AHMEDABAD,
      category_name: "Electrical",
      emergency_type: "Electrical Fire Hazard & Transformer Sparks",
      severity: "CRITICAL",
      status: "ACTIVE",
      location: "Bopal Crossroads, Ahmedabad",
      address_details: { city: "Ahmedabad", locality: "Bopal", landmark: "Near BRTS Stop" },
      description: "Overhead service cable spark hazard showering molten insulation on pedestrian walkway.",
      evidence_photos: [],
      approx_people_affected: 25,
      immediate_danger: true,
      danger_details: "Live 440V sparking conductor dangling near drainage water.",
      metadata: { dispatchedTeamsCount: 1 },
      created_at: getIsoDate(0, 11),
      updated_at: getIsoDate(0, 12),
      is_verified: true,
    });
    console.log("    Created active Emergency Incident #EM-AMD-2026-901 (Status: ACTIVE)");
  }

  if (emWorker) {
    const DISPATCH_ID = "d0000001-0000-4000-8000-000000000001";
    const { data: existingDispatch } = await (adminClient.from("emergency_dispatch_pool") as any)
      .select("id")
      .eq("id", DISPATCH_ID)
      .maybeSingle();

    if (!existingDispatch) {
      await (adminClient.from("emergency_dispatch_pool") as any).insert({
        id: DISPATCH_ID,
        incident_id: EMERGENCY_INCIDENT_ID,
        worker_id: emWorker.id,
        federation_id: FED_AHMEDABAD,
        required_role: "Rapid Response Electrician",
        matched_skills: ["High Voltage Isolation", "Emergency Line Repair"],
        eligibility_score: 95,
        eligibility_reasons: "Closest verified emergency certified technician within 3.5km",
        status: "ACCEPTED",
        offered_at: getIsoDate(0, 11, 15),
        responded_at: getIsoDate(0, 11, 20),
        notes: "En route with safety insulation gloves and grounding clamps.",
        created_at: getIsoDate(0, 11, 15),
        updated_at: getIsoDate(0, 11, 20),
      });
      console.log(`    Active emergency dispatch created for ${emWorker.profiles?.full_name} (Emergency Lock Enabled)`);
    }
  }
  console.log("    Project and emergency commitments established.\n");

  // ---------------------------------------------------------------------------
  // STAGE 6: WELFARE & INSURANCE ENRICHMENT
  // ---------------------------------------------------------------------------
  console.log("--> Stage 6: Enriching worker welfare and insurance records...");
  // Ensure the 7 calibrated under-utilized workers have social security welfare & insurance
  for (let i = 0; i < targetWorkerNames.length; i++) {
    const item = targetWorkerNames[i];
    const { data: profs } = await (adminClient.from("profiles") as any)
      .select("id")
      .ilike("full_name", `%${item.name}%`);

    if (!profs || profs.length === 0) continue;
    const { data: wRec } = await (adminClient.from("workers") as any)
      .select("id, federation_id")
      .eq("profile_id", profs[0].id)
      .maybeSingle();

    if (!wRec) continue;

    const wid = `wel-seed-${i + 1}`;
    const { data: existingWelfare } = await (adminClient.from("welfare_records") as any)
      .select("id")
      .eq("worker_id", wRec.id)
      .maybeSingle();

    if (!existingWelfare) {
      await (adminClient.from("welfare_records") as any).insert({
        worker_id: wRec.id,
        federation_id: wRec.federation_id,
        fund_type: "State Artisan Pension & Healthcare Trust",
        contribution_amount: 250,
        subsidy_amount: 500,
        transaction_date: getIsoDate(15, 10),
        notes: "Monthly statutory cooperative welfare contribution.",
      });
    }

    const { data: existingIns } = await (adminClient.from("insurance_records") as any)
      .select("id")
      .eq("worker_id", wRec.id)
      .maybeSingle();

    if (!existingIns) {
      await (adminClient.from("insurance_records") as any).insert({
        worker_id: wRec.id,
        policy_number: `NIA-GIG-2026-${(6000 + i).toString()}`,
        provider_name: "New India Assurance Co. Ltd.",
        coverage_amount: 500000,
        start_date: getIsoDate(180),
        end_date: getIsoDate(-185),
        is_active: true,
      });
    }
  }
  console.log("    Welfare and insurance records enriched.\n");

  console.log("================================================================================");
  console.log("PHASE 5 DATA ENRICHMENT COMPLETED SUCCESSFULLY");
  console.log("================================================================================");
}

main().catch((err) => {
  console.error("Enrichment script failed with error:", err);
  process.exit(1);
});

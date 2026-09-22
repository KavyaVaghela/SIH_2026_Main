import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// 1. ENVIRONMENT & SUPABASE CLIENT INITIALIZATION
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
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or service role key in .env.local");
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// 2. PROTECTED TEST ACCOUNT CONSTANTS
// ---------------------------------------------------------------------------
const PRINCE_CUSTOMER_PROFILE_ID = "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";
const RAVI_WORKER_PROFILE_ID = "70fbdb46-120f-459e-a616-67b4f676f5d0";

// Helper for dates
function getIsoDate(daysAgo: number, hour = 10, minute = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function getDateString(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// 3. MASTER SEED FUNCTION
// ---------------------------------------------------------------------------
async function runProductionSeed() {
  console.log("================================================================================");
  console.log("PHASE 5: PRODUCTION-STYLE REALISTIC PLATFORM DATA SEED");
  console.log("================================================================================\n");

  // -------------------------------------------------------------------------
  // STEP 0: LOCATE AND VERIFY PROTECTED ACCOUNTS
  // -------------------------------------------------------------------------
  console.log("--> Step 0: Verifying protected test accounts...");

  const { data: princeProfile, error: pErr } = await (adminClient.from("profiles") as any)
    .select("id, full_name, email, role")
    .eq("id", PRINCE_CUSTOMER_PROFILE_ID)
    .maybeSingle();

  if (!princeProfile) {
    throw new Error(`Protected Customer Prince Prajapati (${PRINCE_CUSTOMER_PROFILE_ID}) not found in profiles!`);
  }
  console.log(`    Protected Customer: ${princeProfile.full_name} (${princeProfile.email})`);

  const { data: raviProfile, error: rErr } = await (adminClient.from("profiles") as any)
    .select("id, full_name, email, role")
    .eq("id", RAVI_WORKER_PROFILE_ID)
    .maybeSingle();

  if (!raviProfile) {
    throw new Error(`Protected Worker Ravi Patel (${RAVI_WORKER_PROFILE_ID}) not found in profiles!`);
  }

  const { data: raviWorkerRec } = await (adminClient.from("workers") as any)
    .select("id, profession, federation_id")
    .eq("profile_id", RAVI_WORKER_PROFILE_ID)
    .maybeSingle();

  if (!raviWorkerRec) {
    throw new Error(`Ravi Patel worker record not found in workers table!`);
  }
  const RAVI_WORKER_ID = raviWorkerRec.id;
  console.log(`    Protected Worker: ${raviProfile.full_name} (${raviProfile.email}), Worker ID: ${RAVI_WORKER_ID}`);

  // -------------------------------------------------------------------------
  // STEP 1: CLEAN CATEGORY C TEST ARTIFACTS
  // -------------------------------------------------------------------------
  console.log("\n--> Step 1: Cleaning Category C test artifacts...");

  // Reverse foreign-key cleanup
  console.log("    Cleaning reviews...");
  await (adminClient.from("reviews") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning complaints...");
  await (adminClient.from("complaints") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning payments...");
  await (adminClient.from("payments") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning invoice items...");
  await (adminClient.from("invoice_items") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning invoices...");
  await (adminClient.from("invoices") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning booking status history...");
  await (adminClient.from("booking_status_history") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning worker estimates...");
  await (adminClient.from("worker_estimates") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning job requests...");
  await (adminClient.from("job_requests") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning bookings...");
  await (adminClient.from("bookings") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning project allocations...");
  await (adminClient.from("project_allocations") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning project requirements...");
  await (adminClient.from("project_requirements") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning project requests...");
  await (adminClient.from("project_requests") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning emergency dispatch pool...");
  await (adminClient.from("emergency_dispatch_pool") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning emergency incidents...");
  await (adminClient.from("emergency_incidents") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning welfare records...");
  await (adminClient.from("welfare_records") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning insurance records...");
  await (adminClient.from("insurance_records") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("    Cleaning notifications...");
  await (adminClient.from("notifications") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Deactivate bogus test federations
  const bogusCodes = ["FED-GUJ-454", "FED-GUJ-534", "FED-GUJ-105", "FED-GUJ-924", "FED-GUJ-201"];
  for (const bCode of bogusCodes) {
    await (adminClient.from("federations") as any)
      .update({ is_active: false, status: "SUSPENDED" })
      .eq("code", bCode);
  }

  // Clean bogus test addresses (e.g. Lahore)
  await (adminClient.from("addresses") as any)
    .delete()
    .or("city.ilike.%d3e2f%,state.ilike.%lahore%,postal_code.eq.555555");

  console.log("    Artifact cleanup complete.");

  // -------------------------------------------------------------------------
  // STEP 2: CONFIGURE 5 CORE GUJARAT COOPERATIVE FEDERATIONS
  // -------------------------------------------------------------------------
  console.log("\n--> Step 2: Configuring 5 primary Gujarat federations...");

  const targetFederations = [
    {
      code: "FED-AMD-01",
      name: "Ahmedabad Skilled Workers Federation",
      city: "Ahmedabad",
      state: "Gujarat",
      address: "Kameshwar Complex, Satellite Road, Ahmedabad",
      phone: "+91 79 2676 0001",
      email: "federation@example.com",
      service_region: "Ahmedabad Urban & Suburban District",
      is_active: true,
      status: "ACTIVE",
    },
    {
      code: "FED-SUR-04",
      name: "Surat Technicians Guild",
      city: "Surat",
      state: "Gujarat",
      address: "Ring Road Textile Hub, Surat",
      phone: "+91 261 245 0004",
      email: "admin@surattech.org",
      service_region: "Surat & South Gujarat Industrial Zone",
      is_active: true,
      status: "ACTIVE",
    },
    {
      code: "FED-VAD-03",
      name: "Vadodara Artisan Cooperative",
      city: "Vadodara",
      state: "Gujarat",
      address: "Alkapuri Business Centre, Vadodara",
      phone: "+91 265 233 0003",
      email: "support@vadodaraartisan.org",
      service_region: "Vadodara & Central Gujarat Zone",
      is_active: true,
      status: "ACTIVE",
    },
    {
      code: "FED-GUJ-02",
      name: "Gujarat Household Services Federation",
      city: "Gandhinagar",
      state: "Gujarat",
      address: "Infocity IT Park, Gandhinagar",
      phone: "+91 79 2321 0002",
      email: "info@gujarathousehold.org",
      service_region: "Gandhinagar Capital District",
      is_active: true,
      status: "ACTIVE",
    },
    {
      code: "FED-RJK-14",
      name: "Saurashtra Skilled Workers Guild",
      city: "Rajkot",
      state: "Gujarat",
      address: "Kalawad Road Commercial Arcade, Rajkot",
      phone: "+91 281 246 0014",
      email: "contact@saurashtraworkers.org",
      service_region: "Rajkot & Saurashtra Region",
      is_active: true,
      status: "ACTIVE",
    },
  ];

  const federationIdMap = new Map<string, string>(); // code -> id

  for (const fedSpec of targetFederations) {
    const { data: existing } = await (adminClient.from("federations") as any)
      .select("id")
      .eq("code", fedSpec.code)
      .maybeSingle();

    if (existing) {
      await (adminClient.from("federations") as any)
        .update({
          name: fedSpec.name,
          city: fedSpec.city,
          state: fedSpec.state,
          address: fedSpec.address,
          contact_phone: fedSpec.phone,
          contact_email: fedSpec.email,
          service_region: fedSpec.service_region,
          is_active: fedSpec.is_active,
          status: fedSpec.status,
        })
        .eq("id", existing.id);
      federationIdMap.set(fedSpec.code, existing.id);
    } else {
      const { data: created, error: cErr } = await (adminClient.from("federations") as any)
        .insert({
          code: fedSpec.code,
          name: fedSpec.name,
          city: fedSpec.city,
          state: fedSpec.state,
          address: fedSpec.address,
          contact_phone: fedSpec.phone,
          contact_email: fedSpec.email,
          service_region: fedSpec.service_region,
          is_active: fedSpec.is_active,
          status: fedSpec.status,
          registration_number: `GUJ-${fedSpec.code}-2024`,
        })
        .select("id")
        .single();
      if (cErr) throw cErr;
      federationIdMap.set(fedSpec.code, created.id);
    }
  }

  const AMD_FED_ID = federationIdMap.get("FED-AMD-01")!;
  const SUR_FED_ID = federationIdMap.get("FED-SUR-04")!;
  const VAD_FED_ID = federationIdMap.get("FED-VAD-03")!;
  const GANDHI_FED_ID = federationIdMap.get("FED-GUJ-02")!;
  const RJK_FED_ID = federationIdMap.get("FED-RJK-14")!;

  console.log("    Federations active and ready:", Array.from(federationIdMap.entries()));

  // -------------------------------------------------------------------------
  // STEP 3: CUSTOMER POOL & ADDRESSES (35–45 CUSTOMERS)
  // -------------------------------------------------------------------------
  console.log("\n--> Step 3: Preparing realistic Customer pool & addresses...");

  // Ensure Prince Prajapati has valid default address
  const { data: princeAddr } = await (adminClient.from("addresses") as any)
    .select("id")
    .eq("profile_id", PRINCE_CUSTOMER_PROFILE_ID)
    .maybeSingle();

  let princeAddressId = princeAddr?.id;
  if (!princeAddressId) {
    const { data: newAddr } = await (adminClient.from("addresses") as any)
      .insert({
        profile_id: PRINCE_CUSTOMER_PROFILE_ID,
        title: "Home",
        address_line1: "42, Shivalik Residency, Satellite",
        address_line2: "Near ISKCON Cross Roads",
        city: "Ahmedabad",
        state: "Gujarat",
        postal_code: "380015",
        latitude: 23.0225,
        longitude: 72.5085,
        is_default: true,
      })
      .select("id")
      .single();
    princeAddressId = newAddr.id;
  }

  // Realistic customer seed specifications
  const newCustomersData = [
    { name: "Ananya Sharma", email: "ananya.sharma@example.com", phone: "+91 98251 10101", city: "Ahmedabad", locality: "Bodakdev", zip: "380054", lat: 23.0373, lng: 72.5117 },
    { name: "Rajesh Mehta", email: "rajesh.mehta@example.com", phone: "+91 98251 10102", city: "Surat", locality: "Vesu", zip: "395007", lat: 21.1442, lng: 72.7753 },
    { name: "Sunita Patel", email: "sunita.patel@example.com", phone: "+91 98251 10103", city: "Vadodara", locality: "Alkapuri", zip: "390007", lat: 22.3107, lng: 73.1812 },
    { name: "Vikram Desai", email: "vikram.desai@example.com", phone: "+91 98251 10104", city: "Gandhinagar", locality: "Sector 7", zip: "382010", lat: 23.2156, lng: 72.6369 },
    { name: "Meera Joshi", email: "meera.joshi@example.com", phone: "+91 98251 10105", city: "Rajkot", locality: "University Road", zip: "360005", lat: 22.2858, lng: 70.7698 },
    { name: "Amit Trivedi", email: "amit.trivedi@example.com", phone: "+91 98251 10106", city: "Ahmedabad", locality: "Navrangpura", zip: "380009", lat: 23.0365, lng: 72.5611 },
    { name: "Neha Bhatt", email: "neha.bhatt@example.com", phone: "+91 98251 10107", city: "Surat", locality: "Athwa Lines", zip: "395001", lat: 21.1702, lng: 72.8311 },
    { name: "Sanjay Parikh", email: "sanjay.parikh@example.com", phone: "+91 98251 10108", city: "Vadodara", locality: "Akota", zip: "390020", lat: 22.2964, lng: 73.1708 },
    { name: "Harish Shah", email: "harish.shah@example.com", phone: "+91 98251 10109", city: "Ahmedabad", locality: "Maninagar", zip: "380008", lat: 22.9978, lng: 72.6026 },
    { name: "Pooja Dave", email: "pooja.dave@example.com", phone: "+91 98251 10110", city: "Gandhinagar", locality: "Kudasan", zip: "382421", lat: 23.1812, lng: 72.6301 },
    { name: "Deepak Rathod", email: "deepak.rathod@example.com", phone: "+91 98251 10111", city: "Rajkot", locality: "Kalawad Road", zip: "360005", lat: 22.2814, lng: 70.7712 },
    { name: "Bhavna Panchal", email: "bhavna.panchal@example.com", phone: "+91 98251 10112", city: "Ahmedabad", locality: "Ghatlodia", zip: "380061", lat: 23.0722, lng: 72.5358 },
    { name: "Suresh Patel", email: "suresh.patel@example.com", phone: "+91 98251 10113", city: "Surat", locality: "Adajan", zip: "395009", lat: 21.1959, lng: 72.7933 },
    { name: "Vandana Vyas", email: "vandana.vyas@example.com", phone: "+91 98251 10114", city: "Vadodara", locality: "Fatehgunj", zip: "390002", lat: 22.3195, lng: 73.1884 },
    { name: "Manish Shah", email: "manish.shah@example.com", phone: "+91 98251 10115", city: "Ahmedabad", locality: "Prahlad Nagar", zip: "380015", lat: 23.0125, lng: 72.5111 },
    { name: "Geeta Solanki", email: "geeta.solanki@example.com", phone: "+91 98251 10116", city: "Rajkot", locality: "Nana Mava", zip: "360004", lat: 22.2741, lng: 70.7819 },
    { name: "Chetan Rawal", email: "chetan.rawal@example.com", phone: "+91 98251 10117", city: "Gandhinagar", locality: "Randesan", zip: "382421", lat: 23.1901, lng: 72.6399 },
    { name: "Rekha Zala", email: "rekha.zala@example.com", phone: "+91 98251 10118", city: "Surat", locality: "Varachha", zip: "395006", lat: 21.2183, lng: 72.8522 },
  ];

  // Map to store customer profile IDs and address IDs
  interface CustomerInfo {
    id: string;
    name: string;
    city: string;
    addressId: string;
  }

  const customerList: CustomerInfo[] = [
    {
      id: PRINCE_CUSTOMER_PROFILE_ID,
      name: "Prince Prajapati",
      city: "Ahmedabad",
      addressId: princeAddressId,
    },
  ];

  // Update existing customers with realistic names if generic
  const { data: existingCustProfiles } = await (adminClient.from("profiles") as any)
    .select("id, full_name, email")
    .eq("role", "CUSTOMER")
    .neq("id", PRINCE_CUSTOMER_PROFILE_ID);

  let custIdx = 0;
  for (const p of existingCustProfiles || []) {
    const spec = newCustomersData[custIdx % newCustomersData.length];
    custIdx++;

    // Update profile with human Indian name if name looks synthetic
    if (p.full_name?.includes("test") || p.full_name?.includes("Member") || p.full_name?.includes("snow")) {
      await (adminClient.from("profiles") as any)
        .update({ full_name: spec.name, phone: spec.phone })
        .eq("id", p.id);
    }

    // Ensure address exists
    const { data: addr } = await (adminClient.from("addresses") as any)
      .select("id")
      .eq("profile_id", p.id)
      .maybeSingle();

    let aId = addr?.id;
    if (!aId) {
      const { data: newA } = await (adminClient.from("addresses") as any)
        .insert({
          profile_id: p.id,
          title: "Home",
          address_line1: `Plot ${10 + custIdx}, ${spec.locality}`,
          city: spec.city,
          state: "Gujarat",
          postal_code: spec.zip,
          latitude: spec.lat,
          longitude: spec.lng,
          is_default: true,
        })
        .select("id")
        .single();
      aId = newA.id;
    }

    customerList.push({
      id: p.id,
      name: p.full_name || spec.name,
      city: spec.city,
      addressId: aId,
    });
  }

  // If total customers < 35, insert additional profiles
  if (customerList.length < 35) {
    const needed = 35 - customerList.length;
    for (let i = 0; i < needed; i++) {
      const spec = newCustomersData[i % newCustomersData.length];
      const email = `customer.${spec.city.toLowerCase()}.${Date.now().toString().slice(-4)}${i}@kaushalya.coop.in`;
      
      const { data: newP, error: nErr } = await (adminClient.from("profiles") as any)
        .insert({
          full_name: `${spec.name} (${i + 1})`,
          email,
          phone: spec.phone,
          role: "CUSTOMER",
          is_active: true,
        })
        .select("id, full_name")
        .single();

      if (newP) {
        const { data: newA } = await (adminClient.from("addresses") as any)
          .insert({
            profile_id: newP.id,
            title: "Home",
            address_line1: `${20 + i}, Shiv Complex, ${spec.locality}`,
            city: spec.city,
            state: "Gujarat",
            postal_code: spec.zip,
            latitude: spec.lat,
            longitude: spec.lng,
            is_default: true,
          })
          .select("id")
          .single();

        customerList.push({
          id: newP.id,
          name: newP.full_name,
          city: spec.city,
          addressId: newA.id,
        });
      }
    }
  }

  console.log(`    Total active customers in pool: ${customerList.length}`);

  // -------------------------------------------------------------------------
  // STEP 4: WORKFORCE POOL ALIGNMENT (75 WORKERS)
  // -------------------------------------------------------------------------
  console.log("\n--> Step 4: Aligning 75 workers with trades, skills, and federations...");

  // Fetch all existing worker records
  const { data: allWorkers } = await (adminClient.from("workers") as any)
    .select("id, profile_id, profession, federation_id, profiles(full_name, email)");

  const { data: allSkills } = await (adminClient.from("skills") as any).select("id, name, category_id");
  const { data: allCerts } = await (adminClient.from("certifications") as any).select("id, title");

  // Trade specifications and matching skills
  const tradeDistribution = [
    { profession: "Plumber", category: "Plumbing", skillNames: ["Plumbing", "Tap Repair", "Pipe Leakage", "Drainage Blockage"] },
    { profession: "Electrician", category: "Electrical", skillNames: ["Electrical", "Wiring", "MCB Repair", "Switch Repair"] },
    { profession: "Carpenter", category: "Carpentry & Woodwork", skillNames: ["Carpentry", "Furniture Repair", "Door Lock Fitting"] },
    { profession: "Painter", category: "Painting", skillNames: ["Painting", "Interior Wall Painting", "Waterproofing"] },
    { profession: "Cleaner", category: "Cleaning", skillNames: ["Cleaning", "Deep Cleaning", "Kitchen Cleaning", "Bathroom Cleaning"] },
    { profession: "Appliance Technician", category: "Appliance Repair", skillNames: ["Appliance Repair", "Washing Machine Repair", "Refrigerator Repair"] },
    { profession: "Mason", category: "Masonry", skillNames: ["Masonry", "Plastering", "Brickwork"] },
    { profession: "Gardener", category: "Gardening", skillNames: ["Gardening", "Lawn Mowing", "Hedge Trimming"] },
    { profession: "Solar Technician", category: "Electrical", skillNames: ["Electrical", "Wiring", "Solar PV Rooftop Installation Technician"] },
  ];

  interface WorkerInfo {
    id: string;
    profileId: string;
    name: string;
    profession: string;
    federationId: string;
    federationCode: string;
    experienceYears: number;
    hourlyRate: number;
    availabilityStatus: string;
    verificationStatus: string;
  }

  const workerPool: WorkerInfo[] = [];

  // Federation assignment quotas: AMD (32), SUR (14), VAD (12), GANDHI (9), RJK (8)
  const fedAssignmentList = [
    ...Array(32).fill({ id: AMD_FED_ID, code: "FED-AMD-01" }),
    ...Array(14).fill({ id: SUR_FED_ID, code: "FED-SUR-04" }),
    ...Array(12).fill({ id: VAD_FED_ID, code: "FED-VAD-03" }),
    ...Array(9).fill({ id: GANDHI_FED_ID, code: "FED-GUJ-02" }),
    ...Array(8).fill({ id: RJK_FED_ID, code: "FED-RJK-14" }),
  ];

  // Clean existing worker_skills and worker_certifications
  await (adminClient.from("worker_skills") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await (adminClient.from("worker_certifications") as any).delete().neq("id", "00000000-0000-0000-0000-000000000000");

  let wIdx = 0;
  for (const w of allWorkers || []) {
    const isRavi = w.id === RAVI_WORKER_ID;
    const fedAssigned = isRavi ? { id: AMD_FED_ID, code: "FED-AMD-01" } : fedAssignmentList[wIdx % fedAssignmentList.length];
    const tradeSpec = isRavi
      ? tradeDistribution[0] // Plumber
      : tradeDistribution[wIdx % tradeDistribution.length];

    const expYears = isRavi ? 8 : (wIdx % 4 === 0 ? 1 : wIdx % 4 === 1 ? 3 : wIdx % 4 === 2 ? 6 : 12);
    const hourlyRate = 300 + (expYears * 25);

    // Availability: 60 AVAILABLE, 9 BUSY (set later for active jobs), 6 UNAVAILABLE
    let avail = "AVAILABLE";
    if (!isRavi && wIdx >= 69) {
      avail = "UNAVAILABLE";
    }

    const verif = isRavi ? "verified" : (wIdx % 10 === 9 ? "pending_verification" : "verified");

    // Update worker row
    await (adminClient.from("workers") as any)
      .update({
        profession: tradeSpec.profession,
        federation_id: fedAssigned.id,
        experience_years: expYears,
        hourly_rate: hourlyRate,
        availability_status: avail,
        verification_status: verif,
        account_status: "ACTIVE",
        service_radius_km: 15,
      })
      .eq("id", w.id);

    workerPool.push({
      id: w.id,
      profileId: w.profile_id,
      name: w.profiles?.full_name || `Worker ${wIdx + 1}`,
      profession: tradeSpec.profession,
      federationId: fedAssigned.id,
      federationCode: fedAssigned.code,
      experienceYears: expYears,
      hourlyRate,
      availabilityStatus: avail,
      verificationStatus: verif,
    });

    // Add normalized skills in worker_skills
    for (const sName of tradeSpec.skillNames) {
      const sk = allSkills?.find((s: any) => s.name.toLowerCase() === sName.toLowerCase());
      if (sk) {
        await (adminClient.from("worker_skills") as any).insert({
          worker_id: w.id,
          skill_id: sk.id,
          proficiency_level: expYears >= 5 ? "expert" : "intermediate",
        });
      }
    }

    // Add certifications for a realistic subset (~30%)
    if (wIdx % 3 === 0 || isRavi) {
      let certId = allCerts?.[0]?.id; // Default: Advanced Plumbing
      if (tradeSpec.profession.includes("Electric") || tradeSpec.profession.includes("Solar")) {
        certId = allCerts?.find((c: any) => c.title.includes("Wiring") || c.title.includes("Solar"))?.id || allCerts?.[1]?.id;
      } else if (tradeSpec.profession.includes("Carpent")) {
        certId = allCerts?.find((c: any) => c.title.includes("Carpentry"))?.id || allCerts?.[4]?.id;
      } else {
        certId = allCerts?.find((c: any) => c.title.includes("Safety"))?.id || allCerts?.[2]?.id;
      }

      if (certId) {
        await (adminClient.from("worker_certifications") as any).insert({
          worker_id: w.id,
          certification_id: certId,
          certificate_number: `CERT-${tradeSpec.profession.slice(0, 3).toUpperCase()}-2025-${1000 + wIdx}`,
          issue_date: getDateString(180),
          expiry_date: getDateString(-365), // valid for next 1 year
          status: "VERIFIED",
          is_verified: true,
          verification_date: getIsoDate(150),
        });
      }
    }

    wIdx++;
  }

  console.log(`    75 workers successfully updated and assigned across federations.`);

  // -------------------------------------------------------------------------
  // STEP 5: SEED 340 RELATIONAL BOOKINGS WITH INVOICES, PAYMENTS, LIFECYCLE
  // -------------------------------------------------------------------------
  console.log("\n--> Step 5: Seeding ~340 relational bookings across 12 months...");

  let servicesList: any[] = [];
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await (adminClient.from("services") as any)
      .select("id, title, base_price, category_id, service_categories(name)");
    if (data && data.length > 0) {
      servicesList = data;
      break;
    }
    console.log(`    Retrying services query (attempt ${attempt + 1})...`, error?.message);
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  if (servicesList.length === 0) {
    throw new Error("Failed to load services from database after 5 attempts");
  }

  function getServiceForTrade(trade: string) {
    const s = servicesList.find((srv: any) =>
      srv.service_categories?.name?.toLowerCase().includes(trade.toLowerCase()) ||
      srv.title?.toLowerCase().includes(trade.toLowerCase())
    );
    return s || servicesList[0];
  }

  // We divide the 75 workers into utilization groups:
  // - High utilization (12 workers): 14-20 completed jobs across year, 40-70 worked hours in last 14d
  // - Normal utilization (35 workers): 6-12 completed jobs across year, 25-35 worked hours in last 14d
  // - Under-utilized (22 workers): 1-3 completed jobs across year, 0-12 worked hours in last 14d
  // - Unavailable (6 workers): 0-1 jobs
  const highUtilWorkers = workerPool.slice(0, 12);
  const normalUtilWorkers = workerPool.slice(12, 47);
  const underUtilWorkers = workerPool.slice(47, 69);
  const unavailWorkers = workerPool.slice(69, 75);

  let bookingCounter = 1000;

  interface BookingSeedPlan {
    workerId: string;
    customerId: string;
    customerAddressId: string;
    federationId: string;
    serviceId: string;
    servicePrice: number;
    daysAgo: number;
    durationHours: number;
    status: string;
    rating?: number;
    reviewComment?: string;
  }

  const bookingPlans: BookingSeedPlan[] = [];
  const nonPrinceCustomers = customerList.filter(c => c.id !== PRINCE_CUSTOMER_PROFILE_ID);

  // Helper to add a completed booking plan
  function addCompletedBooking(w: WorkerInfo, daysAgo: number, durationHours: number, rating?: number, comment?: string) {
    const cust = nonPrinceCustomers[bookingCounter % nonPrinceCustomers.length];
    const srv = getServiceForTrade(w.profession);
    bookingCounter++;

    bookingPlans.push({
      workerId: w.id,
      customerId: cust.id,
      customerAddressId: cust.addressId,
      federationId: w.federationId,
      serviceId: srv.id,
      servicePrice: Number(srv.base_price) || 450,
      daysAgo,
      durationHours,
      status: "BOOKING_COMPLETED",
      rating,
      reviewComment: comment,
    });
  }

  const raviWorkerInfo = workerPool.find(w => w.id === RAVI_WORKER_ID) || workerPool[0];

  // 1. Ravi Patel (Plumber, Ahmedabad) specific balanced history
  // Completed jobs across months (18 jobs total across 10 months):
  addCompletedBooking(raviWorkerInfo, 270, 2.5, 5, "Prompt and clean pipeline fitting.");
  addCompletedBooking(raviWorkerInfo, 240, 3.0, 5, "Kitchen sink trap replacement.");
  addCompletedBooking(raviWorkerInfo, 210, 2.5, 5, "Very good plumbing repair. Prompt and clean.");
  addCompletedBooking(raviWorkerInfo, 190, 2.0, 4, "Bathroom shower connection fixed.");
  addCompletedBooking(raviWorkerInfo, 175, 3.0, 5, "Fixed the main line leakage perfectly.");
  addCompletedBooking(raviWorkerInfo, 155, 2.5, 5, "Toilet flush valve repaired.");
  addCompletedBooking(raviWorkerInfo, 140, 2.0, 4, "Work was good, arrived right on schedule.");
  addCompletedBooking(raviWorkerInfo, 125, 3.0, 5, "Main overhead tank pipe overhaul.");
  addCompletedBooking(raviWorkerInfo, 110, 2.5, 5, "Reliable plumber, polite demeanor.");
  addCompletedBooking(raviWorkerInfo, 95, 2.0, 5, "Under-sink RO water filter plumbing.");
  addCompletedBooking(raviWorkerInfo, 85, 3.5, 4, "Bathroom fittings installed with great care.");
  addCompletedBooking(raviWorkerInfo, 70, 2.0, 5, "Geyser inlet copper pipe fitting.");
  addCompletedBooking(raviWorkerInfo, 60, 2.0, 5, "Quick sink fix. Fair cooperative pricing.");
  addCompletedBooking(raviWorkerInfo, 45, 2.5, 5, "Master craftsman quality on pipe soldering.");
  addCompletedBooking(raviWorkerInfo, 28, 3.0, 4, "Drainage issue resolved completely.");
  addCompletedBooking(raviWorkerInfo, 18, 2.0, 5, "Water tank valve replaced without hassle.");
  addCompletedBooking(raviWorkerInfo, 10, 3.5, 5, "Excellent plumbing diagnostics and repair.");
  addCompletedBooking(raviWorkerInfo, 4, 4.0, 4, "Punctual and very thorough testing.");
  // (Worked 7.5 hrs in last 14d -> active, healthy, under-utilized capacity for cross-federation)

  // 2. Prince Prajapati (Customer, Ahmedabad) specific balanced history (15 completed bookings across year)
  const princePlans = [
    { w: workerPool[1], daysAgo: 280, dur: 2.0, srvName: "Electrical", rating: 5, comment: "Ceiling fan installation in bedroom." },
    { w: workerPool[2], daysAgo: 250, dur: 3.0, srvName: "Carpentry", rating: 4, comment: "Study table drawer repair." },
    { w: raviWorkerInfo, daysAgo: 220, dur: 2.5, srvName: "Plumbing", rating: 5, comment: "Washbasin tap replacement by Ravi Patel." },
    { w: workerPool[3], daysAgo: 190, dur: 4.0, srvName: "Painting", rating: 5, comment: "Balcony wall touch-up and waterproofing." },
    { w: workerPool[4], daysAgo: 165, dur: 3.0, srvName: "Cleaning", rating: 5, comment: "Sofa and rug deep shampooing." },
    { w: workerPool[1], daysAgo: 140, dur: 2.5, srvName: "Electrical", rating: 5, comment: "Fixed MCB tripping problem in kitchen." },
    { w: workerPool[5], daysAgo: 115, dur: 2.0, srvName: "Appliance Repair", rating: 4, comment: "Refrigerator cooling coil servicing." },
    { w: workerPool[2], daysAgo: 95, dur: 3.5, srvName: "Carpentry", rating: 5, comment: "Cupboard magnetic lock and hinge alignment." },
    { w: workerPool[6], daysAgo: 80, dur: 3.0, srvName: "Masonry", rating: 5, comment: "Bathroom tile grouting repair." },
    { w: workerPool[7], daysAgo: 60, dur: 2.0, srvName: "Gardening", rating: 5, comment: "Balcony plants potting and pruning." },
    { w: workerPool[4], daysAgo: 45, dur: 3.5, srvName: "Cleaning", rating: 5, comment: "Full home festive pre-cleaning." },
    { w: workerPool[1], daysAgo: 30, dur: 2.0, srvName: "Electrical", rating: 4, comment: "Living room chandelier wiring." },
    { w: raviWorkerInfo, daysAgo: 20, dur: 2.5, srvName: "Plumbing", rating: 5, comment: "Kitchen sink drain blockage cleared cleanly by Ravi." },
    { w: workerPool[5], daysAgo: 12, dur: 2.0, srvName: "Appliance Repair", rating: 5, comment: "Washing machine drain pump repair." },
    { w: raviWorkerInfo, daysAgo: 5, dur: 3.0, srvName: "Plumbing", rating: 5, comment: "Bathroom mixer valve installation by Ravi Patel." },
  ];

  for (const pp of princePlans) {
    const srv = getServiceForTrade(pp.srvName);
    bookingPlans.push({
      workerId: pp.w.id,
      customerId: PRINCE_CUSTOMER_PROFILE_ID,
      customerAddressId: princeAddressId,
      federationId: pp.w.federationId,
      serviceId: srv.id,
      servicePrice: Number(srv.base_price) || 450,
      daysAgo: pp.daysAgo,
      durationHours: pp.dur,
      status: "BOOKING_COMPLETED",
      rating: pp.rating,
      reviewComment: pp.comment,
    });
  }

  // 3. High Utilization Workers (12 workers):
  // 14-18 jobs total, 10-14 jobs in last 14 days (each 4-6 hrs -> 55-75 worked hours in 14d!)
  for (const hw of highUtilWorkers) {
    if (hw.id === RAVI_WORKER_ID) continue; // already handled
    // Older completed jobs
    for (const dAgo of [240, 180, 130, 90, 50]) {
      addCompletedBooking(hw, dAgo, 3.0, 5, "Skilled professional, neat work.");
    }
    // High activity in past 14 days (10 to 12 jobs of ~5 hours = 50-60 hrs)
    for (let day = 13; day >= 1; day -= 1.2) {
      const dAgo = Math.max(1, Math.round(day));
      addCompletedBooking(hw, dAgo, 5.0, (bookingCounter % 5 === 0 ? 4 : 5), "High quality service, very satisfied.");
    }
  }

  // 4. Normal Utilization Workers (35 workers):
  // 6-10 jobs total, 4-6 jobs in last 14 days (worked ~32 to 45 hours in 14d)
  for (const nw of normalUtilWorkers) {
    for (const dAgo of [210, 150, 80, 40]) {
      addCompletedBooking(nw, dAgo, 3.0, (bookingCounter % 6 === 0 ? 4 : 5), "Good work, prompt resolution.");
    }
    // 3 to 4 jobs in last 14 days (~34 hours)
    for (const dAgo of [12, 8, 5, 2]) {
      addCompletedBooking(nw, dAgo, 8.5, (bookingCounter % 8 === 0 ? 3 : 5), "Job completed properly.");
    }
  }

  // 5. Under-Utilized Workers (22 workers):
  // 1-3 jobs total, at most 1 short job in last 14 days (worked < 15 hours in 14d -> under-utilized!)
  for (const uw of underUtilWorkers) {
    if (bookingCounter % 2 === 0) {
      addCompletedBooking(uw, 90, 2.5, 4, "Good service.");
    }
    // Exactly 1 short job or 0 jobs in last 14 days
    if (bookingCounter % 3 === 0) {
      addCompletedBooking(uw, 7, 3.0, 4, "Satisfactory work.");
    }
  }

  // 6. Deliberate Demand Gap for Ahmedabad Plumbing:
  // Add 28 more historical plumbing booking requests in Ahmedabad during the last 30 days
  const plumbersInAmd = workerPool.filter(w => w.federationCode === "FED-AMD-01" && w.profession === "Plumber");
  for (let i = 0; i < 28; i++) {
    const dAgo = Math.floor(Math.random() * 28) + 1;
    const assignedPlumber = plumbersInAmd[i % plumbersInAmd.length];
    addCompletedBooking(assignedPlumber, dAgo, 2.0);
  }

  console.log(`    Generated ${bookingPlans.length} completed booking plans.`);

  // -------------------------------------------------------------------------
  // ACTIVE IN-FLIGHT BOOKINGS (ACROSS REALISTIC LIFECYCLE STATES)
  // -------------------------------------------------------------------------
  console.log("    Adding active in-flight booking plans across lifecycle states...");

  // In-flight state plans
  const activeStates = [
    "REQUEST_SENT",
    "REQUEST_SENT",
    "REQUEST_SENT",
    "REQUEST_SENT",
    "WORKER_REVIEWING",
    "WORKER_REVIEWING",
    "CUSTOMER_CONFIRMATION_PENDING",
    "CUSTOMER_CONFIRMATION_PENDING",
    "BOOKING_CONFIRMED",
    "BOOKING_CONFIRMED",
    "WORKER_ACCEPTED",
    "WORKER_ACCEPTED",
    "ON_THE_WAY",
    "ON_THE_WAY",
    "ARRIVED",
    "OTP_VERIFIED",
    "SERVICE_STARTED",
    "SERVICE_STARTED",
    "SERVICE_COMPLETED",
    "BILL_GENERATED",
    "PAYMENT_PENDING",
    "PAYMENT_PENDING",
  ];

  let actIdx = 0;
  for (const st of activeStates) {
    const w = normalUtilWorkers[actIdx % normalUtilWorkers.length];
    const cust = customerList[(actIdx + 2) % customerList.length];
    const srv = getServiceForTrade(w.profession);
    actIdx++;

    bookingPlans.push({
      workerId: w.id,
      customerId: cust.id,
      customerAddressId: cust.addressId,
      federationId: w.federationId,
      serviceId: srv.id,
      servicePrice: Number(srv.base_price) || 450,
      daysAgo: 0, // today / ongoing
      durationHours: 2.0,
      status: st,
    });
  }

  // 1 Active Booking for Prince Prajapati with Ravi Patel (SERVICE_STARTED)
  const pipeSrv = getServiceForTrade("Plumber");
  bookingPlans.push({
    workerId: RAVI_WORKER_ID,
    customerId: PRINCE_CUSTOMER_PROFILE_ID,
    customerAddressId: princeAddressId,
    federationId: AMD_FED_ID,
    serviceId: pipeSrv.id,
    servicePrice: Number(pipeSrv.base_price) || 450,
    daysAgo: 0,
    durationHours: 2.5,
    status: "SERVICE_STARTED",
  });

  // Some CANCELLED bookings (~18 bookings)
  for (let c = 0; c < 18; c++) {
    const w = workerPool[c % workerPool.length];
    const cust = customerList[c % customerList.length];
    const srv = getServiceForTrade(w.profession);
    bookingPlans.push({
      workerId: w.id,
      customerId: cust.id,
      customerAddressId: cust.addressId,
      federationId: w.federationId,
      serviceId: srv.id,
      servicePrice: Number(srv.base_price) || 400,
      daysAgo: 10 + c * 5,
      durationHours: 1.0,
      status: "CANCELLED",
    });
  }

  console.log(`    Total booking plans to insert: ${bookingPlans.length}`);

  // -------------------------------------------------------------------------
  // EXECUTE BATCH INSERTS OF BOOKINGS, INVOICES, PAYMENTS, STATUS HISTORIES
  // -------------------------------------------------------------------------
  console.log("    Inserting bookings, invoices, payments, and histories in batches...");

  let bNum = 10001;
  const reviewsToInsert: any[] = [];
  const complaintsPool: { bookingId: string; customerId: string; workerProfileId: string; trade: string }[] = [];

  for (let i = 0; i < bookingPlans.length; i += 25) {
    const batch = bookingPlans.slice(i, i + 25);

    for (const plan of batch) {
      bNum++;
      const bookingNumber = `BK-2026-${bNum}`;
      const subtotal = plan.servicePrice;
      const platformFee = Math.round(subtotal * 0.10);
      const taxAmount = Math.round(subtotal * 0.18);
      const totalAmount = subtotal + taxAmount;
      const workerEarnings = subtotal - platformFee;

      const createdIso = getIsoDate(plan.daysAgo, 9, 30);
      const schedStart = getIsoDate(plan.daysAgo, 10, 0);
      const schedEnd = getIsoDate(plan.daysAgo, 10 + Math.floor(plan.durationHours), 30);

      const isFinished = plan.status === "BOOKING_COMPLETED";
      const actualStart = (isFinished || plan.status === "SERVICE_STARTED" || plan.status === "SERVICE_COMPLETED")
        ? getIsoDate(plan.daysAgo, 10, 5)
        : null;
      const actualEnd = isFinished
        ? getIsoDate(plan.daysAgo, 10 + Math.floor(plan.durationHours), 20)
        : null;

      // 1. Insert Booking
      const { data: bRow, error: bErr } = await (adminClient.from("bookings") as any)
        .insert({
          booking_number: bookingNumber,
          customer_id: plan.customerId,
          worker_id: plan.workerId,
          service_id: plan.serviceId,
          federation_id: plan.federationId,
          address_id: plan.customerAddressId,
          status: plan.status,
          problem_description: `Routine cooperative service request for ${bookingNumber}`,
          otp_code: "4826",
          scheduled_start_at: schedStart,
          scheduled_end_at: schedEnd,
          actual_start_at: actualStart,
          actual_end_at: actualEnd,
          total_amount: totalAmount,
          platform_fee: platformFee,
          worker_earnings: workerEarnings,
          created_at: createdIso,
          updated_at: actualEnd || createdIso,
        })
        .select("id")
        .single();

      if (bErr || !bRow) {
        console.error("Booking insert error:", bErr?.message);
        continue;
      }

      const bookingId = bRow.id;

      // 2. Insert Booking Status History
      await (adminClient.from("booking_status_history") as any).insert({
        booking_id: bookingId,
        previous_status: null,
        new_status: "REQUEST_SENT",
        changed_by: plan.customerId,
        notes: "Service requested by customer",
        created_at: createdIso,
      });

      if (isFinished) {
        await (adminClient.from("booking_status_history") as any).insert({
          booking_id: bookingId,
          previous_status: "REQUEST_SENT",
          new_status: "BOOKING_COMPLETED",
          changed_by: plan.workerId,
          notes: "Service successfully completed and verified",
          created_at: actualEnd || createdIso,
        });

        // 3. Insert Invoice
        const invNum = `INV-2026-${bNum}`;
        const { data: invRow } = await (adminClient.from("invoices") as any)
          .insert({
            invoice_number: invNum,
            booking_id: bookingId,
            customer_id: plan.customerId,
            federation_id: plan.federationId,
            subtotal,
            platform_fee: platformFee,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status: "paid",
            issue_date: getDateString(plan.daysAgo),
            due_date: getDateString(plan.daysAgo - 7),
            paid_at: actualEnd || createdIso,
            created_at: actualEnd || createdIso,
          })
          .select("id")
          .single();

        if (invRow) {
          // 4. Insert Invoice Item
          await (adminClient.from("invoice_items") as any).insert({
            invoice_id: invRow.id,
            description: "Standard Cooperative Skilled Service Package",
            quantity: 1,
            unit_price: subtotal,
            amount: subtotal,
            created_at: actualEnd || createdIso,
          });

          // 5. Insert Payment
          await (adminClient.from("payments") as any).insert({
            payment_number: `PAY-2026-${bNum}`,
            invoice_id: invRow.id,
            booking_id: bookingId,
            customer_id: plan.customerId,
            amount: totalAmount,
            gateway_provider: (bNum % 2 === 0 ? "RAZORPAY" : "UPI"),
            gateway_order_id: `order_live_${bNum}`,
            gateway_payment_id: `pay_live_${bNum}`,
            status: "PAID",
            paid_at: actualEnd || createdIso,
            created_at: actualEnd || createdIso,
          });
        }

        // 6. Review Plan
        if (plan.rating && plan.reviewComment) {
          reviewsToInsert.push({
            booking_id: bookingId,
            customer_id: plan.customerId,
            worker_id: plan.workerId,
            rating: plan.rating,
            comment: plan.reviewComment,
            created_at: actualEnd || createdIso,
          });
        } else if (bNum % 2 === 0) {
          const stars = (bNum % 10 === 0 ? 3 : bNum % 4 === 0 ? 4 : 5);
          const comments = [
            "Very satisfied with the workmanship.",
            "Polite, punctual and skilled worker.",
            "Quality service completed quickly.",
            "Fair cooperative pricing and good work.",
            "Professional service, highly recommended.",
          ];
          reviewsToInsert.push({
            booking_id: bookingId,
            customer_id: plan.customerId,
            worker_id: plan.workerId,
            rating: stars,
            comment: comments[bNum % comments.length],
            created_at: actualEnd || createdIso,
          });
        }

        // Add to candidate pool for realistic complaints
        const wInfo = workerPool.find(w => w.id === plan.workerId);
        if (wInfo) {
          complaintsPool.push({
            bookingId,
            customerId: plan.customerId,
            workerProfileId: wInfo.profileId,
            trade: wInfo.profession,
          });
        }
      } else if (plan.status === "PAYMENT_PENDING" || plan.status === "BILL_GENERATED") {
        // Pending invoice
        const invNum = `INV-2026-${bNum}`;
        const { data: invRow } = await (adminClient.from("invoices") as any)
          .insert({
            invoice_number: invNum,
            booking_id: bookingId,
            customer_id: plan.customerId,
            federation_id: plan.federationId,
            subtotal,
            platform_fee: platformFee,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            status: "issued",
            issue_date: getDateString(0),
            due_date: getDateString(-5),
            paid_at: null,
            created_at: createdIso,
          })
          .select("id")
          .single();

        if (invRow) {
          await (adminClient.from("invoice_items") as any).insert({
            invoice_id: invRow.id,
            description: "Cooperative Service - Pending Payment Confirmation",
            quantity: 1,
            unit_price: subtotal,
            amount: subtotal,
            created_at: createdIso,
          });
        }
      }
    }
  }

  // Insert Reviews in batch
  if (reviewsToInsert.length > 0) {
    console.log(`    Inserting ${reviewsToInsert.length} authentic customer reviews...`);
    for (let r = 0; r < reviewsToInsert.length; r += 50) {
      await (adminClient.from("reviews") as any).insert(reviewsToInsert.slice(r, r + 50));
    }
  }

  // -------------------------------------------------------------------------
  // STEP 5B: REALISTIC JOB REQUESTS & WORKER ESTIMATES (~46 REQUESTS)
  // -------------------------------------------------------------------------
  console.log("\n--> Step 5B: Seeding ~46 realistic job requests & estimates...");

  const plumbingServices = servicesList?.filter((s: any) => 
    s.service_categories?.name?.toLowerCase().includes("plumb") || s.title?.toLowerCase().includes("plumb")
  ) || [];
  const defaultPlumbServiceId = plumbingServices[0]?.id || servicesList![0].id;

  const jobRequestsToInsert: any[] = [];
  const estimatesToInsert: any[] = [];

  // 1. Ahmedabad Plumbing Demand Pressure (22 requests, 16 created in last 14-30 days)
  const amdPlumbIssues = [
    "Concealed master bathroom pipe leaking inside wall; urgent inspection required.",
    "Main overhead water storage tank float valve broken; water overflowing continuously.",
    "Kitchen sink dual-drainage line severely choked with grease.",
    "Bathroom hot water geyser inlet pipe valve corroded and dripping.",
    "Underground sump motor output pipe hairline crack; low pressure to rooftop.",
    "Full replacement needed for 4 ceramic disc bathroom quarter-turn bib taps.",
    "Balcony rainwater outlet pipe clogged with garden soil during monsoon.",
    "Wall-mounted commode dual flush concealed cistern mechanism not refilling.",
    "Water softening filter unit plumbing bypass valve jammed.",
    "Main municipal line pressure check and non-return valve replacement.",
    "Kitchen RO wastewater connection leaking into under-counter cabinetry.",
    "Commercial kitchen grease trap inspection and plumbing line jetting.",
    "Washing machine dedicated outlet tap threading stripped.",
    "Terrace solar water heater cold water return line leakage.",
    "Basement drainage sump pump check valve stuck open.",
    "Master bedroom attached washroom shower mixer cartridge replacement.",
    "Old GI pipe section replacement with CPVC in ground floor utility area.",
    "Society common garden tap bibcock replacement.",
    "P-trap replacement under kitchen granite counter with odor seal.",
    "Water pump vibration causing pipe joint loosening; bracket reinforcement needed.",
    "External drainage inspection chamber blockage clearing.",
    "Bathtub pop-up waste plug mechanism replacement.",
  ];

  for (let i = 0; i < amdPlumbIssues.length; i++) {
    const cust = customerList[i % customerList.length];
    const daysAgo = (i < 16) ? Math.floor(Math.random() * 20) + 1 : 40 + i * 5;
    let status = "pending";
    if (i < 8) status = "pending";
    else if (i < 16) status = "estimates_available";
    else if (i < 19) status = "confirmed";
    else status = "completed";

    const srv = plumbingServices[i % plumbingServices.length] || plumbingServices[0];

    jobRequestsToInsert.push({
      customer_id: cust.id,
      service_id: srv.id,
      description: amdPlumbIssues[i],
      preferred_schedule: getDateString(daysAgo - 2),
      status,
      created_at: getIsoDate(daysAgo, 10, 15),
      updated_at: getIsoDate(daysAgo, 11, 0),
    });
  }

  // 2. Multi-trade job requests across other trades (~24 requests)
  const otherTradesRequests = [
    { trade: "Electric", desc: "Main circuit breaker tripping whenever AC is switched on.", daysAgo: 5, status: "estimates_available" },
    { trade: "Electric", desc: "Installation of 5 LED batten lights and 2 exhaust fans in new office.", daysAgo: 8, status: "pending" },
    { trade: "Electric", desc: "Inverter battery backup wiring check and terminal cleaning.", daysAgo: 14, status: "confirmed" },
    { trade: "Electric", desc: "Living room false ceiling LED profile strip lights installation.", daysAgo: 22, status: "completed" },
    { trade: "Electric", desc: "Earthing pit testing and grounding cable re-clamping.", daysAgo: 3, status: "pending" },
    { trade: "Carpent", desc: "Master bedroom 3-door wardrobe sliding door track misalignment.", daysAgo: 6, status: "estimates_available" },
    { trade: "Carpent", desc: "Kitchen modular hydraulic basket channel repair.", daysAgo: 12, status: "confirmed" },
    { trade: "Carpent", desc: "Wooden main door bottom expansion shaving due to humidity.", daysAgo: 18, status: "completed" },
    { trade: "Carpent", desc: "Custom study table drawer locks fitting.", daysAgo: 4, status: "pending" },
    { trade: "Paint", desc: "Living room accent wall premium textured stucco application.", daysAgo: 7, status: "estimates_available" },
    { trade: "Paint", desc: "Exterior balcony ceiling anti-fungal waterproof coat.", daysAgo: 15, status: "confirmed" },
    { trade: "Paint", desc: "Repainting 2 bedrooms with low-VOC washable emulsion.", daysAgo: 25, status: "completed" },
    { trade: "Paint", desc: "Wooden door frame melamine polish touch-up.", daysAgo: 2, status: "pending" },
    { trade: "Clean", desc: "Post-renovation deep villa scrubbing and debris removal.", daysAgo: 4, status: "estimates_available" },
    { trade: "Clean", desc: "Kitchen deep degreasing including chimney and tiles.", daysAgo: 10, status: "confirmed" },
    { trade: "Clean", desc: "Bathroom acid-free scale removal and sanitization.", daysAgo: 19, status: "completed" },
    { trade: "Appliance", desc: "Front load washing machine drum making loud rattling noise during spin cycle.", daysAgo: 5, status: "estimates_available" },
    { trade: "Appliance", desc: "Double-door frost-free refrigerator lower compartment not cooling.", daysAgo: 11, status: "confirmed" },
    { trade: "Appliance", desc: "Microwave turntable roller ring replacement and magnetron test.", daysAgo: 24, status: "completed" },
    { trade: "Appliance", desc: "Split AC cooling gas top-up and filter washing.", daysAgo: 1, status: "pending" },
    { trade: "Mason", desc: "Balcony tile replacement after waterproofing membrane lay.", daysAgo: 9, status: "estimates_available" },
    { trade: "Mason", desc: "Boundary wall brickwork crack filling with structural mortar.", daysAgo: 16, status: "confirmed" },
    { trade: "Garden", desc: "Lawn de-weeding, organic manure application, and border hedge trimming.", daysAgo: 6, status: "pending" },
    { trade: "Garden", desc: "Drip irrigation pipe layout and timer valve setting.", daysAgo: 13, status: "completed" },
  ];

  for (let j = 0; j < otherTradesRequests.length; j++) {
    const req = otherTradesRequests[j];
    const srv = getServiceForTrade(req.trade);
    const cust = customerList[(j + 5) % customerList.length];

    jobRequestsToInsert.push({
      customer_id: cust.id,
      service_id: srv.id,
      description: req.desc,
      preferred_schedule: getDateString(req.daysAgo - 2),
      status: req.status,
      created_at: getIsoDate(req.daysAgo, 11, 0),
      updated_at: getIsoDate(req.daysAgo, 12, 0),
    });
  }

  const { data: insertedJobReqs, error: jrErr } = await (adminClient.from("job_requests") as any)
    .insert(jobRequestsToInsert)
    .select("id, status, service_id");

  if (jrErr) {
    console.error("Job requests insert error:", jrErr.message);
  } else {
    console.log(`    Successfully inserted ${insertedJobReqs?.length || 0} job requests.`);

    const workersByService = (srvId: string) => {
      return workerPool.filter(w => {
        const s = getServiceForTrade(w.profession);
        return s.id === srvId;
      });
    };

    for (const jr of insertedJobReqs || []) {
      if (jr.status === "estimates_available" || jr.status === "confirmed") {
        const candidates = workersByService(jr.service_id);
        const selectedWorkers = candidates.slice(0, 2);
        if (selectedWorkers.length === 0) selectedWorkers.push(workerPool[0]);

        for (let idx = 0; idx < selectedWorkers.length; idx++) {
          const w = selectedWorkers[idx];
          const estStatus = (jr.status === "confirmed" && idx === 0) ? "ACCEPTED" : "SUBMITTED";
          estimatesToInsert.push({
            job_request_id: jr.id,
            worker_id: w.id,
            estimated_amount: w.hourlyRate * 2 + 150,
            estimated_hours: 2.0,
            notes: `Experienced ${w.profession}. Available on requested slot with standard cooperative guarantee.`,
            status: estStatus,
            created_at: getIsoDate(5, 12, 0),
          });
        }
      }
    }

    if (estimatesToInsert.length > 0) {
      await (adminClient.from("worker_estimates") as any).insert(estimatesToInsert);
      console.log(`    Successfully inserted ${estimatesToInsert.length} worker estimates.`);
    }
  }

  // -------------------------------------------------------------------------
  // STEP 6: REALISTIC COMPLAINTS (~20 BALANCED PLATFORM GRIEVANCES)
  // -------------------------------------------------------------------------
  console.log("\n--> Step 6: Seeding ~20 realistic platform complaints...");

  const complaintSpecs = [
    { cat: "Service Quality", desc: "Water tap started leaking again after 2 days; request immediate inspection.", status: "RESOLVED", res: "Worker revisited and replaced washer free of charge under guarantee." },
    { cat: "Delay / Punctuality", desc: "Worker arrived 45 minutes past scheduled appointment time.", status: "RESOLVED", res: "Worker reprimanded and issued formal punctuality warning." },
    { cat: "Payment / Billing Issue", desc: "Slight discrepancy in parts billing compared to estimate.", status: "RESOLVED", res: "Discrepancy refunded back to customer digital wallet." },
    { cat: "Pricing Dispute", desc: "Customer queried extra visit fee for extended electrical repair.", status: "RESOLVED", res: "Fee breakdown clarified as per standard Fair Wage schedule." },
    { cat: "Service Quality", desc: "Wall paint finish has visible patch marks near switchboard.", status: "IN_REVIEW", res: null },
    { cat: "Delay / Punctuality", desc: "Worker rescheduled visit due to heavy rain in area.", status: "RESOLVED", res: "Customer agreed to next-day morning appointment." },
    { cat: "Worker Conduct", desc: "Worker did not wear formal cooperative ID badge.", status: "RESOLVED", res: "Cooperative issued replacement lanyard and badge to craftsman." },
    { cat: "Service Quality", desc: "Drainage blockage returned within a week after cleaning.", status: "IN_REVIEW", res: null },
    { cat: "Payment / Billing Issue", desc: "Payment receipt SMS was delayed by 30 minutes.", status: "RESOLVED", res: "Gateway status confirmed and digital invoice emailed." },
    { cat: "Service Quality", desc: "Door hinges squeaking after alignment service.", status: "RESOLVED", res: "Worker lubricated and tightened hinge screws properly." },
    { cat: "Pricing Dispute", desc: "Material cost invoice requested for replaced brass valve.", status: "IN_REVIEW", res: null },
    { cat: "Service Quality", desc: "Fan regulator not functioning smoothly post-repair.", status: "OPEN", res: null },
    { cat: "Delay / Punctuality", desc: "Service postponed due to traffic blockage on SG Highway.", status: "RESOLVED", res: "Rescheduled and completed in afternoon." },
    { cat: "Worker Conduct", desc: "Worker left packaging debris in the hallway.", status: "RESOLVED", res: "Worker returned to clean site; hygiene reminder issued." },
    { cat: "Service Quality", desc: "Cooling efficiency query on serviced AC unit.", status: "OPEN", res: null },
    { cat: "Payment / Billing Issue", desc: "UPI double debit during server reconciliation.", status: "RESOLVED", res: "Banking partner auto-reversed duplicate charge." },
    { cat: "Service Quality", desc: "Minor paint splatter on baseboard.", status: "RESOLVED", res: "Cleaned and touched up by technician." },
    { cat: "Pricing Dispute", desc: "Labor rate clarification for evening emergency call.", status: "OPEN", res: null },
    { cat: "Service Quality", desc: "Tiles joint sealant requires re-application.", status: "IN_REVIEW", res: null },
  ];

  let cNum = 2000;
  for (const cSpec of complaintSpecs) {
    cNum++;
    const targetCandidate = complaintsPool[cNum % complaintsPool.length] || {
      bookingId: null,
      customerId: PRINCE_CUSTOMER_PROFILE_ID,
      workerProfileId: RAVI_WORKER_PROFILE_ID,
    };

    // Ensure Prince only has 1 resolved complaint in his history
    const raisedBy = (cNum === 2001) ? PRINCE_CUSTOMER_PROFILE_ID : targetCandidate.customerId;
    const targetId = (cNum === 2001) ? RAVI_WORKER_PROFILE_ID : targetCandidate.workerProfileId;

    await (adminClient.from("complaints") as any).insert({
      complaint_number: `KS-GRV-2026-${cNum}`,
      booking_id: targetCandidate.bookingId,
      raised_by: raisedBy,
      target_profile_id: targetId,
      category: cSpec.cat,
      description: cSpec.desc,
      status: cSpec.status,
      resolution_notes: cSpec.res,
      resolved_at: cSpec.status === "RESOLVED" ? getIsoDate(15, 14, 0) : null,
      created_at: getIsoDate(40, 11, 0),
      updated_at: getIsoDate(15, 14, 0),
    });
  }

  console.log(`    20 realistic complaints successfully seeded.`);

  // -------------------------------------------------------------------------
  // STEP 7: WELFARE & INSURANCE RECORDS
  // -------------------------------------------------------------------------
  console.log("\n--> Step 7: Seeding Welfare & Insurance records for workers...");

  const welfareTypes = [
    { type: "health_and_pension", contrib: 250, subsidy: 1000, notes: "State Cooperative Health Welfare Scheme" },
    { type: "tool_purchase_grant", contrib: 0, subsidy: 3500, notes: "Annual Artisan Modern Tool Upgradation Grant" },
    { type: "family_emergency_fund", contrib: 150, subsidy: 2000, notes: "District Labor Welfare Relief Assistance" },
    { type: "skill_certification_stipend", contrib: 0, subsidy: 1500, notes: "Skill Council Certification Incentive" },
  ];

  // 1. Explicitly seed Ravi Patel's welfare records
  await (adminClient.from("welfare_records") as any).insert([
    {
      worker_id: RAVI_WORKER_ID,
      federation_id: AMD_FED_ID,
      fund_type: "health_and_pension",
      contribution_amount: 250,
      subsidy_amount: 1000,
      transaction_date: getDateString(30),
      notes: "State Cooperative Health Welfare Scheme for Craftsman",
      created_at: getIsoDate(30),
    },
    {
      worker_id: RAVI_WORKER_ID,
      federation_id: AMD_FED_ID,
      fund_type: "tool_purchase_grant",
      contribution_amount: 0,
      subsidy_amount: 3500,
      transaction_date: getDateString(90),
      notes: "Annual Artisan Modern Plumbing Tool Upgradation Grant",
      created_at: getIsoDate(90),
    },
  ]);

  // Seed welfare records for other workers (38 more records)
  const nonRaviWorkers = workerPool.filter(w => w.id !== RAVI_WORKER_ID);
  for (let w = 0; w < 38; w++) {
    const worker = nonRaviWorkers[w % nonRaviWorkers.length];
    const wScheme = welfareTypes[w % welfareTypes.length];
    await (adminClient.from("welfare_records") as any).insert({
      worker_id: worker.id,
      federation_id: worker.federationId,
      fund_type: wScheme.type,
      contribution_amount: wScheme.contrib,
      subsidy_amount: wScheme.subsidy,
      transaction_date: getDateString(30 + w * 2),
      notes: wScheme.notes,
      created_at: getIsoDate(30 + w * 2),
    });
  }

  // 2. Explicitly seed Ravi Patel's active insurance policy
  const insuranceProviders = [
    "The New India Assurance Co. Ltd.",
    "ICICI Lombard General Insurance",
    "National Insurance Company Ltd.",
  ];

  await (adminClient.from("insurance_records") as any).insert({
    worker_id: RAVI_WORKER_ID,
    policy_number: "NIA-GIG-2025-5001-RAVI",
    provider_name: "The New India Assurance Co. Ltd.",
    coverage_amount: 300000,
    start_date: getDateString(180),
    end_date: getDateString(-185), // 6 months left
    is_active: true,
    created_at: getIsoDate(180),
    updated_at: getIsoDate(180),
  });

  // Insurance records for 34 other workers
  for (let ins = 0; ins < 34; ins++) {
    const worker = nonRaviWorkers[ins % nonRaviWorkers.length];
    const prov = insuranceProviders[ins % insuranceProviders.length];
    const policyNum = `NIA-GIG-2025-${5002 + ins}`;

    await (adminClient.from("insurance_records") as any).insert({
      worker_id: worker.id,
      policy_number: policyNum,
      provider_name: prov,
      coverage_amount: 300000,
      start_date: getDateString(180),
      end_date: getDateString(-185), // 6 months left
      is_active: true,
      created_at: getIsoDate(180),
      updated_at: getIsoDate(180),
    });
  }

  console.log(`    Welfare records (40) and Insurance policies (35) seeded.`);

  // -------------------------------------------------------------------------
  // STEP 8: EMERGENCY SERVICES (8 REALISTIC INCIDENTS)
  // -------------------------------------------------------------------------
  console.log("\n--> Step 8: Seeding Emergency Incidents & Dispatch Pool...");

  const emergencyIncidentsData = [
    { idNum: "101", cat: "Electrical Systems", type: "Main Circuit Breaker Fire Hazard", sev: "CRITICAL", st: "RESOLVED", fed: AMD_FED_ID, loc: "Satellite, Ahmedabad", days: 120, danger: true },
    { idNum: "102", cat: "Water Infrastructure", type: "Overhead Pipeline Burst", sev: "HIGH", st: "RESOLVED", fed: AMD_FED_ID, loc: "Navrangpura, Ahmedabad", days: 90, danger: false },
    { idNum: "103", cat: "Gas & Fire Hazard", type: "Kitchen Gas Pipeline Spark Warning", sev: "CRITICAL", st: "RESOLVED", fed: SUR_FED_ID, loc: "Ring Road, Surat", days: 60, danger: true },
    { idNum: "104", cat: "Electrical Systems", type: "Apartment Substation Earthing Fault", sev: "HIGH", st: "RESOLVED", fed: VAD_FED_ID, loc: "Alkapuri, Vadodara", days: 45, danger: true },
    { idNum: "105", cat: "Water Infrastructure", type: "Basement Drainage Backflow", sev: "MEDIUM", st: "RESOLVED", fed: AMD_FED_ID, loc: "Bodakdev, Ahmedabad", days: 20, danger: false },
    { idNum: "106", cat: "Electrical Systems", type: "Transformer Line Short Circuit", sev: "CRITICAL", st: "ACTIVE", fed: AMD_FED_ID, loc: "Vastrapur, Ahmedabad", days: 0, danger: true },
    { idNum: "107", cat: "Water Infrastructure", type: "Main Supply Line Pressure Fracture", sev: "HIGH", st: "ACTIVE", fed: SUR_FED_ID, loc: "Vesu, Surat", days: 0, danger: false },
    { idNum: "108", cat: "Electrical Systems", type: "Society Meter Room Sparking", sev: "HIGH", st: "AWAITING_RESPONSE", fed: GANDHI_FED_ID, loc: "Sector 7, Gandhinagar", days: 0, danger: true },
  ];

  for (const em of emergencyIncidentsData) {
    const cust = customerList[Number(em.idNum) % customerList.length];
    const { data: emRow } = await (adminClient.from("emergency_incidents") as any)
      .insert({
        emergency_id: `EMG-2026-${em.idNum}`,
        customer_id: cust.id,
        federation_id: em.fed,
        category_name: em.cat,
        emergency_type: em.type,
        severity: em.sev,
        status: em.st,
        location: em.loc,
        description: `Urgent emergency response call: ${em.type} at ${em.loc}. Immediate dispatch required.`,
        approx_people_affected: 8,
        immediate_danger: em.danger,
        danger_details: em.danger ? "Risk of fire or electrical short" : null,
        created_at: getIsoDate(em.days, 8, 30),
        updated_at: getIsoDate(em.days, 9, 0),
        resolved_at: em.st === "RESOLVED" ? getIsoDate(em.days, 11, 0) : null,
        closed_at: em.st === "RESOLVED" ? getIsoDate(em.days, 11, 30) : null,
      })
      .select("id")
      .single();

    if (emRow && (em.st === "ACTIVE" || em.st === "RESOLVED")) {
      // Lock a worker in dispatch pool
      const responderWorker = workerPool.find(w => w.federationId === em.fed && w.profession.includes("Electr")) || workerPool[1];
      await (adminClient.from("emergency_dispatch_pool") as any).insert({
        incident_id: emRow.id,
        worker_id: responderWorker.id,
        federation_id: em.fed,
        required_role: "Lead Emergency Technician",
        matched_skills: ["Electrical Safety", "Emergency Circuit Repair"],
        eligibility_score: 95,
        status: em.st === "ACTIVE" ? "ASSIGNED" : "COMPLETED",
        offered_at: getIsoDate(em.days, 8, 35),
        responded_at: getIsoDate(em.days, 8, 40),
        created_at: getIsoDate(em.days, 8, 35),
      });

      if (em.st === "ACTIVE") {
        // Mark worker as BUSY
        await (adminClient.from("workers") as any)
          .update({ availability_status: "BUSY" })
          .eq("id", responderWorker.id);
      }
    }
  }

  console.log(`    8 emergency incidents configured.`);

  // -------------------------------------------------------------------------
  // STEP 9: LARGE PROJECTS (10 REALISTIC PROJECTS ACROSS FEDERATIONS)
  // -------------------------------------------------------------------------
  console.log("\n--> Step 9: Seeding 10 professional Large Projects...");

  const largeProjectsData = [
    { name: "Heritage Haveli Electrical & Lighting Renovation", fed: AMD_FED_ID, budget: 185000, status: "COMPLETED", skillTrade: "Electrical", daysAgo: 150 },
    { name: "Navrangpura Commercial Plaza Plumbing Overhaul", fed: AMD_FED_ID, budget: 240000, status: "COMPLETED", skillTrade: "Plumbing", daysAgo: 120 },
    { name: "Satellite Residential Society Exterior Waterproofing", fed: AMD_FED_ID, budget: 350000, status: "IN_PROGRESS", skillTrade: "Painting", daysAgo: 20 },
    { name: "Surat Textile Market Central Duct & Piping Overhaul", fed: SUR_FED_ID, budget: 420000, status: "IN_PROGRESS", skillTrade: "Plumbing", daysAgo: 15 },
    { name: "Alkapuri Corporate Tower Electrical Modernization", fed: VAD_FED_ID, budget: 210000, status: "COMPLETED", skillTrade: "Electrical", daysAgo: 90 },
    { name: "Gandhinagar IT SEZ Campus Deep Clean Protocol", fed: GANDHI_FED_ID, budget: 160000, status: "COMPLETED", skillTrade: "Cleaning", daysAgo: 60 },
    { name: "Rajkot Industrial Estate Motor Wiring Overhaul", fed: RJK_FED_ID, budget: 280000, status: "CONFIRMED", skillTrade: "Electrical", daysAgo: 10 },
    { name: "Bodakdev Community Hall Acoustics & Woodwork", fed: AMD_FED_ID, budget: 175000, status: "UNDER_REVIEW", skillTrade: "Carpentry", daysAgo: 5 },
    { name: "Varachha Cooperative Society Water Tank Automation", fed: SUR_FED_ID, budget: 120000, status: "UNDER_REVIEW", skillTrade: "Plumbing", daysAgo: 3 },
    { name: "Sayajigunj Library Restroom Modernization", fed: VAD_FED_ID, budget: 95000, status: "SUBMITTED", skillTrade: "Plumbing", daysAgo: 1 },
  ];

  let pIdx = 0;
  for (const proj of largeProjectsData) {
    pIdx++;
    const cust = customerList[pIdx % customerList.length];

    const { data: pRow } = await (adminClient.from("project_requests") as any)
      .insert({
        customer_id: cust.id,
        federation_id: proj.fed,
        project_name: proj.name,
        description: `Turnkey cooperative large project execution: ${proj.name}. Multi-worker allocation, certified supervision, and daily progress reporting.`,
        total_budget: proj.budget,
        status: proj.status,
        created_at: getIsoDate(proj.daysAgo, 9, 0),
        updated_at: getIsoDate(Math.max(0, proj.daysAgo - 10), 17, 0),
      })
      .select("id")
      .single();

    if (pRow) {
      // Find matching skill for requirement
      const sk = allSkills?.find((s: any) => s.name.toLowerCase().includes(proj.skillTrade.toLowerCase())) || allSkills![0];

      const { data: reqRow } = await (adminClient.from("project_requirements") as any)
        .insert({
          project_request_id: pRow.id,
          skill_id: sk.id,
          required_workers_count: 4,
          estimated_duration_days: 14,
          created_at: getIsoDate(proj.daysAgo, 9, 30),
        })
        .select("id")
        .single();

      if (reqRow && (proj.status === "COMPLETED" || proj.status === "IN_PROGRESS" || proj.status === "CONFIRMED")) {
        // Allocate 3 workers
        const candidateWorkers = workerPool.filter(w => w.federationId === proj.fed && w.profession.includes(proj.skillTrade)).slice(0, 3);

        for (const cw of candidateWorkers) {
          await (adminClient.from("project_allocations") as any).insert({
            project_request_id: pRow.id,
            requirement_id: reqRow.id,
            worker_id: cw.id,
            allocated_at: getIsoDate(proj.daysAgo, 10, 0),
            status: proj.status === "COMPLETED" ? "COMPLETED" : "ASSIGNED",
            created_at: getIsoDate(proj.daysAgo, 10, 0),
          });

          if (proj.status === "IN_PROGRESS") {
            // Mark worker as legitimately BUSY
            await (adminClient.from("workers") as any)
              .update({ availability_status: "BUSY" })
              .eq("id", cw.id);
          }
        }
      }
    }
  }

  console.log(`    10 Large Projects configured.`);

  // -------------------------------------------------------------------------
  // STEP 10: REALISTIC NOTIFICATIONS FOR ALL 4 ROLES
  // -------------------------------------------------------------------------
  console.log("\n--> Step 10: Seeding realistic notifications for all 4 roles...");

  const notificationsData = [
    // Customer (Prince Prajapati)
    { profileId: PRINCE_CUSTOMER_PROFILE_ID, title: "Booking Confirmed", message: "Your plumbing service booking BK-2026-10341 with Ravi Patel is confirmed.", type: "booking" },
    { profileId: PRINCE_CUSTOMER_PROFILE_ID, title: "Technician Started Service", message: "Ravi Patel has verified OTP 4826 and started your plumbing diagnostics.", type: "booking" },
    { profileId: PRINCE_CUSTOMER_PROFILE_ID, title: "Invoice Paid", message: "Payment of ₹531 via UPI received. Invoice INV-2026-10335 is now paid.", type: "payment" },
    { profileId: PRINCE_CUSTOMER_PROFILE_ID, title: "Grievance Resolved", message: "Your complaint KS-GRV-2026-2001 has been marked resolved by cooperative admin.", type: "grievance" },

    // Worker (Ravi Patel)
    { profileId: RAVI_WORKER_PROFILE_ID, title: "Active Job In Progress", message: "Ongoing plumbing service for Prince Prajapati at Satellite, Ahmedabad.", type: "job" },
    { profileId: RAVI_WORKER_PROFILE_ID, title: "Weekly Payout Credited", message: "Weekly earnings of ₹4,150 have been transferred to your registered bank account.", type: "payout" },
    { profileId: RAVI_WORKER_PROFILE_ID, title: "KaushalGrow Recommended", message: "Learn advanced safety protocols in 'Electrical Safety Basics' on KaushalGrow.", type: "training" },
    { profileId: RAVI_WORKER_PROFILE_ID, title: "High Demand Notice", message: "Plumbing service requests in Ahmedabad have increased by 38% this week.", type: "demand" },

    // Federation Admin (federation@example.com)
    { profileId: AMD_FED_ID, title: "Workforce Allocation Recommendation", message: "37-job demand gap detected in Plumbing. 4 candidate craftsmen available in Vadodara.", type: "workforce" },
    { profileId: AMD_FED_ID, title: "Project Milestones Approved", message: "Large Project 'Satellite Residential Society Exterior Waterproofing' milestone verified.", type: "project" },
    { profileId: AMD_FED_ID, title: "Monthly Welfare Fund Contribution", message: "₹18,500 deposited into District Health & Pension Fund for 32 active members.", type: "welfare" },

    // Super Admin
    { profileId: AMD_FED_ID, title: "Statewide Cooperative Demand Alert", message: "Elevated service requests recorded across Ahmedabad and Surat federations.", type: "system" },
    { profileId: AMD_FED_ID, title: "Fair Wage Compliance Audit", message: "All 5 active cooperative federations are adhering to statutory baseline hourly wages.", type: "compliance" },
  ];

  for (const n of notificationsData) {
    await (adminClient.from("notifications") as any).insert({
      profile_id: n.profileId,
      title: n.title,
      message: n.message,
      type: n.type,
      is_read: false,
      created_at: getIsoDate(1, 10, 0),
    });
  }

  console.log(`    Notifications seeded.`);
  console.log("\n================================================================================");
  console.log("PRODUCTION DATA SEED COMPLETE! RUNNING VALIDATION...");
  console.log("================================================================================\n");
}

runProductionSeed().catch((err) => {
  console.error("FATAL SEED ERROR:", err);
  process.exit(1);
});

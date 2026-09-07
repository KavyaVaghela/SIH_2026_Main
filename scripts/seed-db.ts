import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...vals] = trimmed.split("=");
        if (key && vals.length > 0) {
          process.env[key.trim()] = vals.join("=").trim();
        }
      }
    }
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const secretKey = process.env.SUPABASE_SECRET_KEY || "";

if (!supabaseUrl || !secretKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// UUID Constants
const FED_AHMEDABAD = "a0000000-0000-0000-0000-000000000001";
const FED_PUNE = "a0000000-0000-0000-0000-000000000002";

const CUST_ID = "b0000000-0000-0000-0000-000000000001";
const WRK_USR_1 = "b0000000-0000-0000-0000-000000000002";
const WRK_USR_2 = "b0000000-0000-0000-0000-000000000003";
const WRK_USR_3 = "b0000000-0000-0000-0000-000000000004";
const WRK_USR_4 = "b0000000-0000-0000-0000-000000000005";

const WRK_1 = "w0000000-0000-0000-0000-000000000001";
const WRK_2 = "w0000000-0000-0000-0000-000000000002";
const WRK_3 = "w0000000-0000-0000-0000-000000000003";
const WRK_4 = "w0000000-0000-0000-0000-000000000004";

const ADDR_HOME = "c0000000-0000-0000-0000-000000000001";
const ADDR_OFFICE = "c0000000-0000-0000-0000-000000000002";

const CAT_PLUMBING = "d0000000-0000-0000-0000-000000000001";
const CAT_ELECTRICAL = "d0000000-0000-0000-0000-000000000002";
const CAT_CARPENTRY = "d0000000-0000-0000-0000-000000000003";
const CAT_PAINTING = "d0000000-0000-0000-0000-000000000004";
const CAT_CLEANING = "d0000000-0000-0000-0000-000000000005";
const CAT_APPLIANCE = "d0000000-0000-0000-0000-000000000006";

const SVC_PLUMB_LEAK = "e0000000-0000-0000-0000-000000000001";
const SVC_ELEC_SHORT = "e0000000-0000-0000-0000-000000000002";
const SVC_CARP_LOCK = "e0000000-0000-0000-0000-000000000003";
const SVC_PAINT_ROOM = "e0000000-0000-0000-0000-000000000004";
const SVC_CLEAN_DEEP = "e0000000-0000-0000-0000-000000000005";

async function seedUserAuth(id: string, email: string, name: string) {
  try {
    const { data: existing } = await supabase.auth.admin.getUserById(id);
    if (existing?.user) {
      console.log(`Auth user '${email}' already exists.`);
      return;
    }
  } catch {
    // Ignore error
  }

  const { error } = await supabase.auth.admin.createUser({
    id,
    email,
    password: "Password123!",
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  if (error && !error.message.includes("already exists")) {
    console.warn(`Auth user create warning for ${email}: ${error.message}`);
  } else {
    console.log(`Created Auth user: ${email} (${id})`);
  }
}

async function main() {
  console.log("=== POPULATING REAL SUPABASE DEVELOPMENT SEED DATA ===");

  // 1. Auth Users
  console.log("\n1. Seeding Auth Users...");
  await seedUserAuth(CUST_ID, "ravi.patel@example.com", "Ravi Patel");
  await seedUserAuth(WRK_USR_1, "ramesh.verma@example.com", "Ramesh Verma");
  await seedUserAuth(WRK_USR_2, "sunita.sharma@example.com", "Sunita Sharma");
  await seedUserAuth(WRK_USR_3, "vikram.patel@example.com", "Vikram Patel");
  await seedUserAuth(WRK_USR_4, "priya.solanki@example.com", "Priya Solanki");

  // 2. Federations
  console.log("\n2. Seeding Federations...");
  const { error: fedErr } = await supabase.from("federations").upsert(
    [
      {
        id: FED_AHMEDABAD,
        name: "Satellite Artisans Cooperative Society",
        code: "FED-AHM-01",
        gst_number: "24AAACS1234A1Z1",
        registration_number: "REG/GJ/AHM/2024/001",
        state: "Gujarat",
        city: "Ahmedabad",
        address: "102 Cooperative Chambers, Satellite, Ahmedabad",
        contact_email: "contact@satellitecoop.in",
        contact_phone: "+919825000001",
        service_region: "Ahmedabad Urban & Outer Ring Road",
        is_active: true,
      },
      {
        id: FED_PUNE,
        name: "Pune Household Workers Service Cooperative",
        code: "FED-PUNE-01",
        gst_number: "27AAACP1234A1Z1",
        registration_number: "REG/MH/PUNE/2024/001",
        state: "Maharashtra",
        city: "Pune",
        address: "405 Seva Towers, Shivajinagar, Pune",
        contact_email: "contact@puneworkers.coop",
        contact_phone: "+919822000001",
        service_region: "Pune Metropolitan Area",
        is_active: true,
      },
    ],
    { onConflict: "id" }
  );
  if (fedErr) console.error("Federation seed error:", fedErr);
  else console.log("✓ Federations seeded.");

  // 3. Profiles
  console.log("\n3. Seeding Profiles...");
  const { error: profErr } = await supabase.from("profiles").upsert(
    [
      {
        id: CUST_ID,
        role: "CUSTOMER",
        full_name: "Ravi Patel",
        phone: "+91 98250 11021",
        email: "ravi.patel@example.com",
        is_active: true,
      },
      {
        id: WRK_USR_1,
        role: "WORKER",
        full_name: "Ramesh Verma",
        phone: "+91 98251 22001",
        email: "ramesh.verma@example.com",
        is_active: true,
      },
      {
        id: WRK_USR_2,
        role: "WORKER",
        full_name: "Sunita Sharma",
        phone: "+91 98251 22002",
        email: "sunita.sharma@example.com",
        is_active: true,
      },
      {
        id: WRK_USR_3,
        role: "WORKER",
        full_name: "Vikram Patel",
        phone: "+91 98251 22003",
        email: "vikram.patel@example.com",
        is_active: true,
      },
      {
        id: WRK_USR_4,
        role: "WORKER",
        full_name: "Priya Solanki",
        phone: "+91 98251 22004",
        email: "priya.solanki@example.com",
        is_active: true,
      },
    ],
    { onConflict: "id" }
  );
  if (profErr) console.error("Profiles seed error:", profErr);
  else console.log("✓ Profiles seeded.");

  // 4. Customer Addresses
  console.log("\n4. Seeding Customer Addresses...");
  const { error: addrErr } = await supabase.from("addresses").upsert(
    [
      {
        id: ADDR_HOME,
        profile_id: CUST_ID,
        title: "Home",
        address_line1: "Flat 402, Shivam Apartments",
        address_line2: "Near ISRO Colony, Satellite",
        city: "Ahmedabad",
        state: "Gujarat",
        postal_code: "380015",
        latitude: 23.0300,
        longitude: 72.5178,
        is_default: true,
      },
      {
        id: ADDR_OFFICE,
        profile_id: CUST_ID,
        title: "Office",
        address_line1: "Suite 804, Pinnacle Business Park",
        address_line2: "SG Highway, Prahlad Nagar",
        city: "Ahmedabad",
        state: "Gujarat",
        postal_code: "380051",
        latitude: 23.0120,
        longitude: 72.5030,
        is_default: false,
      },
    ],
    { onConflict: "id" }
  );
  if (addrErr) console.error("Addresses seed error:", addrErr);
  else console.log("✓ Addresses seeded.");

  // 5. Service Categories
  console.log("\n5. Seeding Service Categories...");
  const { error: catErr } = await supabase.from("service_categories").upsert(
    [
      { id: CAT_PLUMBING, name: "Plumbing", description: "Water pipe leakage, bathroom fittings & drainage repair", icon_name: "Droplets", is_active: true },
      { id: CAT_ELECTRICAL, name: "Electrical Services", description: "Wiring, switchboard repair, MCB trip fix & light installations", icon_name: "Zap", is_active: true },
      { id: CAT_CARPENTRY, name: "Carpentry & Locks", description: "Door lock repairs, custom furniture assembly & wooden fixtures", icon_name: "Hammer", is_active: true },
      { id: CAT_PAINTING, name: "Painting & Waterproofing", description: "Full room repainting, exterior coating & wall leak isolation", icon_name: "Paintbrush", is_active: true },
      { id: CAT_CLEANING, name: "Cleaning & Sanitation", description: "Deep 2BHK house cleaning, kitchen steam clean & sofa sanitization", icon_name: "Sparkles", is_active: true },
      { id: CAT_APPLIANCE, name: "Appliance Repair", description: "AC gas refill, refrigerator repair & washing machine maintenance", icon_name: "Wrench", is_active: true },
    ],
    { onConflict: "id" }
  );
  if (catErr) console.error("Service Categories seed error:", catErr);
  else console.log("✓ Service Categories seeded.");

  // 6. Services
  console.log("\n6. Seeding Services...");
  const { error: svcErr } = await supabase.from("services").upsert(
    [
      { id: SVC_PLUMB_LEAK, category_id: CAT_PLUMBING, title: "Tap Leakage & Pipeline Repair", description: "Fixing dripping taps, pipe leakages, and valve replacements.", base_price: 350.0, minimum_visit_charge: 200.0, price_unit: "per_hour", is_active: true },
      { id: SVC_ELEC_SHORT, category_id: CAT_ELECTRICAL, title: "Electrical Short Circuit Diagnosis", description: "High-voltage spark inspection, MCB replacement, and wiring fix.", base_price: 450.0, minimum_visit_charge: 250.0, price_unit: "per_hour", is_active: true },
      { id: SVC_CARP_LOCK, category_id: CAT_CARPENTRY, title: "Door Lock & Handle Replacement", description: "Main door lock Repair, mortise handle replacement & key fix.", base_price: 400.0, minimum_visit_charge: 200.0, price_unit: "per_hour", is_active: true },
      { id: SVC_PAINT_ROOM, category_id: CAT_PAINTING, title: "Full Room Wall Repainting", description: "Emulsion paint coating, primer application & wall touchups.", base_price: 1200.0, minimum_visit_charge: 500.0, price_unit: "per_service", is_active: true },
      { id: SVC_CLEAN_DEEP, category_id: CAT_CLEANING, title: "Full 2BHK Deep Sanitization", description: "Floor scrubbing, window cleaning, and high-pressure steam sanitization.", base_price: 1800.0, minimum_visit_charge: 500.0, price_unit: "per_service", is_active: true },
    ],
    { onConflict: "id" }
  );
  if (svcErr) console.error("Services seed error:", svcErr);
  else console.log("✓ Services seeded.");

  // 7. Workers
  console.log("\n7. Seeding Workers...");
  const { error: wrkErr } = await supabase.from("workers").upsert(
    [
      {
        id: WRK_1,
        profile_id: WRK_USR_1,
        federation_id: FED_AHMEDABAD,
        account_status: "ACTIVE",
        availability_status: "AVAILABLE",
        verification_status: "verified",
        profession: "Master Plumber",
        hourly_rate: 350.0,
        experience_years: 8,
        service_radius_km: 15.0,
        current_latitude: 23.0280,
        current_longitude: 72.5150,
      },
      {
        id: WRK_2,
        profile_id: WRK_USR_2,
        federation_id: FED_AHMEDABAD,
        account_status: "ACTIVE",
        availability_status: "AVAILABLE",
        verification_status: "verified",
        profession: "Senior Electrician",
        hourly_rate: 400.0,
        experience_years: 6,
        service_radius_km: 15.0,
        current_latitude: 23.0320,
        current_longitude: 72.5200,
      },
      {
        id: WRK_3,
        profile_id: WRK_USR_3,
        federation_id: FED_AHMEDABAD,
        account_status: "ACTIVE",
        availability_status: "AVAILABLE",
        verification_status: "verified",
        profession: "Master Carpenter",
        hourly_rate: 450.0,
        experience_years: 10,
        service_radius_km: 20.0,
        current_latitude: 23.0250,
        current_longitude: 72.5100,
      },
      {
        id: WRK_4,
        profile_id: WRK_USR_4,
        federation_id: FED_AHMEDABAD,
        account_status: "ACTIVE",
        availability_status: "AVAILABLE",
        verification_status: "verified",
        profession: "Sanitation Specialist",
        hourly_rate: 300.0,
        experience_years: 5,
        service_radius_km: 12.0,
        current_latitude: 23.0310,
        current_longitude: 72.5180,
      },
    ],
    { onConflict: "id" }
  );
  if (wrkErr) console.error("Workers seed error:", wrkErr);
  else console.log("✓ Workers seeded.");

  // 8. Bookings
  console.log("\n8. Seeding Bookings...");
  const { error: bkErr } = await supabase.from("bookings").upsert(
    [
      {
        id: "f0000000-0000-0000-0000-000000000001",
        booking_number: "KS-2026-8091",
        customer_id: CUST_ID,
        worker_id: WRK_1,
        service_id: SVC_PLUMB_LEAK,
        federation_id: FED_AHMEDABAD,
        address_id: ADDR_HOME,
        status: "BOOKING_CONFIRMED",
        problem_description: "Water pipe under kitchen sink leaking continuously.",
        otp_code: "940218",
        scheduled_start_at: new Date().toISOString(),
        scheduled_end_at: new Date(Date.now() + 2 * 3600000).toISOString(),
        total_amount: 550.0,
        platform_fee: 27.5,
        worker_earnings: 522.5,
      },
    ],
    { onConflict: "id" }
  );
  if (bkErr) console.error("Bookings seed error:", bkErr);
  else console.log("✓ Bookings seeded.");

  console.log("\n=============================================");
  console.log("SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=============================================");
}

main().catch(console.error);

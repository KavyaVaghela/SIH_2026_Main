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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper for deterministic random offset within radius
function offsetCoords(baseLat: number, baseLng: number, radiusKm: number, seedIdx: number) {
  // 1 deg lat ~ 111 km, 1 deg lng ~ 111 * cos(lat) km
  const angle = (seedIdx * 137.5) * (Math.PI / 180);
  const dist = ((seedIdx % 5) + 1) * (radiusKm / 5);
  const dLat = (dist * Math.cos(angle)) / 111;
  const dLng = (dist * Math.sin(angle)) / (111 * Math.cos(baseLat * (Math.PI / 180)));
  return {
    latitude: Number((baseLat + dLat).toFixed(6)),
    longitude: Number((baseLng + dLng).toFixed(6)),
  };
}

async function seedSuperAdminRealData() {
  console.log("================================================================================");
  console.log("PHASE 2: REAL DATA SEEDING ACROSS MULTIPLE INDIAN REGIONS");
  console.log("================================================================================\n");

  // 1. Fetch available services and skills
  const { data: services } = await adminClient.from("services").select("id, title, category_id, base_price");
  if (!services || services.length === 0) {
    throw new Error("No services found in database! Ensure base catalog exists.");
  }
  const { data: skills } = await adminClient.from("skills").select("id, name");
  const skillMap = new Map<string, string>();
  skills?.forEach(s => skillMap.set(s.name.toLowerCase().trim(), s.id));

  // Service lookup helper
  function findService(namePartial: string) {
    return services!.find(s => s.title.toLowerCase().includes(namePartial.toLowerCase())) || services![0];
  }

  // 2. Region & Federation Specifications
  const federationsSpec = [
    {
      code: "FED-MUM-05",
      name: "Mumbai Metropolis Labor & Artisan Guild",
      gst: "27AAAAA1234A1Z1",
      reg: "MAH-MUM-COOP-2024-005",
      state: "Maharashtra",
      city: "Mumbai",
      address: "401 Dadar Commercial Complex, Senapati Bapat Marg, Mumbai",
      email: "contact@mumbaiguild.org",
      phone: "+91 22 2410 0005",
      region: "Mumbai Urban & Suburban",
      lat: 19.0760,
      lng: 72.8777,
      isActive: true,
      status: "ACTIVE",
      adminEmail: "admin.mumbai@example.com",
      adminName: "Santosh Deshmukh",
    },
    {
      code: "FED-BLR-06",
      name: "Bengaluru Urban Artisans Cooperative",
      gst: "29BBBBB2345B1Z2",
      reg: "KAR-BLR-COOP-2024-006",
      state: "Karnataka",
      city: "Bengaluru",
      address: "205 Indiranagar 100ft Road, Bengaluru",
      email: "contact@blrartisans.org",
      phone: "+91 80 2520 0006",
      region: "Bengaluru Metro",
      lat: 12.9716,
      lng: 77.5946,
      isActive: true,
      status: "ACTIVE",
      adminEmail: "admin.bengaluru@example.com",
      adminName: "Kavitha Rao",
    },
    {
      code: "FED-DEL-07",
      name: "Delhi NCR Capital Services Cooperative",
      gst: "07CCCCC3456C1Z3",
      reg: "DL-NCR-COOP-2024-007",
      state: "Delhi NCR",
      city: "Delhi",
      address: "12 Connaught Place, New Delhi",
      email: "info@delhicoop.org",
      phone: "+91 11 2341 0007",
      region: "Delhi & NCR Region",
      lat: 28.6139,
      lng: 77.2090,
      isActive: true,
      status: "ACTIVE",
      adminEmail: "admin.delhi@example.com",
      adminName: "Rajeshwar Sharma",
    },
    {
      code: "FED-HYD-08",
      name: "Hyderabad Deccan Skilled Labor Cooperative",
      gst: "36DDDDD4567D1Z4",
      reg: "TS-HYD-COOP-2024-008",
      state: "Telangana",
      city: "Hyderabad",
      address: "88 Madhapur IT Corridor, Hyderabad",
      email: "support@hyderabadcoop.org",
      phone: "+91 40 2311 0008",
      region: "Hyderabad Metropolitan Area",
      lat: 17.3850,
      lng: 78.4867,
      isActive: true,
      status: "ACTIVE",
      adminEmail: "admin.hyderabad@example.com",
      adminName: "Venkat Reddy",
    },
    {
      code: "FED-PUN-09",
      name: "Pune Industrial & Home Technicians Guild",
      gst: "27EEEEE5678E1Z5",
      reg: "MAH-PUN-COOP-2024-009",
      state: "Maharashtra",
      city: "Pune",
      address: "55 FC Road, Shivajinagar, Pune",
      email: "contact@punetechguild.org",
      phone: "+91 20 2553 0009",
      region: "Pune & Pimpri-Chinchwad",
      lat: 18.5204,
      lng: 73.8567,
      isActive: true,
      status: "ACTIVE",
      adminEmail: "admin.pune@example.com",
      adminName: "Nitin Kulkarni",
    },
    {
      code: "FED-JAI-10",
      name: "Rajasthan Heritage Crafts & Services Federation",
      gst: "08FFFFF6789F1Z6",
      reg: "RAJ-JAI-COOP-2024-010",
      state: "Rajasthan",
      city: "Jaipur",
      address: "102 MI Road, Pink City, Jaipur",
      email: "info@rajasthancoop.org",
      phone: "+91 141 237 0010",
      region: "Jaipur & North Rajasthan",
      lat: 26.9124,
      lng: 75.7873,
      isActive: true,
      status: "ACTIVE",
      adminEmail: "admin.jaipur@example.com",
      adminName: "Mahendra Singh Rathore",
    },
    {
      code: "FED-IND-11",
      name: "Central India Skilled Workers Federation",
      gst: "23GGGGG7890G1Z7",
      reg: "MP-IND-COOP-2024-011",
      state: "Madhya Pradesh",
      city: "Indore",
      address: "74 Vijay Nagar Square, Indore",
      email: "support@centralworkers.org",
      phone: "+91 731 254 0011",
      region: "Malwa & Central MP",
      lat: 22.7196,
      lng: 75.8577,
      isActive: true,
      status: "ACTIVE",
      adminEmail: "admin.indore@example.com",
      adminName: "Anand Verma",
    },
    {
      code: "FED-KOL-12",
      name: "Greater Kolkata Service Workers Cooperative",
      gst: "19HHHHH8901H1Z8",
      reg: "WB-KOL-COOP-2024-012",
      state: "West Bengal",
      city: "Kolkata",
      address: "33 Salt Lake Sector V, Kolkata",
      email: "contact@kolkatacoop.org",
      phone: "+91 33 2357 0012",
      region: "Kolkata Metropolitan Area",
      lat: 22.5726,
      lng: 88.3639,
      isActive: true,
      status: "ACTIVE",
      adminEmail: "admin.kolkata@example.com",
      adminName: "Subhashis Banerjee",
    },
    {
      code: "FED-LKO-13",
      name: "Awadh Technicians & Artisans Cooperative",
      gst: "09IIIII9012I1Z9",
      reg: "UP-LKO-COOP-2024-013",
      state: "Uttar Pradesh",
      city: "Lucknow",
      address: "18 Hazratganj, Lucknow",
      email: "info@awadhcoop.org",
      phone: "+91 522 223 0013",
      region: "Awadh & Central UP",
      lat: 26.8467,
      lng: 80.9462,
      isActive: true,
      status: "ACTIVE",
      adminEmail: "admin.lucknow@example.com",
      adminName: "Zafar Ali Khan",
    },
    {
      code: "FED-RJK-14",
      name: "Saurashtra Skilled Workers Guild",
      gst: "24JJJJJ0123J1Z0",
      reg: "GUJ-RJK-COOP-2024-014",
      state: "Gujarat",
      city: "Rajkot",
      address: "50 Kalawad Road, Rajkot",
      email: "contact@saurashtraworkers.org",
      phone: "+91 281 246 0014",
      region: "Saurashtra Region",
      lat: 22.3039,
      lng: 70.8022,
      isActive: false, // PENDING Society verification for real Super Admin alert!
      status: "PENDING",
      adminEmail: "admin.rajkot@example.com",
      adminName: "Hiteshbhai Chawda",
    },
  ];

  // Helper to ensure Auth User
  const { data: existingAuthData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
  const authUserMap = new Map<string, string>();
  existingAuthData?.users?.forEach(u => {
    if (u.email) authUserMap.set(u.email.toLowerCase(), u.id);
  });

  async function ensureAuthUser(email: string, fullName: string, role: string, phone: string): Promise<string> {
    const existingId = authUserMap.get(email.toLowerCase());
    if (existingId) return existingId;

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password: "Password123!",
      email_confirm: true,
      user_metadata: { full_name: fullName, role, phone },
    });

    if (error || !data?.user) {
      throw new Error(`Failed to create auth user ${email}: ${error?.message}`);
    }

    authUserMap.set(email.toLowerCase(), data.user.id);
    return data.user.id;
  }

  // 3. Upsert Federations and Federation Admins
  const federationDbMap = new Map<string, string>(); // code -> federation_id

  for (const f of federationsSpec) {
    let fedId: string;
    const { data: existingFed } = await adminClient.from("federations").select("id").eq("code", f.code).maybeSingle();
    if (existingFed) {
      fedId = existingFed.id;
      await adminClient.from("federations").update({
        name: f.name,
        state: f.state,
        city: f.city,
        address: f.address,
        gst_number: f.gst,
        registration_number: f.reg,
        contact_email: f.email,
        contact_phone: f.phone,
        service_region: f.region,
        is_active: f.isActive,
        status: f.status,
      }).eq("id", fedId);
    } else {
      const { data: newFed, error: fErr } = await adminClient.from("federations").insert({
        code: f.code,
        name: f.name,
        state: f.state,
        city: f.city,
        address: f.address,
        gst_number: f.gst,
        registration_number: f.reg,
        contact_email: f.email,
        contact_phone: f.phone,
        service_region: f.region,
        is_active: f.isActive,
        status: f.status,
      }).select("id").single();

      if (fErr || !newFed) throw new Error(`Error inserting federation ${f.name}: ${fErr?.message}`);
      fedId = newFed.id;
    }
    federationDbMap.set(f.code, fedId);

    // Create / update federation admin
    const adminUserId = await ensureAuthUser(f.adminEmail, f.adminName, "FEDERATION_ADMIN", f.phone);
    await adminClient.from("profiles").upsert({
      id: adminUserId,
      full_name: f.adminName,
      email: f.adminEmail,
      phone: f.phone,
      role: "FEDERATION_ADMIN",
      is_active: true,
    }, { onConflict: "id" });

    console.log(`✓ Federation synced: [${f.code}] ${f.name} (${f.city}, ${f.state})`);
  }

  // 4. Seed Workers across all new federations
  interface WorkerBlueprint {
    email: string;
    fullName: string;
    phone: string;
    profession: string;
    skills: string[];
    hourlyRate: number;
    experienceYears: number;
    fedCode: string;
    isPendingKyc?: boolean;
  }

  const workersSpec: WorkerBlueprint[] = [
    // Mumbai (FED-MUM-05)
    { email: "ganesh.jadhav.mum@example.com", fullName: "Ganesh Jadhav", phone: "+91 98200 11001", profession: "Electrician", skills: ["Electrical", "Wiring", "Switch/Socket Repair"], hourlyRate: 450, experienceYears: 9, fedCode: "FED-MUM-05" },
    { email: "anil.kamble.mum@example.com", fullName: "Anil Kamble", phone: "+91 98200 11002", profession: "Plumber", skills: ["Plumbing", "Tap Repair", "Pipe Leakage"], hourlyRate: 400, experienceYears: 7, fedCode: "FED-MUM-05" },
    { email: "sunil.more.mum@example.com", fullName: "Sunil More", phone: "+91 98200 11003", profession: "Carpenter", skills: ["Carpentry", "Door Repair", "Furniture Repair"], hourlyRate: 420, experienceYears: 8, fedCode: "FED-MUM-05" },
    { email: "archana.shinde.mum@example.com", fullName: "Archana Shinde", phone: "+91 98200 11004", profession: "Cleaner", skills: ["Cleaning", "Home Deep Cleaning", "Kitchen Cleaning"], hourlyRate: 380, experienceYears: 5, fedCode: "FED-MUM-05", isPendingKyc: true },

    // Bengaluru (FED-BLR-06)
    { email: "ramesh.gowda.blr@example.com", fullName: "Ramesh Gowda", phone: "+91 98450 22001", profession: "Electrician", skills: ["Electrical", "MCB Repair", "Light Installation"], hourlyRate: 450, experienceYears: 8, fedCode: "FED-BLR-06" },
    { email: "manjunath.k.blr@example.com", fullName: "Manjunath K", phone: "+91 98450 22002", profession: "Plumber", skills: ["Plumbing", "Drainage Blockage", "Pipe Leakage"], hourlyRate: 420, experienceYears: 6, fedCode: "FED-BLR-06" },
    { email: "nagaraj.shetty.blr@example.com", fullName: "Nagaraj Shetty", phone: "+91 98450 22003", profession: "Appliance Technician", skills: ["Appliance Repair", "Appliance Electrical Repair"], hourlyRate: 500, experienceYears: 10, fedCode: "FED-BLR-06" },
    { email: "lakshmi.devi.blr@example.com", fullName: "Lakshmi Devi", phone: "+91 98450 22004", profession: "Painter", skills: ["Painting", "Wall Painting", "Waterproof Coating"], hourlyRate: 400, experienceYears: 7, fedCode: "FED-BLR-06" },

    // Delhi NCR (FED-DEL-07)
    { email: "suresh.kumar.del@example.com", fullName: "Suresh Kumar", phone: "+91 98100 33001", profession: "Electrician", skills: ["Electrical", "Wiring Repair", "MCB/Panel Work"], hourlyRate: 450, experienceYears: 11, fedCode: "FED-DEL-07" },
    { email: "mukesh.sharma.del@example.com", fullName: "Mukesh Sharma", phone: "+91 98100 33002", profession: "Plumber", skills: ["Plumbing", "Bathroom Plumbing", "Tap Repair"], hourlyRate: 400, experienceYears: 8, fedCode: "FED-DEL-07" },
    { email: "deepak.verma.del@example.com", fullName: "Deepak Verma", phone: "+91 98100 33003", profession: "Carpenter", skills: ["Carpentry", "Cabinet Work", "Lock Repair"], hourlyRate: 420, experienceYears: 6, fedCode: "FED-DEL-07" },
    { email: "sarita.singh.del@example.com", fullName: "Sarita Singh", phone: "+91 98100 33004", profession: "Cleaner", skills: ["Cleaning", "Floor Cleaning", "Home Deep Cleaning"], hourlyRate: 350, experienceYears: 5, fedCode: "FED-DEL-07", isPendingKyc: true },

    // Hyderabad (FED-HYD-08)
    { email: "srinivas.rao.hyd@example.com", fullName: "Srinivas Rao", phone: "+91 98490 44001", profession: "Electrician", skills: ["Electrical", "Wiring", "Fan Installation"], hourlyRate: 420, experienceYears: 7, fedCode: "FED-HYD-08" },
    { email: "satyanarayana.hyd@example.com", fullName: "B. Satyanarayana", phone: "+91 98490 44002", profession: "Plumber", skills: ["Plumbing", "Pipe Leakage Repair", "Sink Repair"], hourlyRate: 380, experienceYears: 9, fedCode: "FED-HYD-08" },
    { email: "md.rahim.hyd@example.com", fullName: "Mohammed Rahim", phone: "+91 98490 44003", profession: "Painter", skills: ["Painting", "Interior Painting", "Exterior Painting"], hourlyRate: 390, experienceYears: 8, fedCode: "FED-HYD-08" },

    // Pune (FED-PUN-09)
    { email: "pramod.joshi.pun@example.com", fullName: "Pramod Joshi", phone: "+91 98220 55001", profession: "Electrician", skills: ["Electrical", "Switch/Socket Repair", "Wiring"], hourlyRate: 420, experienceYears: 8, fedCode: "FED-PUN-09" },
    { email: "tushar.patil.pun@example.com", fullName: "Tushar Patil", phone: "+91 98220 55002", profession: "Carpenter", skills: ["Carpentry", "Furniture Repair", "Custom Woodwork"], hourlyRate: 400, experienceYears: 6, fedCode: "FED-PUN-09" },
    { email: "suhas.bhosale.pun@example.com", fullName: "Suhas Bhosale", phone: "+91 98220 55003", profession: "Plumber", skills: ["Plumbing", "Drainage Repair", "Tap Repair"], hourlyRate: 380, experienceYears: 7, fedCode: "FED-PUN-09" },

    // Jaipur (FED-JAI-10)
    { email: "bhanwar.singh.jai@example.com", fullName: "Bhanwar Singh", phone: "+91 98290 66001", profession: "Mason", skills: ["Brickwork", "Plastering", "Wall Repair"], hourlyRate: 450, experienceYears: 12, fedCode: "FED-JAI-10" },
    { email: "om.prakash.jai@example.com", fullName: "Om Prakash Sharma", phone: "+91 98290 66002", profession: "Painter", skills: ["Painting", "Wall Painting", "Touch-up Painting"], hourlyRate: 380, experienceYears: 9, fedCode: "FED-JAI-10" },
    { email: "rameshwar.jai@example.com", fullName: "Rameshwar Gurjar", phone: "+91 98290 66003", profession: "Electrician", skills: ["Electrical", "Wiring Repair"], hourlyRate: 390, experienceYears: 6, fedCode: "FED-JAI-10" },

    // Indore (FED-IND-11)
    { email: "vikas.tiwari.ind@example.com", fullName: "Vikas Tiwari", phone: "+91 98260 77001", profession: "Plumber", skills: ["Plumbing", "Tap Repair", "Pipe Leakage"], hourlyRate: 360, experienceYears: 7, fedCode: "FED-IND-11" },
    { email: "praveen.shukla.ind@example.com", fullName: "Praveen Shukla", phone: "+91 98260 77002", profession: "Electrician", skills: ["Electrical", "Light Installation", "Wiring"], hourlyRate: 380, experienceYears: 8, fedCode: "FED-IND-11" },

    // Kolkata (FED-KOL-12)
    { email: "prosenjit.das.kol@example.com", fullName: "Prosenjit Das", phone: "+91 98300 88001", profession: "Electrician", skills: ["Electrical", "MCB Repair", "Wiring"], hourlyRate: 390, experienceYears: 10, fedCode: "FED-KOL-12" },
    { email: "debashis.sen.kol@example.com", fullName: "Debashis Sen", phone: "+91 98300 88002", profession: "Plumber", skills: ["Plumbing", "Drainage Blockage"], hourlyRate: 370, experienceYears: 7, fedCode: "FED-KOL-12" },

    // Lucknow (FED-LKO-13)
    { email: "arun.pandey.lko@example.com", fullName: "Arun Pandey", phone: "+91 94150 99001", profession: "Plumber", skills: ["Plumbing", "Pipe Leakage", "Tap Repair"], hourlyRate: 360, experienceYears: 6, fedCode: "FED-LKO-13" },
    { email: "mohd.aslam.lko@example.com", fullName: "Mohd. Aslam", phone: "+91 94150 99002", profession: "Carpenter", skills: ["Carpentry", "Door Repair"], hourlyRate: 380, experienceYears: 9, fedCode: "FED-LKO-13" },

    // Rajkot (FED-RJK-14)
    { email: "bharat.makwana.rjk@example.com", fullName: "Bharat Makwana", phone: "+91 98240 00001", profession: "Electrician", skills: ["Electrical", "Wiring"], hourlyRate: 350, experienceYears: 5, fedCode: "FED-RJK-14" },
  ];

  const workerDbMap = new Map<string, { workerId: string; profileId: string; fedId: string; coords: { latitude: number; longitude: number } }>();

  let workerIdx = 0;
  for (const w of workersSpec) {
    workerIdx++;
    const fedSpec = federationsSpec.find(f => f.code === w.fedCode)!;
    const fedId = federationDbMap.get(w.fedCode)!;
    const coords = offsetCoords(fedSpec.lat, fedSpec.lng, 12, workerIdx);

    const userId = await ensureAuthUser(w.email, w.fullName, "WORKER", w.phone);
    await adminClient.from("profiles").upsert({
      id: userId,
      full_name: w.fullName,
      email: w.email,
      phone: w.phone,
      role: "WORKER",
      is_active: true,
    }, { onConflict: "id" });

    // Worker record
    const { data: existingWorker } = await adminClient.from("workers").select("id").eq("profile_id", userId).maybeSingle();
    let workerId: string;

    const workerFields = {
      profile_id: userId,
      federation_id: fedId,
      account_status: "ACTIVE",
      availability_status: "AVAILABLE",
      verification_status: w.isPendingKyc ? "pending_verification" : "verified",
      profession: w.profession,
      hourly_rate: w.hourlyRate,
      experience_years: w.experienceYears,
      service_radius_km: 20.0,
      current_latitude: coords.latitude,
      current_longitude: coords.longitude,
      member_id: `MEM-${w.fedCode.replace("FED-", "")}-${100 + workerIdx}`,
      last_active_at: new Date().toISOString(),
    };

    if (existingWorker) {
      workerId = existingWorker.id;
      await adminClient.from("workers").update(workerFields).eq("id", workerId);
    } else {
      const { data: newW, error: wErr } = await adminClient.from("workers").insert(workerFields).select("id").single();
      if (wErr || !newW) throw new Error(`Error inserting worker ${w.fullName}: ${wErr?.message}`);
      workerId = newW.id;
    }

    // Address
    const { data: existingAddr } = await adminClient.from("addresses").select("id").eq("profile_id", userId).maybeSingle();
    if (!existingAddr) {
      await adminClient.from("addresses").insert({
        profile_id: userId,
        title: "Work Residence",
        address_line1: `Plot ${10 + workerIdx}, Sector ${workerIdx % 10 + 1}`,
        city: fedSpec.city,
        state: fedSpec.state,
        postal_code: "400001",
        latitude: coords.latitude,
        longitude: coords.longitude,
        is_default: true,
      });
    }

    // Skills
    for (const sName of w.skills) {
      const sId = skillMap.get(sName.toLowerCase().trim());
      if (sId) {
        const { data: hasSkill } = await adminClient.from("worker_skills").select("id").eq("worker_id", workerId).eq("skill_id", sId).maybeSingle();
        if (!hasSkill) {
          await adminClient.from("worker_skills").insert({
            worker_id: workerId,
            skill_id: sId,
            proficiency_level: "expert",
          });
        }
      }
    }

    // Availability (Mon-Sun)
    for (let day = 0; day <= 6; day++) {
      const { data: hasAvail } = await adminClient.from("worker_availability").select("id").eq("worker_id", workerId).eq("day_of_week", day).maybeSingle();
      if (!hasAvail) {
        await adminClient.from("worker_availability").insert({
          worker_id: workerId,
          day_of_week: day,
          start_time: "08:00:00",
          end_time: "19:00:00",
          is_available: true,
        });
      }
    }

    workerDbMap.set(w.email, { workerId, profileId: userId, fedId, coords });
    console.log(`✓ Worker synced: ${w.fullName} (${w.profession}) [${fedSpec.city}] (lat: ${coords.latitude}, lng: ${coords.longitude})`);
  }

  // 5. Seed Multi-Region Customers
  interface CustomerBlueprint {
    email: string;
    fullName: string;
    phone: string;
    city: string;
    state: string;
    lat: number;
    lng: number;
    addressLine: string;
  }

  const customersSpec: CustomerBlueprint[] = [
    { email: "rohit.sharma.mum@example.com", fullName: "Rohit Sharma", phone: "+91 98200 99001", city: "Mumbai", state: "Maharashtra", lat: 19.0760, lng: 72.8777, addressLine: "A-502 Oberoi Towers, Goregaon East" },
    { email: "deepika.padukone.blr@example.com", fullName: "Deepika Rao", phone: "+91 98450 99002", city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, addressLine: "Villa 14, Prestige Ozone, Whitefield" },
    { email: "arjun.kapoor.del@example.com", fullName: "Arjun Kapoor", phone: "+91 98100 99003", city: "Delhi", state: "Delhi NCR", lat: 28.6139, lng: 77.2090, addressLine: "Flat 3B, Vasant Vihar Enclave" },
    { email: "ananya.pandey.hyd@example.com", fullName: "Ananya Reddy", phone: "+91 98490 99004", city: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867, addressLine: "Plot 89, Jubilee Hills Road No 36" },
    { email: "virat.patel.pun@example.com", fullName: "Virat Deshmukh", phone: "+91 98220 99005", city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, addressLine: "102 Amanora Park Town, Hadapsar" },
    { email: "priyanka.singh.jai@example.com", fullName: "Priyanka Rathore", phone: "+91 98290 99006", city: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, addressLine: "44 C-Scheme, Subhash Marg" },
    { email: "sachin.gupta.ind@example.com", fullName: "Sachin Gupta", phone: "+91 98260 99007", city: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, addressLine: "201 Scheme 54, PU4 Commercial Belt" },
    { email: "sourav.ganguly.kol@example.com", fullName: "Sourav Mukherjee", phone: "+91 98300 99008", city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, addressLine: "Block CF-21, Salt Lake City" },
    { email: "aditi.sharma.lko@example.com", fullName: "Aditi Sharma", phone: "+91 94150 99009", city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, addressLine: "5 Gomti Nagar Extension" },
  ];

  const customerDbMap = new Map<string, { customerId: string; addressId: string }>();

  for (const c of customersSpec) {
    const userId = await ensureAuthUser(c.email, c.fullName, "CUSTOMER", c.phone);
    await adminClient.from("profiles").upsert({
      id: userId,
      full_name: c.fullName,
      email: c.email,
      phone: c.phone,
      role: "CUSTOMER",
      is_active: true,
    }, { onConflict: "id" });

    // Address
    const { data: existingAddr } = await adminClient.from("addresses").select("id").eq("profile_id", userId).maybeSingle();
    let addressId: string;
    if (existingAddr) {
      addressId = existingAddr.id;
    } else {
      const { data: newAddr, error: aErr } = await adminClient.from("addresses").insert({
        profile_id: userId,
        title: "Home",
        address_line1: c.addressLine,
        city: c.city,
        state: c.state,
        postal_code: "400001",
        latitude: c.lat,
        longitude: c.lng,
        is_default: true,
      }).select("id").single();
      if (aErr || !newAddr) throw new Error(`Error inserting address for ${c.fullName}: ${aErr?.message}`);
      addressId = newAddr.id;
    }

    customerDbMap.set(c.email, { customerId: userId, addressId });
    console.log(`✓ Customer synced: ${c.fullName} (${c.city}, ${c.state})`);
  }

  // 6. Seed Relational Bookings, Invoices, Payments, Reviews, Complaints
  interface BookingSeedSpec {
    bookingNumber: string;
    customerEmail: string;
    workerEmail: string;
    serviceKeyword: string;
    fedCode: string;
    status: string;
    daysAgo: number;
    amount: number;
    desc: string;
    review?: { rating: number; comment: string };
    complaint?: { category: string; desc: string; status: string };
  }

  const bookingsList: BookingSeedSpec[] = [
    // Mumbai Bookings (FED-MUM-05)
    {
      bookingNumber: "BK-SEED-MUM-001",
      customerEmail: "rohit.sharma.mum@example.com",
      workerEmail: "ganesh.jadhav.mum@example.com",
      serviceKeyword: "Wiring",
      fedCode: "FED-MUM-05",
      status: "BOOKING_COMPLETED",
      daysAgo: 45,
      amount: 850,
      desc: "Complete apartment switchboard wiring check and replacement",
      review: { rating: 5, comment: "Punctual, professional and solved the MCB tripping issue perfectly." },
    },
    {
      bookingNumber: "BK-SEED-MUM-002",
      customerEmail: "rohit.sharma.mum@example.com",
      workerEmail: "anil.kamble.mum@example.com",
      serviceKeyword: "Pipe Leakage",
      fedCode: "FED-MUM-05",
      status: "BOOKING_COMPLETED",
      daysAgo: 25,
      amount: 650,
      desc: "Emergency kitchen drain pipe crack repair",
      review: { rating: 5, comment: "Arrived quickly and fixed the pipe cleanly." },
    },
    {
      bookingNumber: "BK-SEED-MUM-003",
      customerEmail: "rohit.sharma.mum@example.com",
      workerEmail: "sunil.more.mum@example.com",
      serviceKeyword: "Door Repair",
      fedCode: "FED-MUM-05",
      status: "SERVICE_STARTED",
      daysAgo: 1,
      amount: 550,
      desc: "Master bedroom wooden door hinge alignment and lock fitting",
    },
    {
      bookingNumber: "BK-SEED-MUM-004",
      customerEmail: "rohit.sharma.mum@example.com",
      workerEmail: "anil.kamble.mum@example.com",
      serviceKeyword: "Tap Repair",
      fedCode: "FED-MUM-05",
      status: "REQUEST_SENT",
      daysAgo: 0,
      amount: 350,
      desc: "Bathroom shower mixer tap dripping",
    },

    // Bengaluru Bookings (FED-BLR-06)
    {
      bookingNumber: "BK-SEED-BLR-001",
      customerEmail: "deepika.padukone.blr@example.com",
      workerEmail: "ramesh.gowda.blr@example.com",
      serviceKeyword: "Light Installation",
      fedCode: "FED-BLR-06",
      status: "BOOKING_COMPLETED",
      daysAgo: 60,
      amount: 900,
      desc: "Balcony and living room LED chandelier installation",
      review: { rating: 5, comment: "Outstanding craftsmanship and neat electrical work." },
    },
    {
      bookingNumber: "BK-SEED-BLR-002",
      customerEmail: "deepika.padukone.blr@example.com",
      workerEmail: "nagaraj.shetty.blr@example.com",
      serviceKeyword: "Appliance",
      fedCode: "FED-BLR-06",
      status: "BOOKING_COMPLETED",
      daysAgo: 30,
      amount: 750,
      desc: "Washing machine water inlet motor repair",
      review: { rating: 4, comment: "Accurate diagnosis and quick part replacement." },
    },
    {
      bookingNumber: "BK-SEED-BLR-003",
      customerEmail: "deepika.padukone.blr@example.com",
      workerEmail: "manjunath.k.blr@example.com",
      serviceKeyword: "Drainage",
      fedCode: "FED-BLR-06",
      status: "ON_THE_WAY",
      daysAgo: 1,
      amount: 600,
      desc: "Utility area drainage blockage clearance",
    },
    {
      bookingNumber: "BK-SEED-BLR-004",
      customerEmail: "deepika.padukone.blr@example.com",
      workerEmail: "lakshmi.devi.blr@example.com",
      serviceKeyword: "Waterproof",
      fedCode: "FED-BLR-06",
      status: "CANCELLED",
      daysAgo: 12,
      amount: 1400,
      desc: "Terrace waterproofing inspection (rescheduled due to rain)",
    },

    // Delhi NCR Bookings (FED-DEL-07)
    {
      bookingNumber: "BK-SEED-DEL-001",
      customerEmail: "arjun.kapoor.del@example.com",
      workerEmail: "suresh.kumar.del@example.com",
      serviceKeyword: "Wiring",
      fedCode: "FED-DEL-07",
      status: "BOOKING_COMPLETED",
      daysAgo: 70,
      amount: 1100,
      desc: "Inverter wiring integration and heavy switchboard replacement",
      review: { rating: 5, comment: "Very experienced electrician, highly recommended." },
    },
    {
      bookingNumber: "BK-SEED-DEL-002",
      customerEmail: "arjun.kapoor.del@example.com",
      workerEmail: "deepak.verma.del@example.com",
      serviceKeyword: "Cabinet",
      fedCode: "FED-DEL-07",
      status: "BOOKING_COMPLETED",
      daysAgo: 18,
      amount: 700,
      desc: "Modular kitchen hydraulic cabinet hinges repair",
      review: { rating: 5, comment: "Fixed all cabinets smoothly." },
      complaint: {
        category: "BILLING",
        desc: "Initial quote differed slightly from hardware receipt, resolved mutually.",
        status: "RESOLVED",
      },
    },
    {
      bookingNumber: "BK-SEED-DEL-003",
      customerEmail: "arjun.kapoor.del@example.com",
      workerEmail: "mukesh.sharma.del@example.com",
      serviceKeyword: "Bathroom Plumbing",
      fedCode: "FED-DEL-07",
      status: "WORKER_REVIEWING",
      daysAgo: 0,
      amount: 800,
      desc: "Bathroom flush valve and health faucet installation",
    },

    // Hyderabad Bookings (FED-HYD-08)
    {
      bookingNumber: "BK-SEED-HYD-001",
      customerEmail: "ananya.pandey.hyd@example.com",
      workerEmail: "srinivas.rao.hyd@example.com",
      serviceKeyword: "Fan",
      fedCode: "FED-HYD-08",
      status: "BOOKING_COMPLETED",
      daysAgo: 40,
      amount: 500,
      desc: "Ceiling fan regreasing and regulator replacement",
      review: { rating: 5, comment: "Polite and quick service." },
    },
    {
      bookingNumber: "BK-SEED-HYD-002",
      customerEmail: "ananya.pandey.hyd@example.com",
      workerEmail: "md.rahim.hyd@example.com",
      serviceKeyword: "Painting",
      fedCode: "FED-HYD-08",
      status: "BOOKING_COMPLETED",
      daysAgo: 14,
      amount: 1800,
      desc: "Living room accent wall premium emulsion painting",
      review: { rating: 4, comment: "Fine finish and clean cleanup." },
    },
    {
      bookingNumber: "BK-SEED-HYD-003",
      customerEmail: "ananya.pandey.hyd@example.com",
      workerEmail: "satyanarayana.hyd@example.com",
      serviceKeyword: "Sink Repair",
      fedCode: "FED-HYD-08",
      status: "SERVICE_STARTED",
      daysAgo: 1,
      amount: 450,
      desc: "Kitchen granite sink drain pipe sealant re-application",
    },

    // Pune Bookings (FED-PUN-09)
    {
      bookingNumber: "BK-SEED-PUN-001",
      customerEmail: "virat.patel.pun@example.com",
      workerEmail: "pramod.joshi.pun@example.com",
      serviceKeyword: "Switch",
      fedCode: "FED-PUN-09",
      status: "BOOKING_COMPLETED",
      daysAgo: 50,
      amount: 600,
      desc: "Air conditioner 25A power socket wiring",
      review: { rating: 5, comment: "Safe installation with standard modular fittings." },
    },
    {
      bookingNumber: "BK-SEED-PUN-002",
      customerEmail: "virat.patel.pun@example.com",
      workerEmail: "tushar.patil.pun@example.com",
      serviceKeyword: "Furniture",
      fedCode: "FED-PUN-09",
      status: "BOOKING_COMPLETED",
      daysAgo: 22,
      amount: 950,
      desc: "Study table and bookshelf assembly and wall anchoring",
      review: { rating: 5, comment: "Sturdy and precisely fitted." },
    },
    {
      bookingNumber: "BK-SEED-PUN-003",
      customerEmail: "virat.patel.pun@example.com",
      workerEmail: "suhas.bhosale.pun@example.com",
      serviceKeyword: "Drainage",
      fedCode: "FED-PUN-09",
      status: "BOOKING_COMPLETED",
      daysAgo: 5,
      amount: 700,
      desc: "Balcony storm water drain unblocking",
      complaint: {
        category: "SERVICE_QUALITY",
        desc: JSON.stringify({
          description: "Customer flagged slow drain response under heavy rain; requires Super Admin central review.",
          escalation: {
            reason: "Escalated to Super Admin for central arbitration.",
            escalatedAt: new Date().toISOString(),
            escalatedBy: "Nitin Kulkarni (Pune Federation)",
          },
          priority: "HIGH",
        }),
        status: "IN_REVIEW",
      },
    },

    // Jaipur Bookings (FED-JAI-10)
    {
      bookingNumber: "BK-SEED-JAI-001",
      customerEmail: "priyanka.singh.jai@example.com",
      workerEmail: "bhanwar.singh.jai@example.com",
      serviceKeyword: "Plastering",
      fedCode: "FED-JAI-10",
      status: "BOOKING_COMPLETED",
      daysAgo: 35,
      amount: 1200,
      desc: "Boundary wall plaster repair and dampness treatment",
      review: { rating: 5, comment: "Traditional craftsmanship and durable finish." },
    },
    {
      bookingNumber: "BK-SEED-JAI-002",
      customerEmail: "priyanka.singh.jai@example.com",
      workerEmail: "om.prakash.jai@example.com",
      serviceKeyword: "Painting",
      fedCode: "FED-JAI-10",
      status: "BOOKING_COMPLETED",
      daysAgo: 8,
      amount: 1600,
      desc: "Bedroom whitewash and touch-up coat",
      review: { rating: 4, comment: "Clean work and polite behavior." },
    },

    // Indore Bookings (FED-IND-11)
    {
      bookingNumber: "BK-SEED-IND-001",
      customerEmail: "sachin.gupta.ind@example.com",
      workerEmail: "vikas.tiwari.ind@example.com",
      serviceKeyword: "Tap Repair",
      fedCode: "FED-IND-11",
      status: "BOOKING_COMPLETED",
      daysAgo: 28,
      amount: 400,
      desc: "Commercial cabin washroom tap spindle replacement",
      review: { rating: 5, comment: "Fixed in 20 minutes." },
    },
    {
      bookingNumber: "BK-SEED-IND-002",
      customerEmail: "sachin.gupta.ind@example.com",
      workerEmail: "praveen.shukla.ind@example.com",
      serviceKeyword: "Light Installation",
      fedCode: "FED-IND-11",
      status: "BOOKING_COMPLETED",
      daysAgo: 10,
      amount: 650,
      desc: "Warehouse LED spotlight mounting",
      review: { rating: 5, comment: "Prompt and careful installation." },
    },

    // Kolkata Bookings (FED-KOL-12)
    {
      bookingNumber: "BK-SEED-KOL-001",
      customerEmail: "sourav.ganguly.kol@example.com",
      workerEmail: "prosenjit.das.kol@example.com",
      serviceKeyword: "Electrical",
      fedCode: "FED-KOL-12",
      status: "BOOKING_COMPLETED",
      daysAgo: 42,
      amount: 750,
      desc: "Main distribution board fuse replacement and earthing check",
      review: { rating: 5, comment: "Proper electrical safety protocol followed." },
    },
    {
      bookingNumber: "BK-SEED-KOL-002",
      customerEmail: "sourav.ganguly.kol@example.com",
      workerEmail: "debashis.sen.kol@example.com",
      serviceKeyword: "Drainage",
      fedCode: "FED-KOL-12",
      status: "BOOKING_COMPLETED",
      daysAgo: 15,
      amount: 550,
      desc: "Ground floor bathroom drainage trap cleaning",
      review: { rating: 4, comment: "Efficient and thorough." },
    },

    // Lucknow Bookings (FED-LKO-13)
    {
      bookingNumber: "BK-SEED-LKO-001",
      customerEmail: "aditi.sharma.lko@example.com",
      workerEmail: "arun.pandey.lko@example.com",
      serviceKeyword: "Plumbing",
      fedCode: "FED-LKO-13",
      status: "BOOKING_COMPLETED",
      daysAgo: 33,
      amount: 600,
      desc: "Overhead water tank float ball valve replacement",
      review: { rating: 5, comment: "Solved water overflow problem permanently." },
    },
    {
      bookingNumber: "BK-SEED-LKO-002",
      customerEmail: "aditi.sharma.lko@example.com",
      workerEmail: "mohd.aslam.lko@example.com",
      serviceKeyword: "Door Repair",
      fedCode: "FED-LKO-13",
      status: "BOOKING_COMPLETED",
      daysAgo: 11,
      amount: 500,
      desc: "Main wooden entrance door latch and stopper repair",
      review: { rating: 5, comment: "Solid lock alignment." },
    },
  ];

  console.log(`\n=== Processing ${bookingsList.length} Relational Bookings Across Regions ===`);

  let seededBookingsCount = 0;
  let seededInvoicesCount = 0;
  let seededPaymentsCount = 0;
  let seededReviewsCount = 0;
  let seededComplaintsCount = 0;

  for (const b of bookingsList) {
    const custInfo = customerDbMap.get(b.customerEmail);
    const workerInfo = workerDbMap.get(b.workerEmail);
    const fedId = federationDbMap.get(b.fedCode);
    const service = findService(b.serviceKeyword);

    if (!custInfo || !workerInfo || !fedId || !service) {
      console.warn(`Skipping booking ${b.bookingNumber} due to missing relationship.`);
      continue;
    }

    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - b.daysAgo);
    const isoDate = createdDate.toISOString();

    const platformFee = Math.round(b.amount * 0.1);
    const workerEarnings = b.amount - platformFee;

    // 1. Check or Insert Booking
    const { data: existingB } = await adminClient.from("bookings").select("id").eq("booking_number", b.bookingNumber).maybeSingle();
    let bookingId: string;

    const endDate = new Date(createdDate.getTime() + 2 * 3600 * 1000).toISOString();

    const bookingPayload = {
      booking_number: b.bookingNumber,
      customer_id: custInfo.customerId,
      worker_id: workerInfo.workerId,
      service_id: service.id,
      federation_id: fedId,
      address_id: custInfo.addressId,
      status: b.status,
      problem_description: b.desc,
      otp_code: "4321",
      scheduled_start_at: isoDate,
      scheduled_end_at: endDate,
      actual_start_at: b.status === "BOOKING_COMPLETED" ? isoDate : null,
      actual_end_at: b.status === "BOOKING_COMPLETED" ? endDate : null,
      total_amount: b.amount,
      platform_fee: platformFee,
      worker_earnings: workerEarnings,
      created_at: isoDate,
      updated_at: isoDate,
    };

    if (existingB) {
      bookingId = existingB.id;
      await adminClient.from("bookings").update(bookingPayload).eq("id", bookingId);
    } else {
      const { data: newB, error: bErr } = await adminClient.from("bookings").insert(bookingPayload).select("id").single();
      if (bErr || !newB) {
        console.error(`Failed to insert booking ${b.bookingNumber}:`, bErr?.message);
        continue;
      }
      bookingId = newB.id;
      seededBookingsCount++;
    }

    // 2. Status History
    const { data: hasHistory } = await adminClient.from("booking_status_history").select("id").eq("booking_id", bookingId).maybeSingle();
    if (!hasHistory) {
      await adminClient.from("booking_status_history").insert({
        booking_id: bookingId,
        previous_status: null,
        new_status: b.status,
        changed_by: custInfo.customerId,
        notes: "Booking initiated in platform lifecycle",
        created_at: isoDate,
      });
    }

    // 3. For Completed Bookings: Maintain Valid Invoices and Payments
    if (b.status === "BOOKING_COMPLETED") {
      const invoiceNumber = `INV-${b.bookingNumber.replace("BK-", "")}`;
      const subtotal = b.amount;
      const taxAmount = Math.round(subtotal * 0.18);
      const invoiceTotal = subtotal + taxAmount;

      const { data: existingInv } = await adminClient.from("invoices").select("id").eq("booking_id", bookingId).maybeSingle();
      let invoiceId: string;

      const invoicePayload = {
        invoice_number: invoiceNumber,
        booking_id: bookingId,
        customer_id: custInfo.customerId,
        federation_id: fedId,
        subtotal: subtotal,
        platform_fee: platformFee,
        tax_amount: taxAmount,
        total_amount: invoiceTotal,
        status: "paid",
        issue_date: isoDate,
        due_date: isoDate,
        paid_at: isoDate,
        created_at: isoDate,
      };

      if (existingInv) {
        invoiceId = existingInv.id;
        await adminClient.from("invoices").update(invoicePayload).eq("id", invoiceId);
      } else {
        const { data: newInv, error: invErr } = await adminClient.from("invoices").insert(invoicePayload).select("id").single();
        if (invErr || !newInv) {
          console.error(`Invoice insert failed for ${invoiceNumber}:`, invErr?.message);
          continue;
        }
        invoiceId = newInv.id;
        seededInvoicesCount++;

        // Invoice Item
        await adminClient.from("invoice_items").insert({
          invoice_id: invoiceId,
          description: `${service.title} Service Delivery`,
          quantity: 1,
          unit_price: subtotal,
          amount: subtotal,
          created_at: isoDate,
        });
      }

      // Payment (status 'PAID')
      const paymentNumber = `PAY-${b.bookingNumber.replace("BK-", "")}`;
      const { data: existingPay } = await adminClient.from("payments").select("id").eq("booking_id", bookingId).maybeSingle();

      const paymentPayload = {
        payment_number: paymentNumber,
        invoice_id: invoiceId,
        booking_id: bookingId,
        customer_id: custInfo.customerId,
        amount: invoiceTotal,
        gateway_provider: "RAZORPAY",
        gateway_order_id: `order_${b.bookingNumber.toLowerCase()}`,
        gateway_payment_id: `pay_${b.bookingNumber.toLowerCase()}`,
        status: "PAID",
        paid_at: isoDate,
        created_at: isoDate,
      };

      if (existingPay) {
        await adminClient.from("payments").update(paymentPayload).eq("id", existingPay.id);
      } else {
        const { error: payErr } = await adminClient.from("payments").insert(paymentPayload);
        if (payErr) {
          console.error(`Payment insert failed for ${paymentNumber}:`, payErr.message);
        } else {
          seededPaymentsCount++;
        }
      }

      // Review
      if (b.review) {
        const { data: existingRev } = await adminClient.from("reviews").select("id").eq("booking_id", bookingId).maybeSingle();
        if (!existingRev) {
          await adminClient.from("reviews").insert({
            booking_id: bookingId,
            customer_id: custInfo.customerId,
            worker_id: workerInfo.workerId,
            rating: b.review.rating,
            comment: b.review.comment,
            created_at: isoDate,
          });
          seededReviewsCount++;
        }
      }
    }

    // 4. Complaints (if specified)
    if (b.complaint) {
      const complaintNumber = `CMP-${b.bookingNumber.replace("BK-", "")}`;
      const { data: existingCmp } = await adminClient.from("complaints").select("id").eq("booking_id", bookingId).maybeSingle();

      const cmpPayload = {
        complaint_number: complaintNumber,
        booking_id: bookingId,
        raised_by: custInfo.customerId,
        target_profile_id: workerInfo.profileId,
        category: b.complaint.category,
        description: b.complaint.desc,
        status: b.complaint.status,
        resolution_notes: b.complaint.status === "RESOLVED" ? "Resolved through mutual coordination." : null,
        resolved_at: b.complaint.status === "RESOLVED" ? isoDate : null,
        created_at: isoDate,
      };

      if (existingCmp) {
        await adminClient.from("complaints").update(cmpPayload).eq("id", existingCmp.id);
      } else {
        const { error: cmpErr } = await adminClient.from("complaints").insert(cmpPayload);
        if (cmpErr) {
          console.error(`Complaint insert failed for ${complaintNumber}:`, cmpErr.message);
        } else {
          seededComplaintsCount++;
        }
      }
    }

    console.log(`✓ Booking synced: ${b.bookingNumber} [${b.fedCode}] - ${b.status} (₹${b.amount})`);
  }

  console.log("\n================================================================================");
  console.log("REAL DATA SEEDING COMPLETE!");
  console.log(`New/Synced Bookings: ${seededBookingsCount} (Total list processed: ${bookingsList.length})`);
  console.log(`New/Synced Invoices: ${seededInvoicesCount}`);
  console.log(`New/Synced Payments: ${seededPaymentsCount}`);
  console.log(`New/Synced Reviews: ${seededReviewsCount}`);
  console.log(`New/Synced Complaints: ${seededComplaintsCount}`);
  console.log("================================================================================\n");
}

seedSuperAdminRealData().catch(console.error);

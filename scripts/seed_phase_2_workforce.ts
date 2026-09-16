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

interface SeedWorkerSpec {
  email: string;
  fullName: string;
  phone: string;
  profession: string;
  skills: string[];
  hourlyRate: number;
  experienceYears: number;
  lat: number;
  lng: number;
  area: string;
  postalCode: string;
  memberId: string;
  isNew?: boolean;
  reviews?: Array<{ rating: number; comment: string }>;
}

async function seedPhase2() {
  console.log("================================================================================");
  console.log("SEEDING PHASE 2: SERVICE CATALOGUE SKILLS + 5 WORKERS PER MAJOR CATEGORY");
  console.log("================================================================================\n");

  // 1. Get Categories
  const { data: categories } = await adminClient.from("service_categories").select("id, name");
  const catMap = new Map<string, string>();
  for (const c of categories || []) {
    catMap.set(c.name.toLowerCase().trim(), c.id);
  }

  const plumbingCatId = catMap.get("plumbing")!;
  const electricalCatId = catMap.get("electrical")!;
  const carpentryCatId = (catMap.get("carpentry & woodwork") || catMap.get("carpentry"))!;
  const paintingCatId = catMap.get("painting")!;
  const cleaningCatId = catMap.get("cleaning")!;
  const masonryCatId = catMap.get("masonry")!;

  // 2. Ensure specific skills exist and are linked to proper category_id
  const skillsToEnsure: Array<{ name: string; categoryId: string }> = [
    // Plumbing
    { name: "Plumbing", categoryId: plumbingCatId },
    { name: "Tap Repair", categoryId: plumbingCatId },
    { name: "Pipe Leakage", categoryId: plumbingCatId },
    { name: "Pipe Leakage Repair", categoryId: plumbingCatId },
    { name: "Drainage Blockage", categoryId: plumbingCatId },
    { name: "Drainage Repair", categoryId: plumbingCatId },
    { name: "Bathroom Plumbing", categoryId: plumbingCatId },
    { name: "Sink Repair", categoryId: plumbingCatId },
    { name: "Water Tank Repair", categoryId: plumbingCatId },
    { name: "Toilet Repair", categoryId: plumbingCatId },

    // Electrical
    { name: "Electrical", categoryId: electricalCatId },
    { name: "Wiring", categoryId: electricalCatId },
    { name: "Wiring Repair", categoryId: electricalCatId },
    { name: "Switch/Socket Repair", categoryId: electricalCatId },
    { name: "Fan Repair", categoryId: electricalCatId },
    { name: "Fan Installation", categoryId: electricalCatId },
    { name: "Light Installation", categoryId: electricalCatId },
    { name: "MCB Repair", categoryId: electricalCatId },
    { name: "MCB/Panel Work", categoryId: electricalCatId },
    { name: "Appliance Electrical Repair", categoryId: electricalCatId },

    // Carpentry
    { name: "Carpentry", categoryId: carpentryCatId },
    { name: "Furniture Repair", categoryId: carpentryCatId },
    { name: "Door Repair", categoryId: carpentryCatId },
    { name: "Lock Repair", categoryId: carpentryCatId },
    { name: "Cabinet Work", categoryId: carpentryCatId },
    { name: "Wood Polishing", categoryId: carpentryCatId },
    { name: "Custom Woodwork", categoryId: carpentryCatId },
    { name: "Modular Furniture Assembly", categoryId: carpentryCatId },

    // Painting
    { name: "Painting", categoryId: paintingCatId },
    { name: "Wall Painting", categoryId: paintingCatId },
    { name: "Ceiling Painting", categoryId: paintingCatId },
    { name: "Interior Painting", categoryId: paintingCatId },
    { name: "Exterior Painting", categoryId: paintingCatId },
    { name: "Touch-up Painting", categoryId: paintingCatId },
    { name: "Waterproof Coating", categoryId: paintingCatId },

    // Cleaning
    { name: "Cleaning", categoryId: cleaningCatId },
    { name: "Home Deep Cleaning", categoryId: cleaningCatId },
    { name: "Bathroom Cleaning", categoryId: cleaningCatId },
    { name: "Kitchen Cleaning", categoryId: cleaningCatId },
    { name: "Floor Cleaning", categoryId: cleaningCatId },
    { name: "Move-in/Move-out Cleaning", categoryId: cleaningCatId },

    // Masonry
    { name: "Brickwork", categoryId: masonryCatId },
    { name: "Plastering", categoryId: masonryCatId },
    { name: "Concrete Work", categoryId: masonryCatId },
    { name: "Wall Repair", categoryId: masonryCatId },
  ];

  console.log("Checking and upserting trade skills into public.skills...");
  for (const s of skillsToEnsure) {
    const { data: existing } = await adminClient.from("skills").select("id, category_id").eq("name", s.name).maybeSingle();
    if (!existing) {
      await adminClient.from("skills").insert({ name: s.name, category_id: s.categoryId });
    } else if (!existing.category_id && s.categoryId) {
      await adminClient.from("skills").update({ category_id: s.categoryId }).eq("id", existing.id);
    }
  }

  // Reload skills map
  const { data: allSkills } = await adminClient.from("skills").select("id, name");
  const skillMap = new Map<string, string>();
  for (const sk of allSkills || []) {
    skillMap.set(sk.name.toLowerCase().trim(), sk.id);
  }

  // 3. Get target federation: Ahmedabad Skilled Workers Federation
  const { data: fed } = await adminClient
    .from("federations")
    .select("id")
    .eq("code", "FED-AMD-01")
    .single();

  const federationId = fed?.id || "b765df3b-c418-4a15-b79f-3cbc09e475dc";

  // 4. Define 5 workers per major category (Plumbing, Electrical, Carpentry, Painting, Cleaning)
  const workersToSeed: SeedWorkerSpec[] = [
    // PLUMBING (5 workers with realistic combinations)
    {
      email: "worker@example.com", // existing
      fullName: "Ravi Patel",
      phone: "+91 98250 11021",
      profession: "Plumber",
      skills: ["Plumbing", "Tap Repair", "Pipe Leakage", "Drainage Blockage"],
      hourlyRate: 350,
      experienceYears: 8,
      lat: 23.0325,
      lng: 72.5205,
      area: "Satellite",
      postalCode: "380015",
      memberId: "MEM-AMD-0101",
      reviews: [
        { rating: 5, comment: "Excellent pipe leakage fix, very punctual." },
        { rating: 5, comment: "Top quality tap replacement." },
      ],
    },
    {
      email: "hitesh.solanki@example.com",
      fullName: "Hitesh Solanki",
      phone: "+91 98250 22002",
      profession: "Plumber",
      skills: ["Plumbing", "Pipe Leakage", "Bathroom Plumbing"],
      hourlyRate: 380,
      experienceYears: 7,
      lat: 23.0380,
      lng: 72.5590,
      area: "Navrangpura",
      postalCode: "380009",
      memberId: "MEM-AMD-0102",
      reviews: [{ rating: 4, comment: "Quick response for bathroom drainage." }],
    },
    {
      email: "dinesh.parmar@example.com",
      fullName: "Dinesh Parmar",
      phone: "+91 98250 22003",
      profession: "Plumber",
      skills: ["Plumbing", "Bathroom Plumbing", "Sink Repair"],
      hourlyRate: 320,
      experienceYears: 6,
      lat: 23.0350,
      lng: 72.5280,
      area: "Vastrapur",
      postalCode: "380054",
      memberId: "MEM-AMD-0103",
      reviews: [{ rating: 5, comment: "Neat sink fixture fitting." }],
    },
    {
      email: "rajesh.solanki@example.com",
      fullName: "Rajesh Solanki",
      phone: "+91 98250 22004",
      profession: "Plumber",
      skills: ["Plumbing", "Tap Repair", "Water Tank Repair"],
      hourlyRate: 360,
      experienceYears: 9,
      lat: 23.0420,
      lng: 72.5120,
      area: "Bodakdev",
      postalCode: "380054",
      memberId: "MEM-AMD-0104",
      reviews: [{ rating: 4, comment: "Repaired overhead water tank inlet valve properly." }],
    },
    {
      email: "mahesh.vaghela@example.com",
      fullName: "Mahesh Vaghela",
      phone: "+91 98250 22005",
      profession: "Plumber",
      skills: ["Plumbing", "Drainage Repair", "Pipe Leakage Repair"],
      hourlyRate: 340,
      experienceYears: 5,
      lat: 23.0120,
      lng: 72.5630,
      area: "Paldi",
      postalCode: "380007",
      memberId: "MEM-AMD-0105",
      isNew: true, // Test new worker rating semantics!
    },

    // ELECTRICAL (5 workers)
    {
      email: "amit.sharma.elec@example.com",
      fullName: "Amit Sharma",
      phone: "+91 98250 33001",
      profession: "Electrician",
      skills: ["Electrical", "Wiring", "Switch/Socket Repair"],
      hourlyRate: 350,
      experienceYears: 7,
      lat: 23.0310,
      lng: 72.5270,
      area: "Vastrapur",
      postalCode: "380054",
      memberId: "MEM-AMD-0201",
      reviews: [{ rating: 5, comment: "Resolved complex switchboard spark issue safely." }],
    },
    {
      email: "kiran.patel.elec@example.com",
      fullName: "Kiran Patel",
      phone: "+91 98250 33002",
      profession: "Electrician",
      skills: ["Electrical", "Fan Repair", "Light Installation"],
      hourlyRate: 300,
      experienceYears: 5,
      lat: 23.0390,
      lng: 72.5550,
      area: "Navrangpura",
      postalCode: "380009",
      memberId: "MEM-AMD-0202",
      reviews: [{ rating: 4, comment: "Ceiling fan installation done fast." }],
    },
    {
      email: "sanjay.varma.elec@example.com",
      fullName: "Sanjay Varma",
      phone: "+91 98250 33003",
      profession: "Electrician",
      skills: ["Electrical", "MCB/Panel Work", "Wiring"],
      hourlyRate: 400,
      experienceYears: 10,
      lat: 23.0290,
      lng: 72.5150,
      area: "Satellite",
      postalCode: "380015",
      memberId: "MEM-AMD-0203",
      reviews: [{ rating: 5, comment: "Upgraded main distribution MCB safely." }],
    },
    {
      email: "chetan.joshi.elec@example.com",
      fullName: "Chetan Joshi",
      phone: "+91 98250 33004",
      profession: "Electrician",
      skills: ["Electrical", "Switch/Socket Repair", "Appliance Electrical Repair"],
      hourlyRate: 320,
      experienceYears: 4,
      lat: 23.0150,
      lng: 72.5600,
      area: "Paldi",
      postalCode: "380007",
      memberId: "MEM-AMD-0204",
      isNew: true, // Test new worker rating semantics
    },
    {
      email: "vikram.chauhan.elec@example.com",
      fullName: "Vikram Chauhan",
      phone: "+91 98250 33005",
      profession: "Electrician",
      skills: ["Electrical", "Fan Repair", "Wiring", "MCB/Panel Work"],
      hourlyRate: 380,
      experienceYears: 8,
      lat: 23.0450,
      lng: 72.5080,
      area: "Bodakdev",
      postalCode: "380054",
      memberId: "MEM-AMD-0205",
      reviews: [{ rating: 5, comment: "Excellent thorough electrical work." }],
    },

    // CARPENTRY (5 workers)
    {
      email: "rahul.shah.test@example.com", // existing from Phase 1
      fullName: "Rahul Shah",
      phone: "+91 98251 99887",
      profession: "Master Carpenter",
      skills: ["Carpentry", "Furniture Repair", "Custom Woodwork", "Modular Furniture Assembly"],
      hourlyRate: 420,
      experienceYears: 7,
      lat: 23.0330,
      lng: 72.5210,
      area: "Satellite",
      postalCode: "380015",
      memberId: "MEM-AMD-9988",
      isNew: true, // Verified new worker with 0 reviews
    },
    {
      email: "mukesh.rathod.carp@example.com",
      fullName: "Mukesh Rathod",
      phone: "+91 98250 44002",
      profession: "Carpenter",
      skills: ["Carpentry", "Door Repair", "Lock Repair"],
      hourlyRate: 350,
      experienceYears: 8,
      lat: 23.0370,
      lng: 72.5560,
      area: "Navrangpura",
      postalCode: "380009",
      memberId: "MEM-AMD-0302",
      reviews: [{ rating: 5, comment: "Main door hinge aligned perfectly." }],
    },
    {
      email: "govind.suthar.carp@example.com",
      fullName: "Govind Suthar",
      phone: "+91 98250 44003",
      profession: "Carpenter",
      skills: ["Carpentry", "Cabinet Work", "Furniture Repair"],
      hourlyRate: 380,
      experienceYears: 9,
      lat: 23.0340,
      lng: 72.5290,
      area: "Vastrapur",
      postalCode: "380054",
      memberId: "MEM-AMD-0303",
      reviews: [{ rating: 4, comment: "Repaired hydraulic kitchen cabinet drawer." }],
    },
    {
      email: "bhavin.mistri.carp@example.com",
      fullName: "Bhavin Mistri",
      phone: "+91 98250 44004",
      profession: "Carpenter",
      skills: ["Carpentry", "Wood Polishing", "Custom Woodwork"],
      hourlyRate: 400,
      experienceYears: 11,
      lat: 23.0430,
      lng: 72.5110,
      area: "Bodakdev",
      postalCode: "380054",
      memberId: "MEM-AMD-0304",
      reviews: [{ rating: 5, comment: "Gave antique table a mirror finish." }],
    },
    {
      email: "kishore.panchal.carp@example.com",
      fullName: "Kishore Panchal",
      phone: "+91 98250 44005",
      profession: "Carpenter",
      skills: ["Carpentry", "Furniture Repair", "Door Repair", "Cabinet Work"],
      hourlyRate: 360,
      experienceYears: 6,
      lat: 23.0140,
      lng: 72.5620,
      area: "Paldi",
      postalCode: "380007",
      memberId: "MEM-AMD-0305",
      isNew: true,
    },

    // PAINTING (5 workers)
    {
      email: "pravin.makwana.paint@example.com",
      fullName: "Pravin Makwana",
      phone: "+91 98250 55001",
      profession: "Painter",
      skills: ["Painting", "Wall Painting", "Interior Painting"],
      hourlyRate: 350,
      experienceYears: 7,
      lat: 23.0320,
      lng: 72.5200,
      area: "Satellite",
      postalCode: "380015",
      memberId: "MEM-AMD-0401",
      reviews: [{ rating: 5, comment: "Smooth royal emulsion paint job." }],
    },
    {
      email: "ramesh.barot.paint@example.com",
      fullName: "Ramesh Barot",
      phone: "+91 98250 55002",
      profession: "Painter",
      skills: ["Painting", "Ceiling Painting", "Touch-up Painting"],
      hourlyRate: 300,
      experienceYears: 5,
      lat: 23.0360,
      lng: 72.5570,
      area: "Navrangpura",
      postalCode: "380009",
      memberId: "MEM-AMD-0402",
      reviews: [{ rating: 4, comment: "Ceiling damp patch primed and repainted cleanly." }],
    },
    {
      email: "suresh.thakor.paint@example.com",
      fullName: "Suresh Thakor",
      phone: "+91 98250 55003",
      profession: "Painter",
      skills: ["Painting", "Exterior Painting", "Waterproof Coating"],
      hourlyRate: 380,
      experienceYears: 9,
      lat: 23.0335,
      lng: 72.5275,
      area: "Vastrapur",
      postalCode: "380054",
      memberId: "MEM-AMD-0403",
      reviews: [{ rating: 5, comment: "Weatherproof coat on exterior terrace wall." }],
    },
    {
      email: "jagdish.vaghela.paint@example.com",
      fullName: "Jagdish Vaghela",
      phone: "+91 98250 55004",
      profession: "Painter",
      skills: ["Painting", "Wall Painting", "Touch-up Painting"],
      hourlyRate: 320,
      experienceYears: 4,
      lat: 23.0130,
      lng: 72.5610,
      area: "Paldi",
      postalCode: "380007",
      memberId: "MEM-AMD-0404",
      isNew: true,
    },
    {
      email: "naresh.dabhi.paint@example.com",
      fullName: "Naresh Dabhi",
      phone: "+91 98250 55005",
      profession: "Painter",
      skills: ["Painting", "Interior Painting", "Exterior Painting", "Ceiling Painting"],
      hourlyRate: 370,
      experienceYears: 8,
      lat: 23.0440,
      lng: 72.5100,
      area: "Bodakdev",
      postalCode: "380054",
      memberId: "MEM-AMD-0405",
      reviews: [{ rating: 5, comment: "Full 2BHK interior repaint completed in 2 days." }],
    },

    // CLEANING (5 workers)
    {
      email: "sunita.sharma.clean@example.com",
      fullName: "Sunita Sharma",
      phone: "+91 98250 66001",
      profession: "Cleaner",
      skills: ["Cleaning", "Home Deep Cleaning", "Kitchen Cleaning"],
      hourlyRate: 350,
      experienceYears: 6,
      lat: 23.0315,
      lng: 72.5215,
      area: "Satellite",
      postalCode: "380015",
      memberId: "MEM-AMD-0501",
      reviews: [{ rating: 5, comment: "Spotless kitchen deep cleaning and chimney degrease." }],
    },
    {
      email: "geeta.vaghela.clean@example.com",
      fullName: "Geeta Vaghela",
      phone: "+91 98250 66002",
      profession: "Cleaner",
      skills: ["Cleaning", "Bathroom Cleaning", "Floor Cleaning"],
      hourlyRate: 300,
      experienceYears: 5,
      lat: 23.0375,
      lng: 72.5565,
      area: "Navrangpura",
      postalCode: "380009",
      memberId: "MEM-AMD-0502",
      reviews: [{ rating: 4, comment: "Bathroom tiles descaled cleanly." }],
    },
    {
      email: "bhavna.chauhan.clean@example.com",
      fullName: "Bhavna Chauhan",
      phone: "+91 98250 66003",
      profession: "Cleaner",
      skills: ["Cleaning", "Home Deep Cleaning", "Bathroom Cleaning"],
      hourlyRate: 320,
      experienceYears: 6,
      lat: 23.0345,
      lng: 72.5285,
      area: "Vastrapur",
      postalCode: "380054",
      memberId: "MEM-AMD-0503",
      reviews: [{ rating: 5, comment: "Full apartment deep clean done diligently." }],
    },
    {
      email: "meena.rathod.clean@example.com",
      fullName: "Meena Rathod",
      phone: "+91 98250 66004",
      profession: "Cleaner",
      skills: ["Cleaning", "Kitchen Cleaning", "Move-in/Move-out Cleaning"],
      hourlyRate: 310,
      experienceYears: 4,
      lat: 23.0135,
      lng: 72.5615,
      area: "Paldi",
      postalCode: "380007",
      memberId: "MEM-AMD-0504",
      isNew: true,
    },
    {
      email: "rekha.solanki.clean@example.com",
      fullName: "Rekha Solanki",
      phone: "+91 98250 66005",
      profession: "Cleaner",
      skills: ["Cleaning", "Floor Cleaning", "Home Deep Cleaning"],
      hourlyRate: 330,
      experienceYears: 7,
      lat: 23.0445,
      lng: 72.5095,
      area: "Bodakdev",
      postalCode: "380054",
      memberId: "MEM-AMD-0505",
      reviews: [{ rating: 5, comment: "Marble floor scrubbing and sanitization." }],
    },
  ];

  console.log(`Processing ${workersToSeed.length} workers across 5 categories...`);

  const { data: existingAuthList } = await adminClient.auth.admin.listUsers();
  const existingEmailMap = new Map<string, string>();
  for (const u of existingAuthList?.users || []) {
    if (u.email) existingEmailMap.set(u.email.toLowerCase(), u.id);
  }

  // Find customer ID for review insertion
  const customerId = existingEmailMap.get("customer@example.com") || "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef";

  for (const w of workersToSeed) {
    let userId = existingEmailMap.get(w.email.toLowerCase());
    if (!userId) {
      // Create user
      const { data: newUser, error: uErr } = await adminClient.auth.admin.createUser({
        email: w.email,
        password: "Password123!",
        email_confirm: true,
        user_metadata: {
          full_name: w.fullName,
          role: "WORKER",
          phone: w.phone,
        },
      });
      if (uErr || !newUser.user) {
        console.error(`Failed to create auth user for ${w.email}:`, uErr?.message);
        continue;
      }
      userId = newUser.user.id;
    }

    // Upsert profile
    await adminClient.from("profiles").upsert({
      id: userId,
      full_name: w.fullName,
      email: w.email,
      phone: w.phone,
      role: "WORKER",
      is_active: true,
    });

    // Check or create worker
    const { data: existingWorker } = await adminClient.from("workers").select("id").eq("profile_id", userId).maybeSingle();
    let workerId = existingWorker?.id;

    if (!workerId) {
      const { data: newW, error: wErr } = await adminClient
        .from("workers")
        .insert({
          profile_id: userId,
          federation_id: federationId,
          member_id: w.memberId,
          profession: w.profession,
          hourly_rate: w.hourlyRate,
          experience_years: w.experienceYears,
          verification_status: "verified",
          account_status: "ACTIVE",
          availability_status: "AVAILABLE",
          current_latitude: w.lat,
          current_longitude: w.lng,
          service_radius_km: 20,
        })
        .select("id")
        .single();

      if (wErr || !newW) {
        console.error(`Worker insert failed for ${w.email}:`, wErr?.message);
        continue;
      }
      workerId = newW.id;
    } else {
      // Update worker coordinates and availability
      await adminClient
        .from("workers")
        .update({
          profession: w.profession,
          hourly_rate: w.hourlyRate,
          experience_years: w.experienceYears,
          verification_status: "verified",
          account_status: "ACTIVE",
          availability_status: "AVAILABLE",
          current_latitude: w.lat,
          current_longitude: w.lng,
          service_radius_km: 20,
        })
        .eq("id", workerId);
    }

    // Upsert address
    const { data: existingAddr } = await adminClient.from("addresses").select("id").eq("profile_id", userId).maybeSingle();
    if (!existingAddr) {
      await adminClient.from("addresses").insert({
        profile_id: userId,
        title: "Residence",
        address_line1: `${w.area} Main Road`,
        city: "Ahmedabad",
        state: "Gujarat",
        postal_code: w.postalCode,
        latitude: w.lat,
        longitude: w.lng,
        is_default: true,
      });
    }

    // Link skills
    for (const sName of w.skills) {
      const sId = skillMap.get(sName.toLowerCase().trim());
      if (sId && workerId) {
        const { data: existingWs } = await adminClient
          .from("worker_skills")
          .select("id")
          .eq("worker_id", workerId)
          .eq("skill_id", sId)
          .maybeSingle();

        if (!existingWs) {
          await adminClient.from("worker_skills").insert({
            worker_id: workerId,
            skill_id: sId,
            proficiency_level: "expert",
          });
        }
      }
    }

    // Insert genuine reviews if specified and worker is not new
    if (w.reviews && w.reviews.length > 0 && workerId) {
      const { data: existingReviews } = await adminClient.from("reviews").select("id").eq("worker_id", workerId);
      if (!existingReviews || existingReviews.length === 0) {
        for (const rev of w.reviews) {
          await adminClient.from("reviews").insert({
            customer_id: customerId,
            worker_id: workerId,
            rating: rev.rating,
            comment: rev.comment,
          });
        }
      }
    }

    console.log(`✓ Seeded ${w.fullName} (${w.profession}) [${w.skills.join(", ")}]`);
  }

  console.log("\n================================================================================");
  console.log("PHASE 2 WORKFORCE SEEDING COMPLETE!");
  console.log("================================================================================\n");
}

seedPhase2().catch(console.error);

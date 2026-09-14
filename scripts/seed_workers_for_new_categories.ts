import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...valParts] = trimmed.split('=');
        process.env[key.trim()] = valParts.join('=').trim();
      }
    }
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false }
});

const NEW_WORKERS_SEED = [
  {
    fullName: "Kanti Mistry",
    email: "kanti.mason@example.com",
    phone: "+919825100101",
    profession: "Mason",
    hourlyRate: 380,
    experienceYears: 8,
    categoryName: "Masonry",
    skillName: "Brickwork",
    addressLine1: "12, Shanti Nagar, Maninagar",
    city: "Ahmedabad",
    state: "Gujarat",
    postalCode: "380008",
  },
  {
    fullName: "Geeta Ben Solanki",
    email: "geeta.domestic@example.com",
    phone: "+919825100102",
    profession: "Domestic House Help",
    hourlyRate: 250,
    experienceYears: 6,
    categoryName: "House Help / Domestic Help",
    skillName: "Sweeping & Mopping",
    addressLine1: "B-104, Gokul Residency, Bopal",
    city: "Ahmedabad",
    state: "Gujarat",
    postalCode: "380058",
  },
  {
    fullName: "Pravin Panchal",
    email: "pravin.welder@example.com",
    phone: "+919825100103",
    profession: "Welder",
    hourlyRate: 400,
    experienceYears: 7,
    categoryName: "Welding",
    skillName: "Arc Welding",
    addressLine1: "45, GIDC Industrial Estate, Odhav",
    city: "Ahmedabad",
    state: "Gujarat",
    postalCode: "382415",
  },
  {
    fullName: "Govind Rathod",
    email: "govind.labour@example.com",
    phone: "+919825100104",
    profession: "Construction Labourer",
    hourlyRate: 300,
    experienceYears: 5,
    categoryName: "Construction Labour",
    skillName: "Material Handling",
    addressLine1: "Plot 8, Sardar Patel Colony, Vatva",
    city: "Ahmedabad",
    state: "Gujarat",
    postalCode: "382440",
  },
  {
    fullName: "Naresh Prajapati",
    email: "naresh.tiles@example.com",
    phone: "+919825100105",
    profession: "Tile & Marble Specialist",
    hourlyRate: 420,
    experienceYears: 9,
    categoryName: "Tile & Floor Work",
    skillName: "Tile Laying",
    addressLine1: "502, Navkar Flats, Satellite",
    city: "Ahmedabad",
    state: "Gujarat",
    postalCode: "380015",
  },
];

async function main() {
  console.log("=== SEEDING VERIFIED WORKERS FOR NEW CATEGORIES ===");

  const { data: feds } = await supabase.from('federations').select('id, name, code').eq('is_active', true);
  const primaryFedId = feds?.find(f => f.code === 'FED-AMD-01')?.id || feds?.[0]?.id;

  for (const w of NEW_WORKERS_SEED) {
    console.log(`\nSeeding worker: ${w.fullName} (${w.profession})...`);

    // Check if profile exists
    let profileId: string;
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', w.email)
      .maybeSingle();

    if (existingProf) {
      profileId = existingProf.id;
      console.log(`- Existing profile ID: ${profileId}`);
    } else {
      // Create auth user
      const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
        email: w.email,
        password: "Password123!",
        email_confirm: true,
        user_metadata: { full_name: w.fullName, role: "WORKER" }
      });

      if (authErr) {
        console.error(`Failed to create auth user for ${w.email}:`, authErr.message);
        continue;
      }

      profileId = authData.user.id;

      // Upsert profile
      await supabase.from('profiles').upsert({
        id: profileId,
        full_name: w.fullName,
        email: w.email,
        phone: w.phone,
        role: "WORKER",
        is_active: true,
      });
      console.log(`- Created profile: ${profileId}`);
    }

    // Upsert address
    await supabase.from('addresses').upsert({
      profile_id: profileId,
      title: "Home",
      address_line1: w.addressLine1,
      city: w.city,
      state: w.state,
      postal_code: w.postalCode,
      is_default: true,
    });

    // Upsert worker record
    let workerId: string;
    const { data: existingWorker } = await supabase
      .from('workers')
      .select('id')
      .eq('profile_id', profileId)
      .maybeSingle();

    if (existingWorker) {
      workerId = existingWorker.id;
      await supabase.from('workers').update({
        account_status: "ACTIVE",
        availability_status: "AVAILABLE",
        verification_status: "verified",
        profession: w.profession,
        hourly_rate: w.hourlyRate,
        experience_years: w.experienceYears,
      }).eq('id', workerId);
    } else {
      const { data: createdW, error: wErr } = await supabase.from('workers').insert({
        profile_id: profileId,
        federation_id: primaryFedId,
        account_status: "ACTIVE",
        availability_status: "AVAILABLE",
        verification_status: "verified",
        profession: w.profession,
        hourly_rate: w.hourlyRate,
        experience_years: w.experienceYears,
        member_id: `MEM-${w.profession.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        current_latitude: 23.0325,
        current_longitude: 72.5205,
      }).select('id').single();

      if (wErr) {
        console.error(`Failed to create worker for ${w.fullName}:`, wErr.message);
        continue;
      }
      workerId = createdW.id;
    }

    // Attach skill
    const { data: skillRow } = await supabase
      .from('skills')
      .select('id')
      .ilike('name', w.skillName)
      .maybeSingle();

    if (skillRow) {
      await supabase.from('worker_skills').upsert({
        worker_id: workerId,
        skill_id: skillRow.id,
        proficiency_level: "expert",
      });
      console.log(`- Linked skill "${w.skillName}" to worker ${workerId}`);
    }

    console.log(`- Worker ${w.fullName} active & verified.`);
  }

  console.log("\n=== ALL WORKERS SEEDED SUCCESSFULLY ===");
}

main().catch(console.error);

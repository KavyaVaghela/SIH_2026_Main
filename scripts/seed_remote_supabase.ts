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

if (!url || !secretKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment!");
  process.exit(1);
}

console.log("Connecting to Supabase at:", url);

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false }
});

async function main() {
  console.log("=== STEP 1: Provision Auth Users ===");
  
  const devUsers = [
    { email: 'customer@example.com', full_name: 'Prince Patel', role: 'CUSTOMER', phone: '+919876543210' },
    { email: 'worker@example.com', full_name: 'Ravi Patel', role: 'WORKER', phone: '+919876543211' },
    { email: 'hitesh.solanki@example.com', full_name: 'Hitesh Solanki', role: 'WORKER', phone: '+919876543212' },
    { email: 'sanjay.parmar@example.com', full_name: 'Sanjay Parmar', role: 'WORKER', phone: '+919876543213' },
    { email: 'sunita.sharma@example.com', full_name: 'Sunita Sharma', role: 'WORKER', phone: '+919876543214' },
    { email: 'federation@example.com', full_name: 'Vikram Shah', role: 'FEDERATION_ADMIN', phone: '+919876543215' },
    { email: 'admin@example.com', full_name: 'System Administrator', role: 'SUPER_ADMIN', phone: '+919876543216' }
  ];

  const userMap: Record<string, string> = {};

  for (const userSpec of devUsers) {
    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let userObj = existingUsers?.users?.find(u => u.email === userSpec.email);

    if (!userObj) {
      console.log(`Creating Auth user: ${userSpec.email} (${userSpec.full_name})`);
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: userSpec.email,
        password: 'Password123!',
        email_confirm: true,
        user_metadata: {
          full_name: userSpec.full_name,
          role: userSpec.role
        }
      });
      if (error) {
        console.error(`Error creating auth user ${userSpec.email}:`, error.message);
        continue;
      }
      userObj = created.user;
    } else {
      console.log(`Auth user already exists: ${userSpec.email} -> ${userObj.id}`);
    }

    if (userObj) {
      userMap[userSpec.email] = userObj.id;
    }
  }

  console.log("Auth users mapped:", Object.keys(userMap).length);

  console.log("\n=== STEP 2: Seed Profiles ===");
  for (const userSpec of devUsers) {
    const authId = userMap[userSpec.email];
    if (!authId) continue;

    const { error } = await supabase.from('profiles').upsert({
      id: authId,
      full_name: userSpec.full_name,
      email: userSpec.email,
      phone: userSpec.phone,
      role: userSpec.role,
      is_active: true
    }, { onConflict: 'id' });

    if (error) {
      console.error(`Error upserting profile for ${userSpec.email}:`, error.message);
    } else {
      console.log(`Upserted profile: ${userSpec.full_name} (${userSpec.role})`);
    }
  }

  console.log("\n=== STEP 3: Seed Federations ===");
  const federationsData = [
    {
      name: 'Ahmedabad Skilled Workers Federation',
      code: 'FED-AMD-01',
      gst_number: '24AAAAA0000A1Z5',
      registration_number: 'GUJ-AMD-COOP-2024-001',
      state: 'Gujarat',
      city: 'Ahmedabad',
      address: '101 Cooperative House, Ashram Road, Ahmedabad, Gujarat',
      contact_email: 'contact@ahmedabadworkers.org',
      contact_phone: '+91 79 2658 0001',
      service_region: 'Ahmedabad City & Suburbs',
      is_active: true
    },
    {
      name: 'Gujarat Household Services Federation',
      code: 'FED-GUJ-02',
      gst_number: '24BBBBB0000B1Z4',
      registration_number: 'GUJ-GND-COOP-2024-002',
      state: 'Gujarat',
      city: 'Gandhinagar',
      address: '202 Sector 11, Gandhinagar, Gujarat',
      contact_email: 'info@gujarathousehold.org',
      contact_phone: '+91 79 2322 0002',
      service_region: 'Gandhinagar & North Gujarat',
      is_active: true
    },
    {
      name: 'Vadodara Artisan Cooperative',
      code: 'FED-VAD-03',
      gst_number: '24CCCCC0000C1Z3',
      registration_number: 'GUJ-VAD-COOP-2024-003',
      state: 'Gujarat',
      city: 'Vadodara',
      address: '303 Alkapuri, Vadodara, Gujarat',
      contact_email: 'support@vadodaraartisan.org',
      contact_phone: '+91 265 233 0003',
      service_region: 'Vadodara Central',
      is_active: true
    },
    {
      name: 'Surat Technicians Guild',
      code: 'FED-SUR-04',
      gst_number: '24DDDDD0000D1Z2',
      registration_number: 'GUJ-SUR-COOP-2024-004',
      state: 'Gujarat',
      city: 'Surat',
      address: '404 Ring Road, Surat, Gujarat',
      contact_email: 'admin@surattech.org',
      contact_phone: '+91 261 245 0004',
      service_region: 'Surat Metro',
      is_active: true
    }
  ];

  const federationMap: Record<string, string> = {};
  for (const fed of federationsData) {
    const { data: existing } = await supabase.from('federations').select('id').eq('code', fed.code).single();
    if (existing) {
      federationMap[fed.code] = existing.id;
      console.log(`Federation exists: ${fed.name}`);
    } else {
      const { data: inserted, error } = await supabase.from('federations').insert(fed).select('id').single();
      if (error) {
        console.error(`Error inserting federation ${fed.name}:`, error.message);
      } else if (inserted) {
        federationMap[fed.code] = inserted.id;
        console.log(`Inserted federation: ${fed.name}`);
      }
    }
  }

  console.log("\n=== STEP 4: Seed Service Categories ===");
  const categoriesData = [
    { name: 'Plumbing', description: 'Plumbing repair, installation and maintenance services', icon_name: 'Wrench' },
    { name: 'Electrical', description: 'Electrical wiring, repair and installation services', icon_name: 'Zap' },
    { name: 'Carpentry & Woodwork', description: 'Furniture repair, door fitting, and custom carpentry', icon_name: 'Hammer' },
    { name: 'Painting', description: 'Interior and exterior painting, touch-ups, and coatings', icon_name: 'Paintbrush' },
    { name: 'Cleaning', description: 'Deep home cleaning, kitchen, bathroom, and sofa sanitization', icon_name: 'Sparkles' },
    { name: 'Appliance Repair', description: 'AC, refrigerator, washing machine, and geyser repair', icon_name: 'Tv' },
    { name: 'Gardening', description: 'Lawn care, plant trimming, and garden maintenance', icon_name: 'Scissors' },
    { name: 'Driver Services', description: 'Local, outstation, and personal driver services', icon_name: 'Car' }
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categoriesData) {
    const { data: existing } = await supabase.from('service_categories').select('id').eq('name', cat.name).single();
    if (existing) {
      categoryMap[cat.name] = existing.id;
      console.log(`Category exists: ${cat.name}`);
    } else {
      const { data: inserted, error } = await supabase.from('service_categories').insert(cat).select('id').single();
      if (error) {
        console.error(`Error inserting category ${cat.name}:`, error.message);
      } else if (inserted) {
        categoryMap[cat.name] = inserted.id;
        console.log(`Inserted category: ${cat.name}`);
      }
    }
  }

  console.log("\n=== STEP 5: Seed Services ===");
  const servicesCatalog: Array<{ category: string; title: string; description: string; base_price: number; minimum_visit_charge: number }> = [
    // Plumbing
    { category: 'Plumbing', title: 'Tap Repair', description: 'Fix leaking, dripping or broken taps', base_price: 250, minimum_visit_charge: 150 },
    { category: 'Plumbing', title: 'Pipe Leakage', description: 'Locate and fix pipe leakages and cracks', base_price: 450, minimum_visit_charge: 200 },
    { category: 'Plumbing', title: 'Drainage Blockage', description: 'Clear clogged drains, sinks, and pipes', base_price: 500, minimum_visit_charge: 200 },
    { category: 'Plumbing', title: 'Bathroom Plumbing', description: 'Complete bathroom plumbing fittings and repair', base_price: 800, minimum_visit_charge: 300 },
    { category: 'Plumbing', title: 'Kitchen Plumbing', description: 'Kitchen sink, tap, and drainage repair', base_price: 400, minimum_visit_charge: 200 },
    { category: 'Plumbing', title: 'Sink Repair', description: 'Repair or replace kitchen and wash basin sinks', base_price: 350, minimum_visit_charge: 150 },
    { category: 'Plumbing', title: 'Toilet Repair', description: 'Flush tank, seat, and toilet blockage repair', base_price: 450, minimum_visit_charge: 200 },
    { category: 'Plumbing', title: 'Water Tank / Pipeline Work', description: 'Water tank cleaning and main pipeline maintenance', base_price: 1200, minimum_visit_charge: 500 },
    { category: 'Plumbing', title: 'Other Plumbing Work', description: 'General plumbing inspection and custom repairs', base_price: 300, minimum_visit_charge: 200 },

    // Electrical
    { category: 'Electrical', title: 'Switch / Socket Repair', description: 'Fix burnt or broken switches and power sockets', base_price: 200, minimum_visit_charge: 150 },
    { category: 'Electrical', title: 'Fan Installation', description: 'Install ceiling or wall fans safely', base_price: 300, minimum_visit_charge: 150 },
    { category: 'Electrical', title: 'Fan Repair', description: 'Fix noisy, slow, or non-working ceiling fans', base_price: 250, minimum_visit_charge: 150 },
    { category: 'Electrical', title: 'Light Installation', description: 'Mount tube lights, LED panels, and decorative lights', base_price: 200, minimum_visit_charge: 150 },
    { category: 'Electrical', title: 'Wiring Repair', description: 'Repair damaged home wiring and short circuits', base_price: 600, minimum_visit_charge: 250 },
    { category: 'Electrical', title: 'MCB Repair', description: 'Fix tripping MCBs and main circuit breakers', base_price: 400, minimum_visit_charge: 200 },
    { category: 'Electrical', title: 'Short Circuit Issue', description: 'Emergency short circuit diagnosis and repair', base_price: 700, minimum_visit_charge: 300 },
    { category: 'Electrical', title: 'Switchboard Repair', description: 'Repair or replace main electrical switchboards', base_price: 500, minimum_visit_charge: 200 },
    { category: 'Electrical', title: 'Other Electrical Work', description: 'General electrical inspection and custom repairs', base_price: 300, minimum_visit_charge: 200 },

    // Carpentry
    { category: 'Carpentry & Woodwork', title: 'Door Lock & Handle Fitting', description: 'Install or repair door locks, latches and handles', base_price: 300, minimum_visit_charge: 150 },
    { category: 'Carpentry & Woodwork', title: 'Door Repair', description: 'Fix jamming, misaligned or squeaking doors', base_price: 400, minimum_visit_charge: 200 },
    { category: 'Carpentry & Woodwork', title: 'Window Repair', description: 'Wooden window frame and latch repair', base_price: 350, minimum_visit_charge: 150 },
    { category: 'Carpentry & Woodwork', title: 'Furniture Assembly & Repair', description: 'Assemble bed, table, wardrobe or repair furniture', base_price: 600, minimum_visit_charge: 250 },
    { category: 'Carpentry & Woodwork', title: 'Cabinet Repair', description: 'Kitchen and wardrobe cabinet hinge repair', base_price: 450, minimum_visit_charge: 200 },
    { category: 'Carpentry & Woodwork', title: 'Other Carpentry Work', description: 'Custom woodwork, polishing, and general repairs', base_price: 350, minimum_visit_charge: 200 },

    // Painting
    { category: 'Painting', title: 'Room Painting', description: 'Complete interior single room painting', base_price: 1500, minimum_visit_charge: 500 },
    { category: 'Painting', title: 'Wall Touch-up', description: 'Patch up scratches, stains, and holes on walls', base_price: 500, minimum_visit_charge: 250 },
    { category: 'Painting', title: 'Exterior Painting', description: 'Weatherproof exterior wall painting', base_price: 3000, minimum_visit_charge: 1000 },
    { category: 'Painting', title: 'Door / Window Painting', description: 'Enamel paint coating for doors and windows', base_price: 600, minimum_visit_charge: 250 },
    { category: 'Painting', title: 'Waterproof Coating', description: 'Anti-dampness and waterproof wall coating', base_price: 1200, minimum_visit_charge: 400 },
    { category: 'Painting', title: 'Other Painting Work', description: 'Custom texture, stencil, or polish work', base_price: 500, minimum_visit_charge: 250 },

    // Cleaning
    { category: 'Cleaning', title: 'Home Deep Cleaning', description: 'Complete 1BHK/2BHK home deep cleaning service', base_price: 2500, minimum_visit_charge: 800 },
    { category: 'Cleaning', title: 'Kitchen Cleaning', description: 'Degreasing counter, stove, tiles, and cabinets', base_price: 900, minimum_visit_charge: 350 },
    { category: 'Cleaning', title: 'Bathroom Cleaning', description: 'Tile descaling, toilet bowl, and sink deep cleaning', base_price: 600, minimum_visit_charge: 250 },
    { category: 'Cleaning', title: 'Sofa Cleaning', description: 'Fabric / leather sofa vacuuming and shampooing', base_price: 800, minimum_visit_charge: 300 },
    { category: 'Cleaning', title: 'Move-in / Move-out Cleaning', description: 'Thorough cleaning for vacant houses before move', base_price: 3000, minimum_visit_charge: 1000 },
    { category: 'Cleaning', title: 'Sanitization', description: 'Complete home surface sanitization and disinfestation', base_price: 1000, minimum_visit_charge: 400 },
    { category: 'Cleaning', title: 'Other Cleaning Work', description: 'Window, balcony, or water tank cleaning', base_price: 500, minimum_visit_charge: 250 },

    // Appliance Repair
    { category: 'Appliance Repair', title: 'AC Service / Repair', description: 'Air conditioner filter cleaning, gas refill, and repair', base_price: 600, minimum_visit_charge: 250 },
    { category: 'Appliance Repair', title: 'Refrigerator Repair', description: 'Single / double door fridge cooling and motor repair', base_price: 500, minimum_visit_charge: 200 },
    { category: 'Appliance Repair', title: 'Washing Machine Repair', description: 'Automatic and semi-automatic washing machine repair', base_price: 550, minimum_visit_charge: 200 },
    { category: 'Appliance Repair', title: 'Geyser Repair', description: 'Electric and gas geyser heating element repair', base_price: 450, minimum_visit_charge: 200 },
    { category: 'Appliance Repair', title: 'Water Purifier Repair', description: 'RO filter replacement and water purifier servicing', base_price: 400, minimum_visit_charge: 150 },
    { category: 'Appliance Repair', title: 'Other Appliance Work', description: 'Microwave, mixer, or chimney repair', base_price: 350, minimum_visit_charge: 150 },

    // Gardening
    { category: 'Gardening', title: 'Lawn Maintenance', description: 'Grass cutting, weeding, and lawn shaping', base_price: 700, minimum_visit_charge: 300 },
    { category: 'Gardening', title: 'Plant Care', description: 'Manure application, repotting, and pest treatment', base_price: 500, minimum_visit_charge: 200 },
    { category: 'Gardening', title: 'Garden Cleanup', description: 'Removal of dry leaves, weeds, and garden waste', base_price: 600, minimum_visit_charge: 250 },
    { category: 'Gardening', title: 'Tree / Shrub Trimming', description: 'Pruning tall plants, hedges, and trees', base_price: 800, minimum_visit_charge: 300 },
    { category: 'Gardening', title: 'Other Gardening Work', description: 'Terrace garden setup and landscaping consulting', base_price: 500, minimum_visit_charge: 200 },

    // Driver Services
    { category: 'Driver Services', title: 'Local Driver', description: 'On-demand driver for hourly city travel', base_price: 400, minimum_visit_charge: 200 },
    { category: 'Driver Services', title: 'Outstation Driver', description: 'Experienced driver for outstation trips', base_price: 1500, minimum_visit_charge: 500 },
    { category: 'Driver Services', title: 'Personal Driver', description: 'Full day dedicated driver service', base_price: 1000, minimum_visit_charge: 400 },
    { category: 'Driver Services', title: 'Airport Transfer Driver', description: 'Punctual driver pick and drop to airport', base_price: 600, minimum_visit_charge: 250 },
    { category: 'Driver Services', title: 'Other Driver Work', description: 'Night driver or luxury car valet service', base_price: 500, minimum_visit_charge: 250 }
  ];

  for (const s of servicesCatalog) {
    const catId = categoryMap[s.category];
    if (!catId) continue;

    const { data: existing } = await supabase.from('services').select('id').eq('category_id', catId).eq('title', s.title).single();
    if (!existing) {
      const { error } = await supabase.from('services').insert({
        category_id: catId,
        title: s.title,
        description: s.description,
        base_price: s.base_price,
        minimum_visit_charge: s.minimum_visit_charge,
        price_unit: 'per_service',
        is_active: true
      });
      if (error) {
        console.error(`Error inserting service ${s.title}:`, error.message);
      } else {
        console.log(`Inserted service: ${s.title}`);
      }
    }
  }

  console.log("\n=== STEP 6: Seed Skills ===");
  const skillsData = [
    { name: 'Plumbing', category: 'Plumbing', description: 'General plumbing expertise' },
    { name: 'Tap Repair', category: 'Plumbing', description: 'Tap fix and valve replacement' },
    { name: 'Pipe Leakage', category: 'Plumbing', description: 'Pipe sealing and soldering' },
    { name: 'Drainage Blockage', category: 'Plumbing', description: 'Drain cleaning and unblocking' },
    { name: 'Electrical', category: 'Electrical', description: 'Electrical circuits and wiring' },
    { name: 'Wiring', category: 'Electrical', description: 'House wiring and socket fitting' },
    { name: 'MCB Repair', category: 'Electrical', description: 'Circuit breaker diagnosis' },
    { name: 'Carpentry', category: 'Carpentry & Woodwork', description: 'Woodwork, locks and fittings' },
    { name: 'Painting', category: 'Painting', description: 'Wall painting and surface prep' },
    { name: 'Cleaning', category: 'Cleaning', description: 'Deep cleaning and sanitization' },
    { name: 'Appliance Repair', category: 'Appliance Repair', description: 'Home appliance troubleshooting' },
    { name: 'Gardening', category: 'Gardening', description: 'Plant care and landscaping' },
    { name: 'Driving', category: 'Driver Services', description: 'Safe vehicle driving' }
  ];

  const skillMap: Record<string, string> = {};
  for (const sk of skillsData) {
    const catId = categoryMap[sk.category] || null;
    const { data: existing } = await supabase.from('skills').select('id').eq('name', sk.name).single();
    if (existing) {
      skillMap[sk.name] = existing.id;
    } else {
      const { data: inserted, error } = await supabase.from('skills').insert({
        name: sk.name,
        description: sk.description,
        category_id: catId
      }).select('id').single();
      if (error) {
        console.error(`Error inserting skill ${sk.name}:`, error.message);
      } else if (inserted) {
        skillMap[sk.name] = inserted.id;
        console.log(`Inserted skill: ${sk.name}`);
      }
    }
  }

  console.log("\n=== STEP 7: Seed Workers ===");
  const fedAmdId = federationMap['FED-AMD-01'];
  const fedGujId = federationMap['FED-GUJ-02'];

  const workersList = [
    {
      email: 'worker@example.com',
      profession: 'Plumber',
      hourly_rate: 350.00,
      experience_years: 8,
      service_radius_km: 20.00,
      federation_id: fedAmdId,
      lat: 23.0225,
      lng: 72.5714,
      skills: ['Plumbing', 'Tap Repair', 'Pipe Leakage', 'Drainage Blockage']
    },
    {
      email: 'hitesh.solanki@example.com',
      profession: 'Plumber',
      hourly_rate: 300.00,
      experience_years: 5,
      service_radius_km: 15.00,
      federation_id: fedAmdId,
      lat: 23.0300,
      lng: 72.5800,
      skills: ['Plumbing', 'Pipe Leakage']
    },
    {
      email: 'sanjay.parmar@example.com',
      profession: 'Painter',
      hourly_rate: 400.00,
      experience_years: 10,
      service_radius_km: 25.00,
      federation_id: fedGujId,
      lat: 23.0400,
      lng: 72.5500,
      skills: ['Painting']
    },
    {
      email: 'sunita.sharma@example.com',
      profession: 'Cleaner',
      hourly_rate: 250.00,
      experience_years: 6,
      service_radius_km: 15.00,
      federation_id: fedGujId,
      lat: 23.0100,
      lng: 72.5600,
      skills: ['Cleaning']
    }
  ];

  const workerMap: Record<string, string> = {};

  for (const wSpec of workersList) {
    const profileId = userMap[wSpec.email];
    if (!profileId) {
      console.warn(`Profile missing for worker ${wSpec.email}`);
      continue;
    }

    let workerId = '';
    const { data: existingWorker } = await supabase.from('workers').select('id').eq('profile_id', profileId).single();
    if (existingWorker) {
      workerId = existingWorker.id;
      // Update worker
      await supabase.from('workers').update({
        account_status: 'ACTIVE',
        verification_status: 'verified',
        availability_status: 'AVAILABLE',
        profession: wSpec.profession,
        hourly_rate: wSpec.hourly_rate,
        experience_years: wSpec.experience_years,
        service_radius_km: wSpec.service_radius_km,
        federation_id: wSpec.federation_id,
        current_latitude: wSpec.lat,
        current_longitude: wSpec.lng,
        last_active_at: new Date().toISOString()
      }).eq('id', workerId);
      console.log(`Updated existing worker record for ${wSpec.email}`);
    } else {
      const { data: createdWorker, error } = await supabase.from('workers').insert({
        profile_id: profileId,
        federation_id: wSpec.federation_id,
        account_status: 'ACTIVE',
        verification_status: 'verified',
        availability_status: 'AVAILABLE',
        profession: wSpec.profession,
        hourly_rate: wSpec.hourly_rate,
        experience_years: wSpec.experience_years,
        service_radius_km: wSpec.service_radius_km,
        current_latitude: wSpec.lat,
        current_longitude: wSpec.lng,
        last_active_at: new Date().toISOString()
      }).select('id').single();

      if (error) {
        console.error(`Error creating worker for ${wSpec.email}:`, error.message);
        continue;
      } else if (createdWorker) {
        workerId = createdWorker.id;
        console.log(`Created worker record for ${wSpec.email}`);
      }
    }

    workerMap[wSpec.email] = workerId;

    // Attach worker_skills
    for (const skillName of wSpec.skills) {
      const skillId = skillMap[skillName];
      if (!skillId) continue;

      const { data: existingWS } = await supabase.from('worker_skills').select('id').eq('worker_id', workerId).eq('skill_id', skillId).single();
      if (!existingWS) {
        await supabase.from('worker_skills').insert({
          worker_id: workerId,
          skill_id: skillId,
          proficiency_level: 'expert'
        });
        console.log(`Linked skill '${skillName}' to worker ${wSpec.email}`);
      }
    }

    // Attach worker_availability for days 0-6
    for (let day = 0; day <= 6; day++) {
      const { data: existingAvail } = await supabase.from('worker_availability').select('id').eq('worker_id', workerId).eq('day_of_week', day).single();
      if (!existingAvail) {
        await supabase.from('worker_availability').insert({
          worker_id: workerId,
          day_of_week: day,
          start_time: '08:00:00',
          end_time: '19:00:00',
          is_available: true
        });
      }
    }
  }

  console.log("\n=== STEP 8: Seed Customer Addresses ===");
  const customerProfileId = userMap['customer@example.com'];
  if (customerProfileId) {
    const addresses = [
      {
        profile_id: customerProfileId,
        title: 'Home',
        address_line1: '402 Green Acres, Satellite',
        address_line2: 'Near Shyamal Cross Roads',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380015',
        latitude: 23.0225,
        longitude: 72.5714,
        is_default: true
      },
      {
        profile_id: customerProfileId,
        title: 'Office',
        address_line1: '801 Shivalik High Street, Vastrapur',
        address_line2: 'Opposite Vastrapur Lake',
        city: 'Ahmedabad',
        state: 'Gujarat',
        postal_code: '380015',
        latitude: 23.0350,
        longitude: 72.5280,
        is_default: false
      }
    ];

    for (const addr of addresses) {
      const { data: existingAddr } = await supabase.from('addresses').select('id').eq('profile_id', customerProfileId).eq('title', addr.title).single();
      if (!existingAddr) {
        const { error } = await supabase.from('addresses').insert(addr);
        if (error) {
          console.error(`Error inserting address ${addr.title}:`, error.message);
        } else {
          console.log(`Inserted address: ${addr.title} for Prince Patel`);
        }
      } else {
        console.log(`Address exists: ${addr.title}`);
      }
    }
  }

  console.log("\n=== DATABASE SEEDING COMPLETED SUCCESSFULLY ===");
}

main().catch(console.error);

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
  console.error("Missing SUPABASE credentials!");
  process.exit(1);
}

const supabase = createClient(url, secretKey, {
  auth: { persistSession: false }
});

interface NewCategoryDef {
  name: string;
  description: string;
  iconName: string;
  skills: string[];
  services: Array<{
    title: string;
    description: string;
    basePrice: number;
    minimumVisitCharge: number;
    priceUnit: string;
  }>;
}

const NEW_CATEGORIES: NewCategoryDef[] = [
  {
    name: "Masonry",
    description: "Brickwork, plastering, wall repair & concrete construction",
    iconName: "Building2",
    skills: ["Brickwork", "Plastering", "Concrete Work", "Wall Repair", "Stone Masonry"],
    services: [
      { title: "Brickwork & Wall Construction", description: "Standard red brick & fly ash block masonry", basePrice: 600, minimumVisitCharge: 300, priceUnit: "per_day" },
      { title: "Plastering & Patch Repair", description: "Internal cement plastering and wall crack repair", basePrice: 450, minimumVisitCharge: 250, priceUnit: "per_service" },
      { title: "Concrete Mixing & Slab Work", description: "Foundational concrete casting and slab repair", basePrice: 700, minimumVisitCharge: 400, priceUnit: "per_day" },
      { title: "Boundary Wall Repair", description: "Repairing compound walls and precast fencing", basePrice: 500, minimumVisitCharge: 300, priceUnit: "per_service" },
      { title: "Other Masonry Work", description: "Custom brick, cement or concrete tasks", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_service" },
    ]
  },
  {
    name: "House Help / Domestic Help",
    description: "Daily sweeping, mopping, dish washing, cooking assistance & laundry",
    iconName: "Home",
    skills: ["Sweeping & Mopping", "Utensil Washing", "Cooking Assistance", "Clothes Laundry", "Home Dusting"],
    services: [
      { title: "Daily House Cleaning (Sweeping & Mopping)", description: "Complete floor sweeping and chemical mopping for 1-3 BHK", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_day" },
      { title: "Utensil Washing", description: "Sink cleaning and thorough utensil washing", basePrice: 250, minimumVisitCharge: 200, priceUnit: "per_service" },
      { title: "Home Cooking Assistance", description: "Vegetable chopping, roti preparation & kitchen assistance", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_service" },
      { title: "Clothes Washing & Folding", description: "Hand washing or machine cycle laundry with neat folding", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_service" },
      { title: "Full Day Domestic Assistance", description: "8-hour dedicated daily domestic help", basePrice: 750, minimumVisitCharge: 500, priceUnit: "per_day" },
      { title: "Other House Help", description: "Custom household cleaning and domestic chores", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_service" },
    ]
  },
  {
    name: "Welding",
    description: "Gate welding, iron railing, grill repair & structural metal fabrication",
    iconName: "Flame",
    skills: ["Arc Welding", "MIG Welding", "Grill Repair", "Gate Fabrication", "Railing Fixing"],
    services: [
      { title: "Iron Gate & Grill Repair", description: "Fixing broken hinges, latch welding and gate alignment", basePrice: 450, minimumVisitCharge: 250, priceUnit: "per_service" },
      { title: "Balcony Railing Welding", description: "Safety railing reinforcement and structural welding", basePrice: 500, minimumVisitCharge: 300, priceUnit: "per_service" },
      { title: "Metal Frame Fabrication", description: "Custom iron frame cutting, welding & grinding", basePrice: 700, minimumVisitCharge: 400, priceUnit: "per_service" },
      { title: "Hinge & Latch Welding", description: "Spot welding for broken door handles, latches & stoppers", basePrice: 300, minimumVisitCharge: 200, priceUnit: "per_service" },
      { title: "Other Welding Work", description: "Custom metal fabrication and on-site welding tasks", basePrice: 350, minimumVisitCharge: 200, priceUnit: "per_service" },
    ]
  },
  {
    name: "Construction Labour",
    description: "Material shifting, earth excavation, demolition & site assistance",
    iconName: "HardHat",
    skills: ["Material Handling", "Excavation", "Site Clearance", "Demolition Assistance", "Mortar Mixing"],
    services: [
      { title: "Material Shifting & Loading", description: "Carrying bricks, cement bags, sand & construction supplies", basePrice: 500, minimumVisitCharge: 300, priceUnit: "per_day" },
      { title: "Earth Excavation & Trenching", description: "Manual trench digging for pipelines and foundations", basePrice: 550, minimumVisitCharge: 350, priceUnit: "per_day" },
      { title: "Debris Removal & Site Clearance", description: "Clearing construction rubble, malba and waste materials", basePrice: 600, minimumVisitCharge: 400, priceUnit: "per_day" },
      { title: "Concrete & Mortar Mixing Assistance", description: "Manual and mechanical mortar mixing support", basePrice: 550, minimumVisitCharge: 350, priceUnit: "per_day" },
      { title: "Other Construction Labour", description: "General helper tasks for civil and residential projects", basePrice: 450, minimumVisitCharge: 300, priceUnit: "per_day" },
    ]
  },
  {
    name: "Tile & Floor Work",
    description: "Tile laying, marble polishing, grout repair & floor leveling",
    iconName: "Layers",
    skills: ["Tile Laying", "Grouting", "Marble Polishing", "Skirting Work", "Kota Stone Fitting"],
    services: [
      { title: "Ceramic / Vitrified Tile Laying", description: "Precision tile fixing for bathroom, kitchen and flooring", basePrice: 600, minimumVisitCharge: 350, priceUnit: "per_day" },
      { title: "Broken Tile Replacement", description: "Replacing cracked or hollow floor and wall tiles", basePrice: 350, minimumVisitCharge: 250, priceUnit: "per_service" },
      { title: "Floor Grouting & Sealant", description: "Epoxy and cement grouting to prevent water seepage", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_room" },
      { title: "Marble / Kota Stone Polishing", description: "Machine diamond polishing for mirror floor shine", basePrice: 800, minimumVisitCharge: 500, priceUnit: "per_day" },
      { title: "Other Tile & Floor Work", description: "Custom floor leveling, skirting and tile repairs", basePrice: 400, minimumVisitCharge: 250, priceUnit: "per_service" },
    ]
  },
];

async function main() {
  console.log("=== EXPANDING SERVICE CATALOG TO 12 CATEGORIES ===");

  // Resolve active federations
  const { data: feds } = await supabase.from('federations').select('id, name, code').eq('is_active', true);
  const primaryFedId = feds?.find(f => f.code === 'FED-AMD-01')?.id || feds?.[0]?.id;
  console.log("Primary Federation ID:", primaryFedId);

  for (const catDef of NEW_CATEGORIES) {
    console.log(`\nProcessing category: ${catDef.name}...`);

    // 1. Check if category already exists
    let catId: string;
    const { data: existingCat } = await supabase
      .from('service_categories')
      .select('id, name')
      .ilike('name', catDef.name)
      .maybeSingle();

    if (existingCat) {
      console.log(`- Category "${catDef.name}" already exists with ID: ${existingCat.id}`);
      catId = existingCat.id;
    } else {
      const { data: newCat, error: catErr } = await supabase
        .from('service_categories')
        .insert({
          name: catDef.name,
          description: catDef.description,
          icon_name: catDef.iconName,
          is_active: true,
        })
        .select('id, name')
        .single();

      if (catErr) {
        console.error(`Failed to insert category ${catDef.name}:`, catErr.message);
        continue;
      }
      console.log(`- Created category "${catDef.name}" with ID: ${newCat.id}`);
      catId = newCat.id;
    }

    // 2. Insert Skills
    for (const skillName of catDef.skills) {
      const { data: existingSkill } = await supabase
        .from('skills')
        .select('id')
        .ilike('name', skillName)
        .maybeSingle();

      if (!existingSkill) {
        await supabase.from('skills').insert({
          name: skillName,
          category_id: catId,
          description: `${skillName} professional skills`,
        });
        console.log(`  + Skill added: ${skillName}`);
      }
    }

    // 3. Insert Services
    for (const srv of catDef.services) {
      const { data: existingSrv } = await supabase
        .from('services')
        .select('id')
        .eq('category_id', catId)
        .ilike('title', srv.title)
        .maybeSingle();

      if (!existingSrv) {
        await supabase.from('services').insert({
          category_id: catId,
          title: srv.title,
          description: srv.description,
          base_price: srv.basePrice,
          minimum_visit_charge: srv.minimumVisitCharge,
          price_unit: srv.priceUnit,
          is_active: true,
        });
        console.log(`  + Service added: ${srv.title} (₹${srv.basePrice} ${srv.priceUnit})`);
      }
    }
  }

  // Check total categories in DB now
  const { data: allCats } = await supabase.from('service_categories').select('id, name').eq('is_active', true);
  console.log(`\nTotal active categories in DB: ${allCats?.length}`);
  allCats?.forEach((c, idx) => console.log(` ${idx + 1}. ${c.name} (${c.id})`));

  console.log("\n=== SERVICE CATALOG EXPANSION COMPLETE ===");
}

main().catch(console.error);

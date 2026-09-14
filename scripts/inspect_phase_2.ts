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
const secretKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

const client = createClient(supabaseUrl, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function inspect() {
  console.log("=== SERVICE CATEGORIES ===");
  const { data: categories } = await client.from("service_categories").select("id, name, is_active").order("name");
  console.log(categories?.map(c => `${c.name} (${c.id})`).join("\n"));

  console.log("\n=== SERVICES (SUB-SERVICES) BY CATEGORY ===");
  const { data: services } = await client.from("services").select("id, category_id, title, base_price, is_active");
  console.log("Total services:", services?.length);
  if (categories && services) {
    for (const cat of categories) {
      const catServices = services.filter(s => s.category_id === cat.id);
      console.log(`\nCATEGORY: [${cat.name}] (${catServices.length} services):`);
      for (const s of catServices) {
        console.log(`  - ${s.title} (₹${s.base_price})`);
      }
    }
  }

  console.log("\n=== SKILLS COUNT & LIST ===");
  const { data: skills } = await client.from("skills").select("id, name, category_id");
  console.log("Total skills:", skills?.length);
  console.log(skills?.map(s => s.name).join(", "));

  console.log("\n=== WORKERS SUMMARY ===");
  const { data: workers } = await client.from("workers").select(`
    id,
    profession,
    hourly_rate,
    account_status,
    verification_status,
    availability_status,
    profiles:profile_id(full_name),
    worker_skills(skills(name))
  `);
  console.log("Total workers in DB:", workers?.length);
  for (const w of workers || []) {
    const prof = (w.profiles as any)?.full_name || "Unknown";
    const skillList = (w.worker_skills as any[])?.map(ws => ws.skills?.name).filter(Boolean).join(", ") || "NO_SKILLS";
    console.log(`Worker: ${prof} | Profession: ${w.profession} | Status: ${w.account_status}/${w.verification_status}/${w.availability_status} | Skills: [${skillList}]`);
  }

  console.log("\n=== REVIEWS TABLE INSPECTION ===");
  const { data: reviews, count: reviewCount } = await client.from("reviews").select("*", { count: "exact" }).limit(5);
  console.log("Review count:", reviewCount);
  console.log(reviews);

  console.log("\n=== BOOKINGS TABLE INSPECTION ===");
  const { data: bookings, count: bookingCount } = await client.from("bookings").select("id, status, worker_id, customer_id, service_id", { count: "exact" }).limit(5);
  console.log("Booking count:", bookingCount);
  console.log(bookings);
}

inspect().catch(console.error);

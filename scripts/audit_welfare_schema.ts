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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  { auth: { persistSession: false } }
);

async function inspect() {
  console.log("=== PHASE 7 DATABASE AUDIT ===");
  
  const tables = [
    "workers",
    "profiles",
    "skills",
    "worker_skills",
    "certifications",
    "worker_certifications",
    "cooperatives",
    "federations",
    "bookings",
    "invoices",
    "payments",
    "welfare_programs",
    "worker_welfare",
    "training_programs",
    "worker_trainings"
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(2);
    if (error) {
      console.log(`[TABLE] ${t}: NOT FOUND / ERROR (${error.message})`);
    } else {
      console.log(`[TABLE] ${t}: EXISTS (${data.length} sample rows)`);
      if (data.length > 0) {
        console.log(`   Sample keys:`, Object.keys(data[0]));
        console.log(`   Sample data:`, JSON.stringify(data[0], null, 2));
      }
    }
  }

  // Inspect workers specifically
  const { data: workers } = await supabase.from("workers").select("*, profiles(*)").limit(5);
  console.log("\n=== WORKERS WITH PROFILES ===");
  workers?.forEach(w => {
    console.log(`Worker ID: ${w.id}, Profile: ${w.profiles?.full_name}, Status: ${w.status}, Cooperative ID: ${w.cooperative_id}, Verification: ${w.verification_status}`);
  });
}

inspect();

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listAllTables() {
  const possibleTables = [
    "profiles",
    "addresses",
    "federations",
    "workers",
    "service_categories",
    "services",
    "worker_skills",
    "service_areas",
    "worker_coverage",
    "bookings",
    "booking_logs",
    "invoices",
    "transactions",
    "job_requests",
    "worker_estimates",
    "reviews",
    "complaints",
    "complaint_evidence",
    "disputes",
    "notifications",
    "user_presence",
    "worker_locations",
    "project_requests",
    "project_requirements",
    "project_allocations",
    "project_expenses",
    "project_milestones",
    "project_estimate_revisions",
    "project_payment_plans",
    "project_payment_installments",
    "project_payments",
    "project_checkpoints",
    "project_daily_updates",
    "project_daily_update_media",
    "project_media",
    "project_settlements",
    "project_final_bills"
  ];

  console.log("=== CHECKING ALL CANDIDATE TABLES ===");
  const existing: string[] = [];
  const missing: string[] = [];
  for (const t of possibleTables) {
    const { error } = await supabase.from(t).select("*").limit(0);
    if (error) {
      missing.push(t);
    } else {
      existing.push(t);
    }
  }

  console.log("EXISTING TABLES (", existing.length, "):", existing);
  console.log("MISSING TABLES (", missing.length, "):", missing);
}

listAllTables().catch(console.error);

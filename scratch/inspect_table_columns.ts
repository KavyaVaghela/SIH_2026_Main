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

async function inspectColumns() {
  const tables = [
    "project_requests",
    "project_requirements",
    "project_allocations",
    "invoices",
    "notifications",
    "bookings",
    "workers"
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select("*").limit(1);
    if (error) {
      console.log(`Table ${t} error:`, error.message);
    } else if (data && data.length > 0) {
      console.log(`Table ${t} columns:`, Object.keys(data[0]));
    } else {
      console.log(`Table ${t} is empty, querying empty object`);
    }
  }
}

inspectColumns().catch(console.error);

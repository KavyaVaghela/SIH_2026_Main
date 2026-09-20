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

async function inspectTables() {
  console.log("Checking project_customer_queries...");
  const { data: qData, error: qErr } = await supabase.from("project_customer_queries").select("*").limit(5);
  console.log("project_customer_queries:", { count: qData?.length, error: qErr?.message, sample: qData?.[0] });

  console.log("Checking project_daily_updates...");
  const { data: uData, error: uErr } = await supabase.from("project_daily_updates").select("*").limit(5);
  console.log("project_daily_updates:", { count: uData?.length, error: uErr?.message, sample: uData?.[0] });

  console.log("Checking project_expenses...");
  const { data: eData, error: eErr } = await supabase.from("project_expenses").select("*").limit(5);
  console.log("project_expenses:", { count: eData?.length, error: eErr?.message, sample: eData?.[0] });

  console.log("Checking project_payment_plans...");
  const { data: pData, error: pErr } = await supabase.from("project_payment_plans").select("*").limit(5);
  console.log("project_payment_plans:", { count: pData?.length, error: pErr?.message, sample: pData?.[0] });

  console.log("Checking project_payment_installments...");
  const { data: iData, error: iErr } = await supabase.from("project_payment_installments").select("*").limit(5);
  console.log("project_payment_installments:", { count: iData?.length, error: iErr?.message, sample: iData?.[0] });
}

inspectTables();

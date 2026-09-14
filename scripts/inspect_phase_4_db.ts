import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const envPath = path.join(process.cwd(), ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const envVars: Record<string, string> = {};

envContent.split("\n").forEach((line) => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || "";
    if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    envVars[key] = value.trim();
  }
});

const url = envVars["NEXT_PUBLIC_SUPABASE_URL"] || "";
const key = envVars["SUPABASE_SECRET_KEY"] || envVars["NEXT_PUBLIC_SUPABASE_ANON_KEY"] || "";

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function inspectSample() {
  const { data: inv } = await supabase.from("invoices").select("*, invoice_items(*)").limit(1).single();
  console.log("Sample Invoice:", JSON.stringify(inv, null, 2));

  const { data: pay } = await supabase.from("payments").select("*").limit(1).single();
  console.log("Sample Payment:", JSON.stringify(pay, null, 2));
}

inspectSample();

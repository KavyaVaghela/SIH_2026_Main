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

async function run() {
  const { data: workers } = await supabase.from("workers").select("id, profession, availability_status, account_status");
  console.log("Secret Client Total workers in DB:", workers?.length);

  const anonClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
  const { data: anonWorkers } = await anonClient.from("workers").select("id, profession, availability_status, account_status");
  console.log("Anon Client Total workers in DB:", anonWorkers?.length);
  const anonStatus: Record<string, number> = {};
  anonWorkers?.forEach(w => {
    anonStatus[w.availability_status] = (anonStatus[w.availability_status] || 0) + 1;
  });
  console.log("Anon Client availability statuses:", anonStatus);
}

run().catch(console.error);

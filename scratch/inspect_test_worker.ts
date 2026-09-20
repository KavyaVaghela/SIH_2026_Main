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

async function inspectWorker() {
  const { data: w1 } = await supabase.from("workers").select("*, profile:profiles(*)").eq("id", "59eca4ff-a589-4363-ad76-24a4ff5b6e2e");
  const { data: w2 } = await supabase.from("workers").select("*, profile:profiles(*)").eq("id", "35865027-f496-46f6-9409-baa4b34419b5");
  const { data: allProfiles } = await supabase.from("profiles").select("id, full_name, email, role");

  console.log("Worker 59eca4ff:", JSON.stringify(w1, null, 2));
  console.log("Worker 35865027:", JSON.stringify(w2, null, 2));
  console.log("All profiles with role WORKER or ADMIN:", allProfiles?.filter(p => p.role === "WORKER" || p.role === "ADMIN" || p.role === "FEDERATION_ADMIN"));
}

inspectWorker().catch(console.error);

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
  process.env.SUPABASE_SECRET_KEY!
);

async function checkAddresses() {
  const { data, error } = await supabase.from("addresses").select("*").limit(2);
  console.log("Addresses sample:", data);
  if (error) console.error("Addresses error:", error);

  // Now test the query from workforce-management-service.ts line 574:
  const { data: testD, error: testErr } = await supabase
    .from("addresses")
    .select("profile_id, house_building, street_area, city, district, state, pincode")
    .limit(1);
  console.log("Testing workforce service query on addresses:", testErr ? testErr.message : "Success!");
}

checkAddresses().catch(console.error);

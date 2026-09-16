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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function testFedAdminScope() {
  const client = createClient(url, publishableKey);
  const { data: auth, error } = await client.auth.signInWithPassword({
    email: "federation@example.com",
    password: "Password123!",
  });

  if (error) {
    console.error("Login failed:", error.message);
    return;
  }

  console.log("Logged in user:", auth.user.id, auth.user.email);

  // Test calling current_federation_id via rpc
  const { data: fedId, error: fedErr } = await client.rpc("current_federation_id");
  console.log("current_federation_id():", fedId, fedErr ? fedErr.message : "Success");

  // Test selecting workers as federation admin
  const { data: workers, error: wrkErr } = await client.from("workers").select("id, federation_id, verification_status, account_status");
  console.log("Workers visible to federation admin:", workers?.length, wrkErr ? wrkErr.message : "");
  if (workers) {
    const feds = new Set(workers.map(w => w.federation_id));
    console.log("Federation IDs of visible workers:", Array.from(feds));
  }
}

testFedAdminScope().catch(console.error);

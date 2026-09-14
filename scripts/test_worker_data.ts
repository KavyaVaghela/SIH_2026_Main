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

async function testWorkerDashboardData() {
  const client = createClient(url, publishableKey);
  const { data: auth, error } = await client.auth.signInWithPassword({
    email: "worker@example.com",
    password: "Password123!",
  });

  if (error) {
    console.error("Worker login failed:", error.message);
    return;
  }

  const userId = auth.user.id;
  console.log("Worker logged in:", userId, auth.user.email);

  // 1. Fetch Profile
  const { data: profile, error: profErr } = await client
    .from("profiles")
    .select("id, full_name, email, phone, role, avatar_url, is_active")
    .eq("id", userId)
    .single();
  console.log("Profile:", profile, profErr ? profErr.message : "Success");

  // 2. Fetch Worker Record
  const { data: worker, error: wrkErr } = await client
    .from("workers")
    .select(`
      id,
      member_id,
      profession,
      hourly_rate,
      experience_years,
      account_status,
      availability_status,
      verification_status,
      date_of_birth,
      gender,
      federation_id,
      federations (
        id,
        name,
        city,
        state,
        code
      )
    `)
    .eq("profile_id", userId)
    .maybeSingle();
  console.log("Worker:", worker, wrkErr ? wrkErr.message : "Success");

  // 3. Fetch Address
  const { data: address, error: addrErr } = await client
    .from("addresses")
    .select("id, title, address_line1, address_line2, city, state, postal_code, is_default")
    .eq("profile_id", userId)
    .order("is_default", { ascending: false })
    .limit(1)
    .maybeSingle();
  console.log("Address:", address, addrErr ? addrErr.message : "Success");

  // 4. Fetch Skills
  let skills = [];
  if (worker?.id) {
    const { data: wSkills, error: sErr } = await client
      .from("worker_skills")
      .select("skill_id, proficiency_level, skills(id, name, description)")
      .eq("worker_id", worker.id);
    console.log("Worker skills:", wSkills, sErr ? sErr.message : "Success");
  }

  // 5. Fetch Certifications
  if (worker?.id) {
    const { data: wCerts, error: cErr } = await client
      .from("worker_certifications")
      .select("certification_id, certificate_number, status, is_verified, certifications(id, title, issuing_body)")
      .eq("worker_id", worker.id);
    console.log("Worker certs:", wCerts, cErr ? cErr.message : "Success");
  }
}

testWorkerDashboardData().catch(console.error);

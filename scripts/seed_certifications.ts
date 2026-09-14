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

async function seedCertifications() {
  console.log("Seeding authentic certifications for Phase 7...");

  // 1. Check/Insert Certifications
  const certCatalog = [
    {
      title: "Advanced Plumbing & Drainage Protocol (Level 4)",
      issuing_body: "Indian Plumbing Skills Council (IPSC)",
      validity_months: 36,
    },
    {
      title: "Domestic Wiring & Safety Certification",
      issuing_body: "Gujarat Skill Development Mission",
      validity_months: 24,
    },
    {
      title: "Workplace Safety & First Aid Protocol",
      issuing_body: "Directorate General of Factory Advice Service and Labour Institutes (DGFASLI)",
      validity_months: 12,
    },
    {
      title: "Solar PV Rooftop Installation Technician",
      issuing_body: "Skill Council for Green Jobs (SCGJ)",
      validity_months: 24,
    },
    {
      title: "Master Carpentry & Architectural Joinery",
      issuing_body: "Furniture & Fittings Skill Council",
      validity_months: 36,
    },
  ];

  const insertedCerts: any[] = [];
  for (const c of certCatalog) {
    const { data: existing } = await supabase
      .from("certifications")
      .select("*")
      .eq("title", c.title)
      .maybeSingle();

    if (existing) {
      insertedCerts.push(existing);
      console.log(`Found existing certification: ${existing.title} (${existing.id})`);
    } else {
      const { data: created, error } = await supabase
        .from("certifications")
        .insert(c)
        .select()
        .single();
      if (error) {
        console.error(`Error inserting ${c.title}:`, error);
      } else {
        insertedCerts.push(created);
        console.log(`Created certification: ${created.title} (${created.id})`);
      }
    }
  }

  // 2. Fetch Workers
  // Worker 1: Ravi Patel (Plumber, federation: b765df3b-c418-4a15-b79f-3cbc09e475dc)
  const { data: ravi } = await supabase
    .from("workers")
    .select("id, profile_id, federation_id, profiles(full_name)")
    .eq("id", "59eca4ff-a589-4363-ad76-24a4ff5b6e2e")
    .single();

  // Worker 2: Chetan Joshi (Electrician, federation: b765df3b-c418-4a15-b79f-3cbc09e475dc)
  const { data: chetan } = await supabase
    .from("workers")
    .select("id, profile_id, federation_id, profiles(full_name)")
    .eq("id", "ca07757c-e5ff-42fc-ae80-8d5210f18b4f")
    .single();

  // Worker 3: Maulik Makwana (federation: df5e2a43-c749-4cca-bd26-fe5826b1d1c3)
  const { data: maulik } = await supabase
    .from("workers")
    .select("id, profile_id, federation_id, profiles(full_name)")
    .eq("id", "35865027-f496-46f6-9409-baa4b34419b5")
    .single();

  if (ravi && insertedCerts.length >= 3) {
    // Ravi Patel: Active Plumbing Cert (expires 2027-03-18)
    const plumbingCert = insertedCerts.find(c => c.title.includes("Plumbing"));
    if (plumbingCert) {
      await supabase.from("worker_certifications").upsert(
        {
          worker_id: ravi.id,
          certification_id: plumbingCert.id,
          certificate_number: "IPSC-PLM-2024-7819",
          issue_date: "2024-03-18",
          expiry_date: "2027-03-18",
          status: "VERIFIED",
          is_verified: true,
          verification_date: "2024-03-20T10:00:00Z",
        },
        { onConflict: "worker_id,certification_id" }
      );
      console.log(`Upserted active Plumbing certification for Ravi Patel`);
    }

    // Ravi Patel: Expiring Safety Cert (expires 2026-10-05, in 21 days!)
    const safetyCert = insertedCerts.find(c => c.title.includes("Safety & First Aid"));
    if (safetyCert) {
      await supabase.from("worker_certifications").upsert(
        {
          worker_id: ravi.id,
          certification_id: safetyCert.id,
          certificate_number: "DGFASLI-SAF-2025-4412",
          issue_date: "2025-10-05",
          expiry_date: "2026-10-05",
          status: "EXPIRING_SOON",
          is_verified: true,
          verification_date: "2025-10-08T10:00:00Z",
        },
        { onConflict: "worker_id,certification_id" }
      );
      console.log(`Upserted expiring Safety certification for Ravi Patel (Expires 05 Oct 2026)`);
    }
  }

  if (chetan && insertedCerts.length >= 2) {
    // Chetan Joshi: Expired Wiring Cert (expired 2026-08-10)
    const wiringCert = insertedCerts.find(c => c.title.includes("Wiring"));
    if (wiringCert) {
      await supabase.from("worker_certifications").upsert(
        {
          worker_id: chetan.id,
          certification_id: wiringCert.id,
          certificate_number: "GSDM-ELE-2024-1102",
          issue_date: "2024-08-10",
          expiry_date: "2026-08-10",
          status: "EXPIRED",
          is_verified: true,
          verification_date: "2024-08-15T10:00:00Z",
        },
        { onConflict: "worker_id,certification_id" }
      );
      console.log(`Upserted expired Wiring certification for Chetan Joshi (Expired Aug 2026)`);
    }
  }

  if (maulik && insertedCerts.length >= 3) {
    // Maulik Makwana in Gujarat Household Services Federation (df5e2a43-c749-4cca-bd26-fe5826b1d1c3)
    const solarCert = insertedCerts.find(c => c.title.includes("Solar"));
    if (solarCert) {
      await supabase.from("worker_certifications").upsert(
        {
          worker_id: maulik.id,
          certification_id: solarCert.id,
          certificate_number: "SCGJ-SOL-2025-9921",
          issue_date: "2025-05-01",
          expiry_date: "2027-05-01",
          status: "VERIFIED",
          is_verified: true,
          verification_date: "2025-05-05T10:00:00Z",
        },
        { onConflict: "worker_id,certification_id" }
      );
      console.log(`Upserted Solar certification for Maulik Makwana in Gandhinagar Federation`);
    }
  }

  console.log("Certification seeding completed successfully!");
}

seedCertifications();

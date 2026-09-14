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

async function inspectComplaints() {
  console.log("Checking complaints table rows...");
  const { data, error } = await supabase.from("complaints").select("*").limit(5);
  console.log("Complaints rows count:", data?.length, "error:", error);
  if (data && data.length > 0) {
    console.log("First complaint row keys:", Object.keys(data[0]));
    console.log("First complaint row sample:", data[0]);
  }

  // Test inserting structured envelope in description
  const payload = {
    version: 1,
    subject: "Water leak after repair",
    subcategory: "Plumbing Service Quality",
    priority: "HIGH",
    suggestedPriority: "HIGH",
    triageReason: "Water leak with property damage risk",
    federationId: "b765df3b-c418-4a15-b79f-3cbc09e475dc",
    detailedDescription: "The joint under the sink is still dripping after pipe repair.",
    evidenceUrls: [],
    lifecycleStatus: "OPEN",
    timeline: [
      {
        id: "tl-1",
        type: "PUBLIC_UPDATE",
        actorId: "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef",
        actorRole: "CUSTOMER",
        actorName: "Prince Patel",
        message: "Complaint submitted by customer.",
        timestamp: new Date().toISOString()
      }
    ],
    auditTrail: [
      {
        id: "aud-1",
        action: "CREATE",
        actorId: "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef",
        actorRole: "CUSTOMER",
        timestamp: new Date().toISOString(),
        notes: "Grievance case initialized."
      }
    ]
  };

  const num2 = `KS-GRV-2026-${Date.now().toString().slice(-6)}`;
  const { data: insData2, error: insErr2 } = await supabase.from("complaints").insert({
    complaint_number: num2,
    raised_by: "b0ef9604-54c8-4ad1-9a7a-c353cfd339ef",
    category: "Service Quality",
    description: JSON.stringify(payload),
    status: "OPEN"
  }).select();

  console.log("Structured insert result:", insData2?.[0]?.id, "error:", insErr2);
  if (insData2?.[0]?.id) {
    const fetched = JSON.parse(insData2[0].description);
    console.log("Parsed structured payload subject:", fetched.subject, "priority:", fetched.priority);
    await supabase.from("complaints").delete().eq("id", insData2[0].id);
    console.log("Cleaned up structured test row.");
  }
}

inspectComplaints().catch(console.error);

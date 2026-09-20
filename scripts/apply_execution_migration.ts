import fs from "fs";
import path from "path";

const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim();
    }
  }
}

async function run() {
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const projectRef = "dxvnwbmxeubpbunwlmnd";

  const migrationPath = path.join(
    process.cwd(),
    "supabase/migrations/20260919000001_large_project_execution_checkpoints.sql"
  );
  const sql = fs.readFileSync(migrationPath, "utf-8");

  console.log("Applying execution migration to Supabase project:", projectRef);

  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/sql`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  console.log("Response status:", res.status);
  const text = await res.text();
  console.log("Response text:", text);
}

run().catch(console.error);

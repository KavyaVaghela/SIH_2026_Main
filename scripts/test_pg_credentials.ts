import fs from "fs";
import path from "path";
import { Client } from "pg";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.POSTGRES_PASSWORD || process.env.SUPABASE_SECRET_KEY;

  console.log("Project Ref:", projectRef);

  const connString = `postgres://postgres.${projectRef}:${encodeURIComponent(dbPassword || "")}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`;
  console.log("Testing direct Postgres pooler connection...");

  const client = new Client({ connectionString: connString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log("SUCCESSFULLY CONNECTED TO POSTGRES!");
    const res = await client.query("SELECT current_database(), current_user, version();");
    console.log("Query result:", res.rows[0]);
    await client.end();
  } catch (err: any) {
    console.log("Postgres connection error:", err.message);
  }
}

main().catch(console.error);

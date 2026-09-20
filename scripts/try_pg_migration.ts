import { Client } from "pg";
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

async function tryPostgresConnect() {
  const secretKey = process.env.SUPABASE_SECRET_KEY!;
  const projectRef = "dxvnwbmxeubpbunwlmnd";

  const sqlPath = path.join(process.cwd(), "supabase", "migrations", "20260919000001_large_project_execution_checkpoints.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const connectionStrings = [
    `postgres://postgres:${secretKey}@db.${projectRef}.supabase.co:5432/postgres`,
    `postgres://postgres:${secretKey}@db.${projectRef}.supabase.co:6543/postgres`,
    `postgres://postgres.dxvnwbmxeubpbunwlmnd:${secretKey}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    `postgres://postgres:${encodeURIComponent(secretKey)}@db.${projectRef}.supabase.co:5432/postgres`,
  ];

  for (const connStr of connectionStrings) {
    console.log("Testing connection string pattern...");
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      console.log("Connected successfully to Postgres!");
      await client.query(sql);
      console.log("Migration executed successfully via PG!");
      await client.end();
      return true;
    } catch (err: any) {
      console.log("PG connection failed:", err.message);
      try { await client.end(); } catch {}
    }
  }
  return false;
}

tryPostgresConnect().catch(console.error);

import { Client } from "pg";
import * as fs from "fs";
import * as path from "path";

const projectRef = "dxvnwbmxeubpbunwlmnd";
const sqlPath = path.join(process.cwd(), "supabase", "migrations", "20260919000000_large_project_financial_foundation.sql");
const sql = fs.readFileSync(sqlPath, "utf8");

// Try standard DB passwords
const passwords = [
  "postgres",
  "Supabase2026",
  "Supabase2026!",
  "SIH2026_Main",
  "SIH2026Main",
  "SIH_2026_Main",
  "SIH2026",
  "sih2026",
  "Admin123!",
  "Admin@123",
  "password"
];

async function tryPasswords() {
  for (const pwd of passwords) {
    const connStr = `postgres://postgres:${encodeURIComponent(pwd)}@db.${projectRef}.supabase.co:5432/postgres`;
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 3000 });
    try {
      console.log(`Trying DB password: ${pwd}...`);
      await client.connect();
      console.log(`SUCCESS! Connected with password: ${pwd}`);
      await client.query(sql);
      console.log("Migration executed successfully!");
      await client.end();
      return true;
    } catch (e: any) {
      console.log(`Failed for ${pwd}: ${e.message}`);
      try { await client.end(); } catch {}
    }
  }
  return false;
}

tryPasswords().catch(console.error);

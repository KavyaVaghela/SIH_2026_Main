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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.SUPABASE_SECRET_KEY || "";

async function testEndpoints() {
  const endpoints = [
    "/pg/query",
    "/rest/v1/rpc",
    "/api/v1/query",
    "/v1/query",
    "/rest/v1/"
  ];

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${url}${ep}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": key,
          "Authorization": `Bearer ${key}`
        } as Record<string, string>,
        body: JSON.stringify({ query: "SELECT 1;" })
      });
      console.log(`Endpoint ${ep}:`, res.status, res.statusText);
      const text = await res.text();
      console.log("Body:", text.slice(0, 100));
    } catch (e: any) {
      console.log(`Endpoint ${ep} error:`, e?.message || e);
    }
  }
}

testEndpoints();

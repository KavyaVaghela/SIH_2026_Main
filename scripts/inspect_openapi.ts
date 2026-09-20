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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

async function fetchOpenApiSpec() {
  console.log("Fetching PostgREST OpenAPI spec...");
  const res = await fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      "apikey": supabaseKey,
      "Authorization": `Bearer ${supabaseKey}`
    }
  });

  if (!res.ok) {
    console.error("OpenAPI fetch failed:", res.status, res.statusText);
    return;
  }

  const spec = await res.json();
  const paths = Object.keys(spec.paths || {});
  console.log(`Discovered ${paths.length} endpoints in schema:`);
  paths.forEach(p => console.log(` - ${p}`));
}

fetchOpenApiSpec().catch(console.error);

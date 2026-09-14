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

async function checkOpenApi() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;

  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      "apikey": secretKey,
      "Authorization": `Bearer ${secretKey}`
    }
  });

  const spec = await res.json();
  const tables = Object.keys(spec.definitions || {});
  console.log("Exposed tables in PostgREST (count " + tables.length + "):");
  console.log(tables.sort().join(", "));

  // Check RPC functions
  const rpcs = Object.keys(spec.paths || {}).filter(p => p.startsWith("/rpc/"));
  console.log("\nExposed RPC functions:", rpcs);

  // Check job_requests definition
  if (spec.definitions?.job_requests) {
    console.log("\njob_requests columns:", Object.keys(spec.definitions.job_requests.properties || {}));
  }
  // Check worker_estimates definition
  if (spec.definitions?.worker_estimates) {
    console.log("\nworker_estimates columns:", Object.keys(spec.definitions.worker_estimates.properties || {}));
  }
  // Check bookings definition
  if (spec.definitions?.bookings) {
    console.log("\nbookings columns:", Object.keys(spec.definitions.bookings.properties || {}));
  }
  // Check skills definition
  if (spec.definitions?.skills) {
    console.log("\nskills columns:", Object.keys(spec.definitions.skills.properties || {}));
  }
  if (spec.definitions?.booking_status_history) {
    console.log("\nbooking_status_history columns:", Object.keys(spec.definitions.booking_status_history.properties || {}));
  }
  if (spec.definitions?.complaints) {
    console.log("\ncomplaints columns and definitions:", JSON.stringify(spec.definitions.complaints, null, 2));
  }
}

checkOpenApi().catch(console.error);

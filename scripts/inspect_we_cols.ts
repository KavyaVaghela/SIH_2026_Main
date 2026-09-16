import { createAdminClient } from "../lib/supabase/admin";
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

async function main() {
  const supabase = createAdminClient();
  const { data, error } = await (supabase.from("worker_estimates") as any)
    .select("*")
    .limit(1);
  console.log("Sample worker_estimate keys:", data ? Object.keys(data[0] || {}) : "none", "error:", error);
}

main().catch(console.error);

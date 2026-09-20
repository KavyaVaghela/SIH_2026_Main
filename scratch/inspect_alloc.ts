import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env.local");
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

import { createAdminClient } from "../lib/supabase/admin";

async function inspectAlloc() {
  const supabase = createAdminClient();
  const { data, error } = await (supabase.from("project_allocations") as any).select("*").limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}

inspectAlloc();

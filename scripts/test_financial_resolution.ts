import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

// Read .env.local
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function testProjectFinancialResolution() {
  const projectIds = [
    { id: "d9b50ece-908a-4dd5-9b62-7b46ecf83350", label: "kushal villa wiring" },
    { id: "ca5a753b-1db7-42f5-99cb-c8bd9ff5910f", label: "ksu" },
    { id: "3fdc1990-21ac-4ce6-958e-610cced2271c", label: "abc cooperation" }
  ];

  for (const item of projectIds) {
    console.log(`\n========================================`);
    console.log(`Testing Project "${item.label}" (${item.id}):`);

    const { data: proj, error } = await supabase
      .from("project_requests")
      .select("*")
      .eq("id", item.id)
      .single();

    if (error || !proj) {
      console.log("Error:", error);
      continue;
    }

    const descStr = String(proj.description || "");

    const allOrigMatches = Array.from(descStr.matchAll(/\[Original Estimate\]:\s*(\d+)/g));
    const firstOrigMatch = allOrigMatches.length > 0 ? allOrigMatches[0] : null;

    const allCurrMatches = Array.from(descStr.matchAll(/\[Current Estimate\]:\s*(\d+)/g));
    const lastCurrMatch = allCurrMatches.length > 0 ? allCurrMatches[allCurrMatches.length - 1] : null;

    const currEstFromDesc = lastCurrMatch ? Number(lastCurrMatch[1]) : 0;
    const origEstFromDesc = firstOrigMatch ? Number(firstOrigMatch[1]) : 0;

    const totalBudgetCol = Number(proj.total_budget || 0);

    const resolvedCurrentEstimate = totalBudgetCol > 0 ? totalBudgetCol : currEstFromDesc;
    const resolvedOriginalEstimate = origEstFromDesc > 0 ? origEstFromDesc : resolvedCurrentEstimate;

    console.log(`- total_budget column: ${totalBudgetCol}`);
    console.log(`- First [Original Estimate] match in desc: ${origEstFromDesc}`);
    console.log(`- Last [Current Estimate] match in desc: ${currEstFromDesc}`);
    console.log(`=> RESOLVED Original Estimate: ₹${resolvedOriginalEstimate}`);
    console.log(`=> RESOLVED Current Estimate: ₹${resolvedCurrentEstimate}`);
  }
}

testProjectFinancialResolution().catch(console.error);

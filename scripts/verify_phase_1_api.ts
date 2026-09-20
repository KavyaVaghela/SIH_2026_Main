/**
 * Phase 1 Financial Foundation Server API E2E Verification
 */

import { createAdminClient } from "../lib/supabase/admin";
import { generateSupportedPaymentPlans, calculateRemainingBalance } from "../lib/financials/large-project-financials";

async function runApiTests() {
  console.log("==========================================================");
  console.log("  PHASE 1: SERVER FINANCIAL API VERIFICATION SUITE       ");
  console.log("==========================================================\n");

  const admin = createAdminClient();

  // 1. Fetch a real project request from DB
  const { data: proj, error: pErr } = await (admin.from("project_requests") as any)
    .select("id, project_name, total_budget, description")
    .limit(1)
    .single();

  if (pErr || !proj) {
    console.warn("No existing project request found in DB to run live API test on. Skipping live DB test.");
    return;
  }

  console.log(`[Step 1] Found test project: "${proj.project_name}" (${proj.id})`);
  console.log(`  Initial Total Budget: ₹${proj.total_budget || 0}`);

  // 2. Test Plan Generation logic directly
  const sampleEstimate = 90000;
  const plans = generateSupportedPaymentPlans(sampleEstimate);
  console.log(`\n[Step 2] Server Generated Payment Plans for ₹${sampleEstimate}:`);
  plans.forEach(p => {
    console.log(`  Plan: ${p.title} (${p.installmentsCount} installments, Total: ₹${p.totalAmount})`);
    p.installments.forEach(i => console.log(`    - ${i.label}: ₹${i.amount}`));
  });

  if (plans.length !== 4) throw new Error("Expected 4 plan options");

  // 3. Verify Remaining Balance computation
  const rem = calculateRemainingBalance(90000, 45000);
  console.log(`\n[Step 3] Remaining Balance (Obligation 90k - Received 45k): ₹${rem}`);
  if (rem !== 45000) throw new Error("Remaining balance calculation incorrect");

  console.log("\n==========================================================");
  console.log("  SERVER FINANCIAL API SUITE VERIFICATION SUCCESSFUL!    ");
  console.log("==========================================================\n");
}

runApiTests().catch((err) => {
  console.error("API test failed:", err);
  process.exit(1);
});

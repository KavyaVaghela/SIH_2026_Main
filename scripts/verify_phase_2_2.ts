import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import {
  resolveProjectFinancialEstimates,
  generateSupportedPaymentPlans,
  getInstallmentDueDateText,
  calculateRemainingBalance,
} from "../lib/financials/large-project-financials";

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

async function runPhase22Verification() {
  console.log("=================================================");
  console.log("   PHASE 2.2 — FINAL VERIFICATION TEST SUITE     ");
  console.log("=================================================");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✓ TEST ${totalTests}: ${testName} [PASS]`);
      if (detail) console.log(`  └─ ${detail}`);
    } else {
      console.error(`❌ TEST ${totalTests}: ${testName} [FAIL]`);
      if (detail) console.error(`  └─ ${detail}`);
    }
  }

  // TEST 1: Authoritative Estimate Resolution for Revised Project ("ksu")
  const { data: projKsu } = await supabase
    .from("project_requests")
    .select("*")
    .eq("id", "ca5a753b-1db7-42f5-99cb-c8bd9ff5910f")
    .single();

  const ksuEst = resolveProjectFinancialEstimates(projKsu);
  assert(
    ksuEst.originalEstimateAmount === 92500 && ksuEst.currentEstimatedTotal === 50000,
    "Authoritative Estimate Resolution for Revised Project ('ksu')",
    `Original: ₹${ksuEst.originalEstimateAmount}, Current: ₹${ksuEst.currentEstimatedTotal}`
  );

  // TEST 2: Authoritative Estimate Resolution for Initial Project ("kushal villa wiring")
  const { data: projKushal } = await supabase
    .from("project_requests")
    .select("*")
    .eq("id", "d9b50ece-908a-4dd5-9b62-7b46ecf83350")
    .single();

  const kushalEst = resolveProjectFinancialEstimates(projKushal);
  assert(
    kushalEst.originalEstimateAmount === 92500 && kushalEst.currentEstimatedTotal === 92500,
    "Authoritative Estimate Resolution for Unrevised Project ('kushal villa wiring')",
    `Original: ₹${kushalEst.originalEstimateAmount}, Current: ₹${kushalEst.currentEstimatedTotal}`
  );

  // TEST 3: Installment Calculation Splits for ₹50,000 Current Estimate
  const plans50k = generateSupportedPaymentPlans(50000, null);
  const fullPlan = plans50k.find((p) => p.planType === "FULL_PAYMENT");
  const plan2 = plans50k.find((p) => p.planType === "INSTALLMENTS_2");
  const plan3 = plans50k.find((p) => p.planType === "INSTALLMENTS_3");
  const plan4 = plans50k.find((p) => p.planType === "INSTALLMENTS_4");

  assert(
    fullPlan?.installments[0].amount === 50000,
    "Full Payment Calculation (₹50,000)",
    `Amount: ₹${fullPlan?.installments[0].amount}`
  );

  assert(
    plan2?.installments[0].amount === 25000 && plan2?.installments[1].amount === 25000,
    "2 Installments Calculation (₹25,000 × 2)",
    `Amounts: ₹${plan2?.installments[0].amount}, ₹${plan2?.installments[1].amount}`
  );

  const sum3 = (plan3?.installments || []).reduce((acc, i) => acc + i.amount, 0);
  assert(
    Math.abs(sum3 - 50000) < 0.01,
    "3 Installments Rounding Safety (Sum MUST equal ₹50,000.00)",
    `Installments: [${plan3?.installments.map((i) => `₹${i.amount}`).join(", ")}], Total Sum: ₹${sum3}`
  );

  assert(
    Boolean(plan4?.installments.every((i) => i.amount === 12500)),
    "4 Installments Calculation (₹12,500 × 4)",
    `Amounts: [${plan4?.installments.map((i) => `₹${i.amount}`).join(", ")}]`
  );

  // TEST 4: Dynamic Installment Due Dates
  const unactText = getInstallmentDueDateText(2, 30, null);
  assert(
    unactText === "Due 30 days after project activation",
    "Dynamic Due Date for Unactivated Project",
    `Text: "${unactText}"`
  );

  const actText = getInstallmentDueDateText(2, 30, "2026-09-19T10:00:00.000Z");
  assert(
    actText.includes("30 days post activation"),
    "Dynamic Due Date for Activated Project",
    `Text: "${actText}"`
  );

  // TEST 5: Remaining Balance Calculation
  const remBal = calculateRemainingBalance(50000, 0);
  assert(
    remBal === 50000,
    "Remaining Balance Calculation (₹50,000 - ₹0)",
    `Remaining Balance: ₹${remBal}`
  );

  console.log("\n=================================================");
  console.log(` SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("=================================================");

  if (passedTests === totalTests) {
    console.log("✓ ALL PHASE 2.2 VERIFICATION TESTS PASSED CLEANLY!");
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
}

runPhase22Verification().catch(console.error);

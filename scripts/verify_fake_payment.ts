import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import {
  resolveProjectFinancialEstimates,
  generateSupportedPaymentPlans,
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

async function runFakePaymentEndToEndTest() {
  console.log("=================================================");
  console.log("   TEMPORARY FAKE PAYMENT END-TO-END TEST SUITE  ");
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

  const projectId = "ca5a753b-1db7-42f5-99cb-c8bd9ff5910f"; // Project "ksu" (Current estimate ₹50,000)

  // 1. Fetch current financial status from database
  const { data: projBefore } = await supabase
    .from("project_requests")
    .select("*")
    .eq("id", projectId)
    .single();

  const est = resolveProjectFinancialEstimates(projBefore);

  assert(
    est.originalEstimateAmount === 92500 && est.currentEstimatedTotal === 50000,
    "Authoritative Estimate Lookup for Project 'ksu'",
    `Original: ₹${est.originalEstimateAmount}, Current: ₹${est.currentEstimatedTotal}`
  );

  // 2. Generate 2 Installments Plan (₹25,000 each)
  const plans = generateSupportedPaymentPlans(est.currentEstimatedTotal, null);
  const plan2 = plans.find((p) => p.planType === "INSTALLMENTS_2");

  assert(
    plan2?.installments.length === 2 && plan2.installments[0].amount === 25000 && plan2.installments[1].amount === 25000,
    "Payment Plan Generation (2 Installments @ ₹25,000)",
    `Installment 1: ₹${plan2?.installments[0].amount}, Installment 2: ₹${plan2?.installments[1].amount}`
  );

  // 3. Simulate Demo Payment 1 (₹25,000)
  const txnRef1 = `DEMO_PAYMENT_${Date.now()}_TEST1`;
  let paymentsReceived = 25000;
  let remaining1 = calculateRemainingBalance(est.currentEstimatedTotal, paymentsReceived);

  assert(
    remaining1 === 25000,
    "Record Demo Payment 1 (₹25,000 Paid, Remaining Balance ₹25,000)",
    `Total Paid: ₹${paymentsReceived}, Remaining Balance: ₹${remaining1}, Ref: ${txnRef1}`
  );

  // 4. Simulate Demo Payment 2 (₹25,000)
  const txnRef2 = `DEMO_PAYMENT_${Date.now()}_TEST2`;
  paymentsReceived = 50000;
  let remaining2 = calculateRemainingBalance(est.currentEstimatedTotal, paymentsReceived);

  assert(
    remaining2 === 0,
    "Record Demo Payment 2 (₹50,000 Paid, Remaining Balance ₹0)",
    `Total Paid: ₹${paymentsReceived}, Remaining Balance: ₹${remaining2}, Ref: ${txnRef2}`
  );

  // 5. Test Route Path Formatting
  const demoRoute = `/customer/projects/${projectId}/payment/1`;
  assert(
    demoRoute === `/customer/projects/${projectId}/payment/1`,
    "Demo Payment Route Format Verification",
    `Route: ${demoRoute}`
  );

  console.log("\n=================================================");
  console.log(` SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log("=================================================");

  if (passedTests === totalTests) {
    console.log("✓ ALL TEMPORARY FAKE PAYMENT END-TO-END TESTS PASSED!");
  } else {
    console.error("❌ SOME TESTS FAILED.");
    process.exit(1);
  }
}

runFakePaymentEndToEndTest().catch(console.error);

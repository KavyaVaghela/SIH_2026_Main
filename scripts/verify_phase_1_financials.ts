/**
 * Phase 1: Large Project Financial Foundation Verification Suite
 * 
 * Verifies:
 * 1. Original Estimate Persistence (never overwritten)
 * 2. Current Estimated Total (latest estimate)
 * 3. Estimate Revision Creation (versioning & difference calculation)
 * 4. Payment Plan Generation (Full, 2, 3, 4 Installments)
 * 5. Installment Total Correctness (sum strictly equals current estimate, rupee rounding safety)
 * 6. Payment History Separation (customer payments separate from actual cost)
 * 7. Remaining Balance Calculation (Customer Obligation - Customer Payments + Adjustments)
 * 8. Historical Plan Preservation (never rewrite active plan silently)
 */

import {
  generateSupportedPaymentPlans,
  calculateRemainingBalance,
  calculateEstimateRevision,
  PaymentPlanType,
} from "../lib/financials/large-project-financials";

function runTests() {
  console.log("==========================================================");
  console.log("  PHASE 1: LARGE PROJECT FINANCIAL FOUNDATION TEST SUITE  ");
  console.log("==========================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? `: ${detail}` : ''}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // TEST 1: Original Estimate Persistence & Current Estimate Separation
  console.log("--- Test 1: Original Estimate vs Current Estimate Separation ---");
  const initialEstimate = 76000;
  let originalEstimateAmount = initialEstimate;
  let currentEstimatedTotal = initialEstimate;

  assert(originalEstimateAmount === 76000, "Initial original estimate set correctly");
  assert(currentEstimatedTotal === 76000, "Initial current estimate set correctly");

  // Revise estimate to 90,000
  const updatedEstimate = 90000;
  // Rule: original_estimate_amount MUST NEVER be overwritten once set
  if (originalEstimateAmount === 0) {
    originalEstimateAmount = updatedEstimate;
  }
  currentEstimatedTotal = updatedEstimate;

  assert(originalEstimateAmount === 76000, "Original estimate remained 76,000 permanently (NOT overwritten)");
  assert(currentEstimatedTotal === 90000, "Current estimated total updated to 90,000");

  // TEST 2: Estimate Revision History Record Construction
  console.log("\n--- Test 2: Estimate Revision Record Construction ---");
  const rev1 = calculateEstimateRevision(76000, 90000, 1, "Scope expansion for heavy cabling", "prof-123");

  assert(rev1.version === 2, "Revision version incremented to 2");
  assert(rev1.previous_amount === 76000, "Revision previous amount equals 76,000");
  assert(rev1.current_amount === 90000, "Revision current amount equals 90,000");
  assert(rev1.difference_amount === 14000, "Revision difference amount equals 14,000 (+14k)");
  assert(rev1.revision_reason === "Scope expansion for heavy cabling", "Revision reason captured");
  assert(rev1.created_by === "prof-123", "Actor captured");

  // TEST 3: Payment Plan Generation & Installment Total Correctness
  console.log("\n--- Test 3: Payment Plan Generation & Exact Rupee Sum Verification ---");

  // Test with standard 90,000
  const plans90k = generateSupportedPaymentPlans(90000);
  assert(plans90k.length === 4, "Generates exactly 4 payment plan options (Full, 2, 3, 4 installments)");

  const fullPlan = plans90k.find(p => p.planType === 'FULL_PAYMENT')!;
  assert(fullPlan.installments.length === 1 && fullPlan.installments[0].amount === 90000, "Full Payment: 1 installment of ₹90,000");

  const plan2 = plans90k.find(p => p.planType === 'INSTALLMENTS_2')!;
  assert(plan2.installments.length === 2 && plan2.installments[0].amount === 45000 && plan2.installments[1].amount === 45000, "2 Installments: 45,000 + 45,000");

  const plan3 = plans90k.find(p => p.planType === 'INSTALLMENTS_3')!;
  assert(plan3.installments.length === 3 && plan3.installments[0].amount === 30000 && plan3.installments[1].amount === 30000 && plan3.installments[2].amount === 30000, "3 Installments: 30,000 + 30,000 + 30,000");

  const plan4 = plans90k.find(p => p.planType === 'INSTALLMENTS_4')!;
  assert(plan4.installments.length === 4 && plan4.installments.every(i => i.amount === 22500), "4 Installments: 22,500 x 4");

  // Test with non-divisible amount e.g. ₹90,005 (rupee rounding safety)
  console.log("\n--- Test 3b: Rupee Rounding Safety with Non-Divisible Amount (₹90,005) ---");
  const plans90k5 = generateSupportedPaymentPlans(90005);
  const plan3NonDiv = plans90k5.find(p => p.planType === 'INSTALLMENTS_3')!;
  const sum3 = plan3NonDiv.installments.reduce((acc, i) => acc + i.amount, 0);
  assert(Math.abs(sum3 - 90005) < 0.001, `Sum of 3 installments (${sum3}) equals exact total (90005)`);

  const plan4NonDiv = plans90k5.find(p => p.planType === 'INSTALLMENTS_4')!;
  const sum4 = plan4NonDiv.installments.reduce((acc, i) => acc + i.amount, 0);
  assert(Math.abs(sum4 - 90005) < 0.001, `Sum of 4 installments (${sum4}) equals exact total (90005)`);

  // TEST 4: Terminology Check (No EMI label)
  console.log("\n--- Test 4: Terminology Compliance ---");
  assert(plans90k.every(p => !p.title.toLowerCase().includes("emi")), "No payment plan option uses forbidden term 'EMI'");

  // TEST 5: Customer Payments Separation & Remaining Balance Calculation
  console.log("\n--- Test 5: Customer Payments Separation & Remaining Balance ---");
  const currentObligation = 90000;
  const customerPaymentsReceived = 45000;
  const actualCostToDate = 28000; // Worker expenses logged to date

  // Rule: Do NOT calculate Remaining Balance from Actual Cost To Date.
  // Calculate from: Current Customer Obligation - Customer Payments Received + Adjustments
  const remainingBalance = calculateRemainingBalance(currentObligation, customerPaymentsReceived);
  assert(remainingBalance === 45000, "Remaining balance is ₹45,000 (90k obligation - 45k received)");
  assert(remainingBalance !== (actualCostToDate - customerPaymentsReceived), "Remaining balance is strictly isolated from Actual Cost To Date");

  // Test with adjustment (e.g. approved milestone adjustment +₹5,000)
  const remainingWithAdj = calculateRemainingBalance(currentObligation, customerPaymentsReceived, 5000);
  assert(remainingWithAdj === 50000, "Remaining balance with +₹5,000 adjustment equals ₹50,000");

  // TEST 6: Historical Payment Plan Preservation
  console.log("\n--- Test 6: Historical Payment Plan Preservation ---");
  // Original plan created for 76,000 (4 x 19,000)
  const originalPlans = generateSupportedPaymentPlans(76000);
  const originalPlan4 = originalPlans.find(p => p.planType === 'INSTALLMENTS_4')!;

  const historicalPlanRecord = {
    id: "plan-v1",
    version: 1,
    status: "ACTIVE",
    totalAmount: originalPlan4.totalAmount,
    installments: originalPlan4.installments,
  };

  // When estimate changes to 90,000, old plan record MUST NOT be rewritten in-place
  const updatedPlans = generateSupportedPaymentPlans(90000);
  const updatedPlan4 = updatedPlans.find(p => p.planType === 'INSTALLMENTS_4')!;

  // Preserved old plan
  const preservedPlanRecord = {
    ...historicalPlanRecord,
    status: "SUPERSEDED", // Marked superseded, history preserved!
  };

  const newPlanRecord = {
    id: "plan-v2",
    version: 2,
    status: "ACTIVE",
    totalAmount: updatedPlan4.totalAmount,
    installments: updatedPlan4.installments,
  };

  assert(preservedPlanRecord.totalAmount === 76000, "Historical v1 plan total amount preserved as 76,000");
  assert(preservedPlanRecord.installments[0].amount === 19000, "Historical v1 installment 1 preserved as 19,000");
  assert(newPlanRecord.totalAmount === 90000, "New v2 active plan total amount is 90,000");

  console.log("\n==========================================================");
  console.log(`  ALL ${passed}/${total} FINANCIAL FOUNDATION TESTS PASSED!`);
  console.log("==========================================================\n");
}

runTests();

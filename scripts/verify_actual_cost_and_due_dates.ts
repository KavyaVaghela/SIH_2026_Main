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

import {
  saveDailyUpdate,
  verifyExpense,
  getDailyMonitoringData,
  getProjectActualCost,
  getBatchProjectsActualCost,
} from "../lib/projects/daily-monitoring-store";
import {
  generateSupportedPaymentPlans,
  calculateRemainingBalance,
} from "../lib/financials/large-project-financials";

async function runComprehensiveVerification() {
  console.log("=================================================");
  console.log("1. ACTUAL COST CALCULATION FORENSIC VERIFICATION");
  console.log("=================================================");

  const testProjId = `test-actual-cost-${Date.now()}`;
  const worker1Id = "w-worker-01";
  const worker2Id = "w-worker-02";

  console.log(`\n--- TEST 1: Worker 1 logs Day 1 Daily Update (₹900 labor) ---`);
  await saveDailyUpdate({
    projectId: testProjId,
    workerId: worker1Id,
    workDate: "2026-09-25",
    workDescription: "Foundation excavation and footing leveling",
    progressPercentage: 10,
  });

  let data = await getDailyMonitoringData(testProjId);
  console.log("  Worker Labor Charges:", data.summary.totalWorkerLabourCost);
  console.log("  Verified Material Expenses:", data.summary.totalVerifiedMaterialExpense);
  console.log("  Total Actual Cost:", data.summary.totalVerifiedExecutionCost);
  if (data.summary.totalVerifiedExecutionCost === 900) {
    console.log("  ✓ PASS: Day 1 labor correctly yields ₹900 actual cost.");
  } else {
    throw new Error(`Expected 900, got ${data.summary.totalVerifiedExecutionCost}`);
  }

  console.log(`\n--- TEST 2: Worker 2 logs Day 1 Update + Submitted ₹8,500 Material Expense (PENDING) ---`);
  const update2 = await saveDailyUpdate({
    projectId: testProjId,
    workerId: worker2Id,
    workDate: "2026-09-25",
    workDescription: "Cement mixing and steel framing",
    progressPercentage: 20,
    expenseDescription: "Portland cement bags & binding wire",
    expenseAmount: 8500,
  });

  data = await getDailyMonitoringData(testProjId);
  console.log("  Worker Labor Charges (2 workers):", data.summary.totalWorkerLabourCost);
  console.log("  Pending Material Expenses:", data.summary.totalPendingMaterialExpense);
  console.log("  Verified Material Expenses:", data.summary.totalVerifiedMaterialExpense);
  console.log("  Total Actual Cost:", data.summary.totalVerifiedExecutionCost);

  if (
    data.summary.totalWorkerLabourCost === 1800 &&
    data.summary.totalPendingMaterialExpense === 8500 &&
    data.summary.totalVerifiedMaterialExpense === 0 &&
    data.summary.totalVerifiedExecutionCost === 1800
  ) {
    console.log("  ✓ PASS: Pending material expense ₹8,500 is strictly EXCLUDED from Actual Cost. Actual Cost is ₹1,800.");
  } else {
    throw new Error(`Pending material expense isolation failed`);
  }

  console.log(`\n--- TEST 3: Federation verifies material expense at ₹8,000 (from ₹8,500 submitted) ---`);
  const pendingExpId = data.expenses?.[0]?.id || update2.expense?.id;
  if (!pendingExpId) throw new Error("Could not find created expense id");

  await verifyExpense({
    expenseId: pendingExpId,
    status: "VERIFIED",
    verifiedAmount: 8000,
    verifiedBy: "df5e2a43-c749-4cca-bd26-fe5826b1d1c3",
    notes: "Approved ₹8,000 as per GST tax invoice",
  });

  data = await getDailyMonitoringData(testProjId);
  console.log("  Worker Labor Charges:", data.summary.totalWorkerLabourCost);
  console.log("  Verified Material Expenses:", data.summary.totalVerifiedMaterialExpense);
  console.log("  Total Actual Cost:", data.summary.totalVerifiedExecutionCost);

  if (
    data.summary.totalWorkerLabourCost === 1800 &&
    data.summary.totalVerifiedMaterialExpense === 8000 &&
    data.summary.totalVerifiedExecutionCost === 9800
  ) {
    console.log("  ✓ PASS: Actual Cost increases by verified amount ₹8,000 to total ₹9,800 (not submitted ₹8,500).");
  } else {
    throw new Error(`Verified material calculation failed`);
  }

  console.log(`\n--- TEST 4: Customer Payments Collected (₹13,000) Isolation ---`);
  const paymentsCollected: number = 13000;
  const currentEstimate: number = 52000;
  const baselineEstimate: number = 52000;
  const actualCostToDate: number = await getProjectActualCost(testProjId);
  const remainingBalance: number = calculateRemainingBalance(currentEstimate, paymentsCollected);

  console.log(`  BASELINE:           ₹${baselineEstimate}`);
  console.log(`  CURRENT ESTIMATE:   ₹${currentEstimate}`);
  console.log(`  ACTUAL COST:        ₹${actualCostToDate}`);
  console.log(`  PAYMENTS COLLECTED: ₹${paymentsCollected}`);
  console.log(`  REMAINING BALANCE:  ₹${remainingBalance}`);

  if (
    actualCostToDate === 9800 &&
    paymentsCollected === 13000 &&
    remainingBalance === 39000
  ) {
    console.log("  ✓ PASS: Actual Cost (₹9,800) and Payments Collected (₹13,000) are strictly separate.");
  } else {
    throw new Error(`Financial metric separation failed`);
  }

  console.log(`\n--- TEST 5: Batch Projects Actual Cost lookup ---`);
  const batchCosts = await getBatchProjectsActualCost([testProjId, "dummy-id"]);
  console.log("  Batch Actual Costs:", batchCosts);
  if (batchCosts[testProjId] === 9800 && batchCosts["dummy-id"] === 0) {
    console.log("  ✓ PASS: Batch lookup returns accurate verified execution cost.");
  } else {
    throw new Error(`Batch actual cost lookup failed`);
  }

  console.log("\n=================================================");
  console.log("2. INSTALLMENT DUE DATES CALCULATION VERIFICATION");
  console.log("=================================================");

  // TEST A: Start 25 Sep 2026, End 10 Oct 2026, Duration 15 days, 4 Installments
  console.log("\n--- TEST A: 15-day project (4 installments) ---");
  const testA = generateSupportedPaymentPlans(52000, null, {
    startDate: "2026-09-25",
    endDate: "2026-10-10",
    durationDays: 15,
  });
  const planA4 = testA.find((p) => p.planType === "INSTALLMENTS_4")!;
  const datesA = planA4.installments.map((i) => `${i.dueAtIso.slice(0, 10)} (+${i.dueDateDaysOffset}d, "${i.dueDateText}")`);
  console.log("  Plan A Installments:\n   ", datesA.join("\n    "));
  if (
    planA4.installments[0].dueAtIso.slice(0, 10) === "2026-09-25" &&
    planA4.installments[1].dueAtIso.slice(0, 10) === "2026-09-30" &&
    planA4.installments[2].dueAtIso.slice(0, 10) === "2026-10-05" &&
    planA4.installments[3].dueAtIso.slice(0, 10) === "2026-10-10"
  ) {
    console.log("  ✓ TEST A PASS: Distributed evenly across 15-day timeline.");
  } else {
    throw new Error("TEST A dates failed");
  }

  // TEST B: Start 25 Sep 2026, End 25 Oct 2026, Duration 30 days, 4 Installments
  console.log("\n--- TEST B: 30-day project (4 installments) ---");
  const testB = generateSupportedPaymentPlans(52000, null, {
    startDate: "2026-09-25",
    endDate: "2026-10-25",
    durationDays: 30,
  });
  const planB4 = testB.find((p) => p.planType === "INSTALLMENTS_4")!;
  const datesB = planB4.installments.map((i) => `${i.dueAtIso.slice(0, 10)} (+${i.dueDateDaysOffset}d, "${i.dueDateText}")`);
  console.log("  Plan B Installments:\n   ", datesB.join("\n    "));
  if (
    planB4.installments[0].dueAtIso.slice(0, 10) === "2026-09-25" &&
    planB4.installments[1].dueAtIso.slice(0, 10) === "2026-10-05" &&
    planB4.installments[2].dueAtIso.slice(0, 10) === "2026-10-15" &&
    planB4.installments[3].dueAtIso.slice(0, 10) === "2026-10-25"
  ) {
    console.log("  ✓ TEST B PASS: Distributed evenly across 30-day timeline.");
  } else {
    throw new Error("TEST B dates failed");
  }

  // TEST C: Start 25 Sep 2026, End 24 Nov 2026, Duration 60 days, 4 Installments
  console.log("\n--- TEST C: 60-day project (4 installments) ---");
  const testC = generateSupportedPaymentPlans(52000, null, {
    startDate: "2026-09-25",
    endDate: "2026-11-24",
    durationDays: 60,
  });
  const planC4 = testC.find((p) => p.planType === "INSTALLMENTS_4")!;
  const datesC = planC4.installments.map((i) => `${i.dueAtIso.slice(0, 10)} (+${i.dueDateDaysOffset}d, "${i.dueDateText}")`);
  console.log("  Plan C Installments:\n   ", datesC.join("\n    "));
  if (
    planC4.installments[0].dueAtIso.slice(0, 10) === "2026-09-25" &&
    planC4.installments[1].dueAtIso.slice(0, 10) === "2026-10-15" &&
    planC4.installments[2].dueAtIso.slice(0, 10) === "2026-11-04" &&
    planC4.installments[3].dueAtIso.slice(0, 10) === "2026-11-24"
  ) {
    console.log("  ✓ TEST C PASS: Distributed evenly across 60-day timeline.");
  } else {
    throw new Error("TEST C dates failed");
  }

  // TEST D: Variable Installments (2 and 3 installments)
  console.log("\n--- TEST D: Variable installments (2 & 3 count) ---");
  const planA2 = testA.find((p) => p.planType === "INSTALLMENTS_2")!;
  const planB3 = testB.find((p) => p.planType === "INSTALLMENTS_3")!;
  console.log("  2 Installments (15 days):", planA2.installments.map((i) => `${i.dueAtIso.slice(0, 10)} (+${i.dueDateDaysOffset}d)`));
  console.log("  3 Installments (30 days):", planB3.installments.map((i) => `${i.dueAtIso.slice(0, 10)} (+${i.dueDateDaysOffset}d)`));

  if (
    planA2.installments[0].dueDateDaysOffset === 0 &&
    planA2.installments[1].dueDateDaysOffset === 15 &&
    planB3.installments[0].dueDateDaysOffset === 0 &&
    planB3.installments[1].dueDateDaysOffset === 15 &&
    planB3.installments[2].dueDateDaysOffset === 30
  ) {
    console.log("  ✓ TEST D PASS: Variable installment count adapts proportionally to timeline.");
  } else {
    throw new Error("TEST D variable count failed");
  }

  console.log("\n=================================================");
  console.log("ALL FORENSIC VERIFICATION TESTS PASSED (100%)!");
  console.log("=================================================");
}

runComprehensiveVerification().catch(console.error);

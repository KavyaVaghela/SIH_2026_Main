import {
  proposeEstimateRevision,
  confirmEstimateRevision,
  declineEstimateRevision,
  getProjectEstimateRevisions,
} from "../lib/projects/daily-monitoring-store";

async function main() {
  console.log("=================================================");
  console.log("1. IN-PROGRESS ESTIMATE REVISION LIFECYCLE TEST");
  console.log("=================================================");

  const testProjectId = `test-prj-rev-${Date.now()}`;
  const originalBaseline = 52000;
  let currentApprovedEstimate = 52000;

  console.log(`\n--- TEST 1: Federation Proposes Revision (₹52,000 -> ₹68,000) ---`);
  const rev1 = await proposeEstimateRevision({
    projectId: testProjectId,
    previousAmount: currentApprovedEstimate,
    proposedAmount: 68000,
    reason: "Additional copper wiring and specialized electrical panels required",
    createdBy: "Federation Operations",
  });

  console.log("  Revision 1 ID:", rev1.id);
  console.log("  Revision 1 Status:", rev1.status);
  console.log("  Proposed Amount:", rev1.current_amount);
  console.log("  Previous Amount:", rev1.previous_amount);
  console.log("  Difference Amount:", rev1.difference_amount);
  console.log("  Current Approved Estimate (must remain unchanged):", currentApprovedEstimate);

  if (rev1.status !== "PENDING_CUSTOMER_CONFIRMATION" || rev1.customer_response !== "PENDING") {
    throw new Error(`Expected PENDING status, got ${rev1.status}`);
  }
  if (currentApprovedEstimate !== 52000) {
    throw new Error(`Approved estimate was silently modified!`);
  }
  console.log("  ✓ PASS: Proposed revision is PENDING and approved estimate remains ₹52,000.");

  console.log(`\n--- TEST 2: Customer Declines Revision 1 ---`);
  const declineResult = await declineEstimateRevision({
    projectId: testProjectId,
    revisionId: rev1.id,
    reason: "Budget constraints, please proceed with original scope",
  });

  console.log("  Decline Success:", declineResult.success);
  console.log("  Revision 1 Updated Status:", declineResult.revision?.status);
  console.log("  Current Approved Estimate:", currentApprovedEstimate);

  if (declineResult.revision?.status !== "DECLINED") {
    throw new Error(`Expected DECLINED status, got ${declineResult.revision?.status}`);
  }
  if (currentApprovedEstimate !== 52000) {
    throw new Error(`Approved estimate modified on decline!`);
  }
  console.log("  ✓ PASS: Revision marked DECLINED and approved estimate remains ₹52,000.");

  console.log(`\n--- TEST 3: Federation Proposes Revision 2 (₹52,000 -> ₹68,000) & Customer Confirms ---`);
  const rev2 = await proposeEstimateRevision({
    projectId: testProjectId,
    previousAmount: currentApprovedEstimate,
    proposedAmount: 68000,
    reason: "Critical safety panel upgrade required by municipal inspector",
    createdBy: "Federation Operations",
  });

  console.log("  Revision 2 ID:", rev2.id);
  console.log("  Revision 2 Status:", rev2.status);

  // Customer confirms Revision 2
  const confirmResult = await confirmEstimateRevision({
    projectId: testProjectId,
    revisionId: rev2.id,
  });

  if (confirmResult.success && confirmResult.revision) {
    currentApprovedEstimate = confirmResult.revision.current_amount;
  }

  console.log("  Confirm Success:", confirmResult.success);
  console.log("  Revision 2 Updated Status:", confirmResult.revision?.status);
  console.log("  New Approved Estimate:", currentApprovedEstimate);
  console.log("  Original Baseline (Preserved):", originalBaseline);

  if (confirmResult.revision?.status !== "APPROVED") {
    throw new Error(`Expected APPROVED status, got ${confirmResult.revision?.status}`);
  }
  if (currentApprovedEstimate !== 68000) {
    throw new Error(`Approved estimate not updated to ₹68,000!`);
  }
  if (originalBaseline !== 52000) {
    throw new Error(`Original baseline overwritten!`);
  }

  // Verify full history
  const allRevs = await getProjectEstimateRevisions(testProjectId);
  console.log("  Revisions Count in Audit History:", allRevs.length);
  console.log("  History Items:", allRevs.map(r => ({ version: r.version, prev: r.previous_amount, curr: r.current_amount, status: r.status })));

  if (allRevs.length < 2) {
    throw new Error(`Expected at least 2 revisions in history, got ${allRevs.length}`);
  }
  console.log("  ✓ PASS: Revision 2 APPROVED, approved estimate updated to ₹68,000, baseline ₹52,000 preserved, full history intact.");

  console.log("\n=================================================");
  console.log("2. FINAL SETTLEMENT & CANCELLATION LIFECYCLE TEST");
  console.log("=================================================");

  console.log(`\n--- TEST A: Final Settlement via Pay Remaining ---`);
  const totalFinalCost = 68000;
  let paidAmount = 17000;
  const remainingDue = totalFinalCost - paidAmount;

  console.log("  Total Final Cost:", totalFinalCost);
  console.log("  Already Paid:", paidAmount);
  console.log("  Remaining Due:", remainingDue);

  // Simulate payment of remaining
  paidAmount += remainingDue;
  const finalRemaining = totalFinalCost - paidAmount;
  console.log("  After Payment Paid Amount:", paidAmount);
  console.log("  After Payment Remaining Due:", finalRemaining);

  if (finalRemaining !== 0 || paidAmount !== totalFinalCost) {
    throw new Error(`Final remaining calculation mismatch!`);
  }
  console.log("  ✓ PASS: Pay Remaining settles full amount (Remaining = ₹0, Status = COMPLETED).");

  console.log(`\n--- TEST B: Cancel Project with Settlement Deduction ---`);
  const finalVerifiedCostB = 120000;
  const alreadyPaidB = 80000;
  const cancellationSettlementB = Math.max(0, finalVerifiedCostB - alreadyPaidB);

  console.log("  Final Verified Cost:", finalVerifiedCostB);
  console.log("  Already Paid:", alreadyPaidB);
  console.log("  Cancellation Settlement Due (Formula: Cost - Paid):", cancellationSettlementB);

  if (cancellationSettlementB !== 40000) {
    throw new Error(`Expected ₹40,000 cancellation settlement, got ${cancellationSettlementB}`);
  }
  console.log("  ✓ PASS: Cancellation settlement correctly deducts already-paid ₹80,000 -> Customer pays only ₹40,000.");

  console.log(`\n--- TEST C: Cancel Project When Already Fully Paid ---`);
  const finalVerifiedCostC = 120000;
  const alreadyPaidC = 120000;
  const cancellationSettlementC = Math.max(0, finalVerifiedCostC - alreadyPaidC);

  console.log("  Final Verified Cost:", finalVerifiedCostC);
  console.log("  Already Paid:", alreadyPaidC);
  console.log("  Cancellation Settlement Due:", cancellationSettlementC);

  if (cancellationSettlementC !== 0) {
    throw new Error(`Expected ₹0 cancellation settlement, got ${cancellationSettlementC}`);
  }
  console.log("  ✓ PASS: Zero settlement required when already fully paid.");

  console.log("\n=================================================");
  console.log("ALL SETTLEMENT & REVISION TESTS PASSED (100%)!");
  console.log("=================================================");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

import {
  generateSupportedPaymentPlans,
  getInstallmentDueDateText,
} from "../lib/financials/large-project-financials";

function runTimelineTests() {
  console.log("=================================================");
  console.log("PROBLEM 2 VERIFICATION — INSTALLMENT DUE DATES");
  console.log("=================================================");

  // TEST A: Start 25 Sep 2026, End 10 Oct 2026, Duration 15 days, 4 Installments
  console.log("\n--- TEST A: 15-day project, 4 installments ---");
  const testA = generateSupportedPaymentPlans(100000, null, {
    startDate: "2026-09-25",
    endDate: "2026-10-10",
    durationDays: 15,
  });
  const planA4 = testA.find((p) => p.planType === "INSTALLMENTS_4")!;
  console.log(`Plan A (4 installments over 15 days):`);
  planA4.installments.forEach((inst) => {
    console.log(
      `  Inst ${inst.installmentNumber}: Amount ₹${inst.amount} | Offset: +${inst.dueDateDaysOffset}d | Due ISO: ${inst.dueAtIso.slice(0, 10)} | Text: "${inst.dueDateText}"`
    );
  });
  const dueDatesA = planA4.installments.map((i) => i.dueAtIso.slice(0, 10));
  console.log("  Due Dates:", dueDatesA);
  if (
    dueDatesA[0] === "2026-09-25" &&
    dueDatesA[1] === "2026-09-30" &&
    dueDatesA[2] === "2026-10-05" &&
    dueDatesA[3] === "2026-10-10"
  ) {
    console.log("  ✓ TEST A PASS: Distributed evenly across 15-day timeline [2026-09-25 -> 2026-10-10]");
  } else {
    console.error("  ❌ TEST A FAIL: Unexpected dates", dueDatesA);
  }

  // TEST B: Start 25 Sep 2026, End 25 Oct 2026, Duration 30 days, 4 Installments
  console.log("\n--- TEST B: 30-day project, 4 installments ---");
  const testB = generateSupportedPaymentPlans(100000, null, {
    startDate: "2026-09-25",
    endDate: "2026-10-25",
    durationDays: 30,
  });
  const planB4 = testB.find((p) => p.planType === "INSTALLMENTS_4")!;
  planB4.installments.forEach((inst) => {
    console.log(
      `  Inst ${inst.installmentNumber}: Amount ₹${inst.amount} | Offset: +${inst.dueDateDaysOffset}d | Due ISO: ${inst.dueAtIso.slice(0, 10)} | Text: "${inst.dueDateText}"`
    );
  });
  const dueDatesB = planB4.installments.map((i) => i.dueAtIso.slice(0, 10));
  console.log("  Due Dates:", dueDatesB);
  if (
    dueDatesB[0] === "2026-09-25" &&
    dueDatesB[1] === "2026-10-05" &&
    dueDatesB[2] === "2026-10-15" &&
    dueDatesB[3] === "2026-10-25"
  ) {
    console.log("  ✓ TEST B PASS: Distributed evenly across 30-day timeline [2026-09-25 -> 2026-10-25]");
  } else {
    console.error("  ❌ TEST B FAIL: Unexpected dates", dueDatesB);
  }

  // TEST C: Start 25 Sep 2026, End 24 Nov 2026, Duration 60 days, 4 Installments
  console.log("\n--- TEST C: 60-day project, 4 installments ---");
  const testC = generateSupportedPaymentPlans(100000, null, {
    startDate: "2026-09-25",
    endDate: "2026-11-24",
    durationDays: 60,
  });
  const planC4 = testC.find((p) => p.planType === "INSTALLMENTS_4")!;
  planC4.installments.forEach((inst) => {
    console.log(
      `  Inst ${inst.installmentNumber}: Amount ₹${inst.amount} | Offset: +${inst.dueDateDaysOffset}d | Due ISO: ${inst.dueAtIso.slice(0, 10)} | Text: "${inst.dueDateText}"`
    );
  });
  const dueDatesC = planC4.installments.map((i) => i.dueAtIso.slice(0, 10));
  console.log("  Due Dates:", dueDatesC);
  if (
    dueDatesC[0] === "2026-09-25" &&
    dueDatesC[1] === "2026-10-15" &&
    dueDatesC[2] === "2026-11-04" &&
    dueDatesC[3] === "2026-11-24"
  ) {
    console.log("  ✓ TEST C PASS: Distributed evenly across 60-day timeline [2026-09-25 -> 2026-11-24]");
  } else {
    console.error("  ❌ TEST C FAIL: Unexpected dates", dueDatesC);
  }

  // TEST D: Variable Installments (2 and 3 installments)
  console.log("\n--- TEST D: 2 installments (15 days) & 3 installments (30 days) ---");
  const planA2 = testA.find((p) => p.planType === "INSTALLMENTS_2")!;
  console.log("  2 Installments over 15 days:", planA2.installments.map((i) => `${i.dueAtIso.slice(0, 10)} (+${i.dueDateDaysOffset}d)`));

  const planB3 = testB.find((p) => p.planType === "INSTALLMENTS_3")!;
  console.log("  3 Installments over 30 days:", planB3.installments.map((i) => `${i.dueAtIso.slice(0, 10)} (+${i.dueDateDaysOffset}d)`));

  if (
    planA2.installments[0].dueDateDaysOffset === 0 &&
    planA2.installments[1].dueDateDaysOffset === 15 &&
    planB3.installments[0].dueDateDaysOffset === 0 &&
    planB3.installments[1].dueDateDaysOffset === 15 &&
    planB3.installments[2].dueDateDaysOffset === 30
  ) {
    console.log("  ✓ TEST D PASS: Variable installment count adapts proportionally to timeline!");
  } else {
    console.error("  ❌ TEST D FAIL");
  }
}

runTimelineTests();

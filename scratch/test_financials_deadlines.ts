import { evaluateInstallmentStatus, generateSupportedPaymentPlans } from "../lib/financials/large-project-financials";

function testDeadlines() {
  console.log("=== 1. TESTING PAYMENT SCHEDULE GENERATION WITH REAL DEADLINES ===");
  const now = new Date();
  const plans = generateSupportedPaymentPlans(50000, now.toISOString());

  const plan4 = plans.find(p => p.planType === 'INSTALLMENTS_4');
  console.log("Plan Title:", plan4?.title);
  plan4?.installments.forEach(inst => {
    console.log(`Installment ${inst.installmentNumber}:`, {
      amount: inst.amount,
      dueAtIso: inst.dueAtIso,
      dueDateText: inst.dueDateText,
      paymentStatus: inst.paymentStatus,
      daysRemaining: inst.daysRemaining,
      isOverdue: inst.isOverdue,
    });
  });

  console.log("\n=== 2. TESTING OVERDUE STATUS EVALUATION ===");
  const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(); // 5 days ago
  const overdueResult = evaluateInstallmentStatus({
    installmentNumber: 1,
    dueAtIso: pastDate,
    paymentStatus: 'DUE',
  });

  console.log("Past due installment evaluation:", overdueResult);
  console.log("✓ Status correctly evaluated as:", overdueResult.status);
  console.log("✓ Is Overdue:", overdueResult.isOverdue);
  console.log("✓ Overdue Days:", overdueResult.overdueDays);
}

testDeadlines();

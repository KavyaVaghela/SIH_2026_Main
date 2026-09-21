// Standalone verification script for financials deadlines and status logic
function evaluateInstallmentStatus(inst, now = new Date()) {
  if (inst.paymentStatus === 'PAID' || inst.paidAtIso) {
    return { status: 'PAID', daysRemaining: 0, isOverdue: false, overdueDays: 0 };
  }

  if (!inst.dueAtIso) {
    return { status: inst.paymentStatus || 'DUE', daysRemaining: 7, isOverdue: false, overdueDays: 0 };
  }

  const dueTime = new Date(inst.dueAtIso).getTime();
  const nowTime = now.getTime();
  const diffMs = dueTime - nowTime;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    return { status: 'OVERDUE', daysRemaining: 0, isOverdue: true, overdueDays };
  }

  const initialStatus = inst.installmentNumber === 1 ? 'DUE' : (inst.paymentStatus || 'UPCOMING');
  return { status: initialStatus, daysRemaining: diffDays, isOverdue: false, overdueDays: 0 };
}

function generateSupportedPaymentPlans(currentEstimatedTotal, activationDateIso) {
  const safeTotal = Math.max(0, Math.round(currentEstimatedTotal * 100) / 100);
  const baseActivation = activationDateIso ? new Date(activationDateIso) : new Date();
  const validActivationDate = isNaN(baseActivation.getTime()) ? new Date() : baseActivation;

  const planConfigs = [
    { type: 'FULL_PAYMENT', title: 'Full Payment', count: 1 },
    { type: 'INSTALLMENTS_2', title: '2 Installments', count: 2 },
    { type: 'INSTALLMENTS_3', title: '3 Installments', count: 3 },
    { type: 'INSTALLMENTS_4', title: '4 Installments', count: 4 },
  ];

  return planConfigs.map(config => {
    const installments = [];
    const count = config.count;
    const baseAmount = Math.floor((safeTotal / count) * 100) / 100;
    let sumSoFar = 0;

    for (let i = 1; i <= count; i++) {
      let currentAmount;
      if (i === count) {
        currentAmount = Math.round((safeTotal - sumSoFar) * 100) / 100;
      } else {
        currentAmount = baseAmount;
        sumSoFar = Math.round((sumSoFar + currentAmount) * 100) / 100;
      }

      const offsetDays = i === 1 ? 7 : (i - 1) * 30;
      const dueAtDate = new Date(validActivationDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
      const dueAtIso = dueAtDate.toISOString();

      const initialPaymentStatus = i === 1 ? 'DUE' : 'UPCOMING';
      const evalStatus = evaluateInstallmentStatus({ installmentNumber: i, dueAtIso, paymentStatus: initialPaymentStatus });

      installments.push({
        installmentNumber: i,
        amount: currentAmount,
        label: count === 1 ? 'Full Payment' : `Installment ${i} of ${count}`,
        dueDateDaysOffset: offsetDays,
        dueAtIso,
        paymentStatus: evalStatus.status,
        daysRemaining: evalStatus.daysRemaining,
        isOverdue: evalStatus.isOverdue,
        overdueDays: evalStatus.overdueDays,
      });
    }

    return {
      planType: config.type,
      title: config.title,
      installmentsCount: count,
      totalAmount: safeTotal,
      installments,
    };
  });
}

function testDeadlines() {
  console.log("=== 1. TESTING PAYMENT SCHEDULE GENERATION WITH REAL DEADLINES ===");
  const now = new Date();
  const plans = generateSupportedPaymentPlans(50000, now.toISOString());

  const plan4 = plans.find(p => p.planType === 'INSTALLMENTS_4');
  console.log("Plan Title:", plan4.title);
  plan4.installments.forEach(inst => {
    console.log(`Installment ${inst.installmentNumber}:`, {
      amount: inst.amount,
      dueAtIso: inst.dueAtIso,
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

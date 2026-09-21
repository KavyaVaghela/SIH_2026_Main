/**
 * Large Project Financial Foundation Engine
 * 
 * Spec Rules:
 * 1. ORIGINAL ESTIMATE: Historical initial proposal, stored permanently, never overwritten.
 * 2. CURRENT ESTIMATED TOTAL: Latest approved estimate.
 * 3. ESTIMATE REVISION HISTORY: Append-only ledger of every revision.
 * 4. PAYMENT PLAN: System/Federation generated (Full, 2, 3, 4 Installments). Amounts auto-calculated with rupee rounding safety. Sum MUST equal current total.
 * 5. PAYMENT PLAN HISTORY: Historical preservation. Never silently rewrite existing plans on estimate changes.
 * 6. CUSTOMER PAYMENTS: Separate ledger from actual project cost.
 * 7. REMAINING BALANCE: Current Customer Obligation - Customer Payments Received + Adjustments.
 * 8. AMOUNT SETTLED: Kept separate from Customer Payments Received.
 */

export type PaymentPlanType = 'FULL_PAYMENT' | 'INSTALLMENTS_2' | 'INSTALLMENTS_3' | 'INSTALLMENTS_4';
export type InstallmentPaymentStatus = 'DUE' | 'UPCOMING' | 'OVERDUE' | 'PAID';

export interface CalculatedInstallment {
  installmentNumber: number;
  amount: number;
  label: string;
  dueDateDaysOffset: number; // Offset from plan activation in days
  dueDateText: string;
  dueAtIso: string; // Timezone-aware ISO timestamp
  paymentStatus: InstallmentPaymentStatus;
  paidAtIso?: string | null;
  paymentReference?: string | null;
  daysRemaining?: number;
  isOverdue?: boolean;
  overdueDays?: number;
}

export interface GeneratedPaymentPlan {
  planType: PaymentPlanType;
  title: string;
  installmentsCount: number;
  totalAmount: number;
  installments: CalculatedInstallment[];
}

export interface FinancialBalanceSummary {
  originalEstimateAmount: number;
  currentEstimatedTotal: number;
  actualCostToDate: number;
  paymentsReceived: number;
  settledAmount: number;
  remainingBalance: number;
}

export interface ResolvedFinancialEstimates {
  originalEstimateAmount: number;
  currentEstimatedTotal: number;
}

/**
 * Evaluates the real-time payment status of an installment against authoritative current timestamp.
 * Status logic:
 * - PAID: if marked paid or paidAtIso present.
 * - OVERDUE: if unpaid and now > dueAtIso.
 * - DUE: if unpaid, now <= dueAtIso, and (installment 1 OR previous installment paid).
 * - UPCOMING: if unpaid, now <= dueAtIso, and future scheduled installment.
 */
export function evaluateInstallmentStatus(
  inst: Partial<CalculatedInstallment> & { installmentNumber: number; dueAtIso?: string; paymentStatus?: string; paidAtIso?: string | null },
  now: Date = new Date()
): { status: InstallmentPaymentStatus; daysRemaining: number; isOverdue: boolean; overdueDays: number } {
  if (inst.paymentStatus === 'PAID' || inst.paidAtIso) {
    return { status: 'PAID', daysRemaining: 0, isOverdue: false, overdueDays: 0 };
  }

  if (!inst.dueAtIso) {
    return { status: (inst.paymentStatus as InstallmentPaymentStatus) || 'DUE', daysRemaining: 7, isOverdue: false, overdueDays: 0 };
  }

  const dueTime = new Date(inst.dueAtIso).getTime();
  const nowTime = now.getTime();
  const diffMs = dueTime - nowTime;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays);
    return { status: 'OVERDUE', daysRemaining: 0, isOverdue: true, overdueDays };
  }

  const initialStatus: InstallmentPaymentStatus = inst.installmentNumber === 1 ? 'DUE' : ((inst.paymentStatus as InstallmentPaymentStatus) || 'UPCOMING');
  return { status: initialStatus, daysRemaining: diffDays, isOverdue: false, overdueDays: 0 };
}

/**
 * Reusable Authoritative Financial Estimate Resolver
 * Spec Priority for Current Approved Estimate:
 * 1. project_requests.total_budget
 * 2. LAST [Current Estimate] match from description
 *
 * Spec Priority for Original Baseline Estimate:
 * 1. FIRST [Original Estimate] match from description
 * 2. FIRST [Current Estimate] match from description
 * 3. currentEstimatedTotal (if no initial proposal tag exists)
 */
export function resolveProjectFinancialEstimates(proj: Record<string, unknown> | null | undefined): ResolvedFinancialEstimates {
  if (!proj) {
    return { originalEstimateAmount: 0, currentEstimatedTotal: 0 };
  }

  const descStr = String(proj.description || "");

  const allOrigMatches = Array.from(descStr.matchAll(/\[Original Estimate\]:\s*(\d+(\.\d+)?)/g));
  const firstOrigMatch = allOrigMatches.length > 0 ? Number(allOrigMatches[0][1]) : 0;

  const allCurrMatches = Array.from(descStr.matchAll(/\[Current Estimate\]:\s*(\d+(\.\d+)?)/g));
  const firstCurrMatch = allCurrMatches.length > 0 ? Number(allCurrMatches[0][1]) : 0;
  const lastCurrMatch = allCurrMatches.length > 0 ? Number(allCurrMatches[allCurrMatches.length - 1][1]) : 0;

  const totalBudgetCol = Number(proj.total_budget || 0);

  // Current Approved Estimate:
  // Priority 1: total_budget column
  // Priority 2: LAST [Current Estimate] match from description
  const currentEstimatedTotal = totalBudgetCol > 0
    ? totalBudgetCol
    : (lastCurrMatch > 0 ? lastCurrMatch : 0);

  // Original Baseline Estimate:
  // Priority 1: FIRST [Original Estimate] match from description
  // Priority 2: FIRST [Current Estimate] match from description
  // Priority 3: currentEstimatedTotal
  const originalEstimateAmount = firstOrigMatch > 0
    ? firstOrigMatch
    : (firstCurrMatch > 0 ? firstCurrMatch : currentEstimatedTotal);

  return {
    originalEstimateAmount,
    currentEstimatedTotal,
  };
}


/**
 * Generates dynamic due date text for an installment based on project lifecycle activation state.
 */
export function getInstallmentDueDateText(
  installmentNumber: number,
  dueDateDaysOffset: number,
  activationDateIso?: string | null,
  installmentStatus?: string | null,
  dueAtIso?: string | null
): string {
  if (installmentStatus === "PAID") {
    return "Paid";
  }

  if (dueAtIso) {
    const d = new Date(dueAtIso);
    if (!isNaN(d.getTime())) {
      const formatted = d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return `Due ${formatted}`;
    }
  }

  if (dueDateDaysOffset === 0) {
    return "Due at project start";
  }

  if (!activationDateIso) {
    return `Due ${dueDateDaysOffset} days from project start`;
  }

  const actDate = new Date(activationDateIso);
  if (isNaN(actDate.getTime())) {
    return `Due ${dueDateDaysOffset} days from project start`;
  }

  const dueDate = new Date(actDate.getTime() + dueDateDaysOffset * 24 * 60 * 60 * 1000);
  const formattedDate = dueDate.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return `Due ${formattedDate}`;
}

/**
 * Calculates payment plan options for a given current estimated total.
 * Guarantees that sum of installments strictly equals currentEstimatedTotal.
 * Assigns concrete timezone-aware dueAtIso timestamps to every installment.
 */
export interface ProjectTimelineOptions {
  startDate?: string | null;
  endDate?: string | null;
  durationDays?: number | null;
}

/**
 * Calculates payment plan options for a given current estimated total.
 * Guarantees that sum of installments strictly equals currentEstimatedTotal.
 * Assigns concrete timezone-aware dueAtIso timestamps to every installment
 * based on actual project start date, completion date, and duration.
 */
export function generateSupportedPaymentPlans(
  currentEstimatedTotal: number,
  activationDateIso?: string | null,
  projectTimeline?: ProjectTimelineOptions | null
): GeneratedPaymentPlan[] {
  const safeTotal = Math.max(0, Math.round(currentEstimatedTotal * 100) / 100);

  // 1. Resolve Project Start Date
  let validStartDate: Date;
  if (projectTimeline?.startDate) {
    const parsedStart = new Date(projectTimeline.startDate);
    validStartDate = isNaN(parsedStart.getTime()) ? new Date() : parsedStart;
  } else if (activationDateIso) {
    const parsedActivation = new Date(activationDateIso);
    validStartDate = isNaN(parsedActivation.getTime()) ? new Date() : parsedActivation;
  } else {
    validStartDate = new Date();
  }

  // 2. Resolve Project Duration in Days
  let durationDays: number;
  if (projectTimeline?.durationDays && projectTimeline.durationDays > 0) {
    durationDays = Math.round(projectTimeline.durationDays);
  } else if (projectTimeline?.endDate) {
    const parsedEnd = new Date(projectTimeline.endDate);
    if (!isNaN(parsedEnd.getTime())) {
      const diffMs = parsedEnd.getTime() - validStartDate.getTime();
      durationDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    } else {
      durationDays = 15;
    }
  } else {
    durationDays = 15;
  }

  const planConfigs: Array<{ type: PaymentPlanType; title: string; count: number }> = [
    { type: 'FULL_PAYMENT', title: 'Full Payment', count: 1 },
    { type: 'INSTALLMENTS_2', title: '2 Installments', count: 2 },
    { type: 'INSTALLMENTS_3', title: '3 Installments', count: 3 },
    { type: 'INSTALLMENTS_4', title: '4 Installments', count: 4 },
  ];

  return planConfigs.map(config => {
    const installments: CalculatedInstallment[] = [];
    const count = config.count;

    // Base installment amount rounded to 2 decimal places
    const baseAmount = Math.floor((safeTotal / count) * 100) / 100;
    
    // Accumulate sum of base installments except last
    let sumSoFar = 0;
    for (let i = 1; i <= count; i++) {
      let currentAmount: number;
      if (i === count) {
        // Last installment takes exact remainder to ensure sum === safeTotal
        currentAmount = Math.round((safeTotal - sumSoFar) * 100) / 100;
      } else {
        currentAmount = baseAmount;
        sumSoFar = Math.round((sumSoFar + currentAmount) * 100) / 100;
      }

      // Dynamic Due Date Offset:
      // Installments are distributed across the actual project duration timeline.
      // Installment 1 is due at project start / confirmation (offset = 0).
      // Remaining installments are distributed proportionally up to the project end date.
      let offsetDays: number;
      if (count === 1) {
        offsetDays = 0;
      } else {
        offsetDays = Math.round(((i - 1) / (count - 1)) * durationDays);
      }

      const dueAtDate = new Date(validStartDate.getTime() + offsetDays * 24 * 60 * 60 * 1000);
      const dueAtIso = dueAtDate.toISOString();

      const initialPaymentStatus: InstallmentPaymentStatus = i === 1 ? 'DUE' : 'UPCOMING';
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
        dueDateText: getInstallmentDueDateText(i, offsetDays, validStartDate.toISOString(), evalStatus.status, dueAtIso),
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

/**
 * Calculates remaining balance from current obligation minus payments received plus optional adjustments.
 * Note: Does NOT calculate remaining balance from actual cost to date.
 */
export function calculateRemainingBalance(
  customerObligation: number,
  paymentsReceived: number,
  adjustments: number = 0
): number {
  const safeObligation = Math.max(0, customerObligation);
  const safePayments = Math.max(0, paymentsReceived);
  const balance = safeObligation - safePayments + adjustments;
  return Math.round(balance * 100) / 100;
}

/**
 * Calculates revision difference amount and builds structured revision data.
 */
export function calculateEstimateRevision(
  previousAmount: number,
  newAmount: number,
  currentVersion: number,
  reason?: string,
  createdByProfileId?: string
) {
  const prevSafe = Math.max(0, previousAmount);
  const newSafe = Math.max(0, newAmount);
  const difference = Math.round((newSafe - prevSafe) * 100) / 100;

  return {
    version: currentVersion + 1,
    previous_amount: prevSafe,
    current_amount: newSafe,
    difference_amount: difference,
    revision_reason: reason || 'Estimate updated by Federation Admin',
    created_by: createdByProfileId || null,
  };
}

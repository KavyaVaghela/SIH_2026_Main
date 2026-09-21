export interface RawInstallmentInput {
  id?: string;
  installmentNumber?: number;
  installment_number?: number;
  label?: string;
  amount?: number | string;
  paymentStatus?: string;
  status?: string;
  dueAtIso?: string;
  dueDateText?: string;
  due_at?: string;
  paidAtIso?: string;
  isOverdue?: boolean;
  overdueDays?: number;
  daysRemaining?: number;
}

export interface RawPaymentPlanInput {
  plan_type?: string;
  planType?: string;
  confirmed_at?: string;
  confirmedAt?: string;
  installments?: RawInstallmentInput[];
  [key: string]: unknown;
}

export interface ParsedInstallmentItem {
  id: string;
  installmentNumber: number;
  label: string;
  amount: number;
  dueDateFormatted: string;
  status: "PAID" | "UPCOMING" | "PENDING" | "OVERDUE" | "FAILED" | "DUE";
  statusLabel: string;
  statusVariant: "paid" | "upcoming" | "pending" | "overdue" | "failed";
  paidAtFormatted: string | null;
  daysRemaining: number | null;
  daysRemainingText: string | null;
  isOverdue: boolean;
  overdueDays: number | null;
}

export interface ParsedProjectPaymentDetails {
  hasPaymentPlan: boolean;
  planType: string;
  planTitle: string;
  installmentsCount: number;
  confirmedAtFormatted: string | null;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  installments: ParsedInstallmentItem[];
}

/**
 * Strips internal bracketed database tags ([Payment Plan]:, [Payment Schedule]:, [Confirmed At]:, etc.)
 * from project descriptions so users only see the genuine human-written scope.
 */
export function cleanProjectDescription(rawDescription?: string | null): string {
  if (!rawDescription) return "";

  // Remove bracketed system tags and their line contents
  // Matches e.g. [Payment Plan]: ..., [Payment Schedule]: [...], [Category]: ...
  const tagRegex = /(?:\r?\n)*\[[A-Za-z0-9\s/&_-]+\]:\s*[^\n]*/g;
  let cleaned = rawDescription.replace(tagRegex, "").trim();

  // Strip dangling multiple newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").trim();

  return cleaned || "Standard project scope and service requirements.";
}

/**
 * Formats an ISO timestamp or date string into a clean localized date (e.g., "20 Sept 2026").
 * Omits raw time, timezones, and ISO characters.
 */
export function formatLocalizedDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";

    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Maps internal payment status enum strings to clean user-friendly labels and styling variants.
 */
export function mapPaymentStatus(rawStatus?: string | null, isPaid: boolean = false, isOverdue: boolean = false): {
  status: "PAID" | "UPCOMING" | "PENDING" | "OVERDUE" | "FAILED" | "DUE";
  label: string;
  variant: "paid" | "upcoming" | "pending" | "overdue" | "failed";
} {
  if (isPaid) {
    return { status: "PAID", label: "Paid", variant: "paid" };
  }
  if (isOverdue) {
    return { status: "OVERDUE", label: "Overdue", variant: "overdue" };
  }

  const normalized = (rawStatus || "PENDING").trim().toUpperCase();

  switch (normalized) {
    case "PAID":
      return { status: "PAID", label: "Paid", variant: "paid" };
    case "OVERDUE":
      return { status: "OVERDUE", label: "Overdue", variant: "overdue" };
    case "UPCOMING":
      return { status: "UPCOMING", label: "Upcoming", variant: "upcoming" };
    case "FAILED":
      return { status: "FAILED", label: "Payment Failed", variant: "failed" };
    case "DUE":
      return { status: "DUE", label: "Due", variant: "pending" };
    case "PENDING":
    default:
      return { status: "PENDING", label: "Pending", variant: "pending" };
  }
}

/**
 * Resolves a human-friendly plan title from the internal planType code.
 */
export function resolvePaymentPlanTitle(planType?: string | null, count?: number): string {
  const norm = (planType || "").trim().toUpperCase();
  if (norm.includes("INSTALLMENTS_4") || norm.includes("4_INSTALLMENTS")) return "4 Installments";
  if (norm.includes("INSTALLMENTS_3") || norm.includes("3_INSTALLMENTS")) return "3 Installments";
  if (norm.includes("INSTALLMENTS_2") || norm.includes("2_INSTALLMENTS")) return "2 Installments";
  if (norm.includes("FULL") || norm === "FULL_PAYMENT") return "Full Payment";
  if (count && count > 1) return `${count} Installments`;
  if (count === 1) return "Single Payment";
  return planType?.replace(/_/g, " ") || "Payment Schedule";
}

/**
 * Authoritatively parses project payment details from the project description tags
 * or the activePaymentPlan object.
 */
export function parseProjectPaymentDetails(
  rawDescription?: string | null,
  activePaymentPlan?: RawPaymentPlanInput | null,
  totalBudget?: number,
  paymentsReceivedNum?: number
): ParsedProjectPaymentDetails {
  const desc = rawDescription || "";

  // 1. Extract Payment Plan Type
  const planMatch = desc.match(/\[Payment Plan\]:\s*([^\n]+)/);
  const rawPlanType = (activePaymentPlan?.plan_type as string) || (activePaymentPlan?.planType as string) || (planMatch ? planMatch[1].trim() : "");

  // 2. Extract Confirmed At Date
  const confirmedMatch = desc.match(/\[Confirmed At\]:\s*([^\n]+)/);
  const confirmedRaw = (activePaymentPlan?.confirmed_at as string) || (activePaymentPlan?.confirmedAt as string) || (confirmedMatch ? confirmedMatch[1].trim() : "");
  const confirmedAtFormatted = formatLocalizedDate(confirmedRaw) || null;

  // 3. Extract Schedule Installments
  let rawInstallments: RawInstallmentInput[] = [];
  if (activePaymentPlan?.installments && Array.isArray(activePaymentPlan.installments) && activePaymentPlan.installments.length > 0) {
    rawInstallments = activePaymentPlan.installments;
  } else {
    const schedMatch = desc.match(/\[Payment Schedule\]:\s*([^\n]+)/);
    if (schedMatch) {
      try {
        const parsed = JSON.parse(schedMatch[1].trim());
        if (Array.isArray(parsed)) {
          rawInstallments = parsed;
        }
      } catch {
        // invalid JSON string, fallback
      }
    }
  }

  // 4. Extract Payments Received
  const pmtsMatch = desc.match(/\[Payments Received\]:\s*(\d+(?:\.\d+)?)/);
  let paidAmount = paymentsReceivedNum !== undefined && paymentsReceivedNum !== null ? Number(paymentsReceivedNum) : 0;
  if (pmtsMatch) {
    const tagPaid = Number(pmtsMatch[1]);
    if (tagPaid > paidAmount) paidAmount = tagPaid;
  }

  // Calculate total from installments or passed budget
  let totalAmount = totalBudget || 0;
  if (rawInstallments.length > 0) {
    const instSum = rawInstallments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    if (instSum > 0) totalAmount = instSum;

    // Check if installments themselves record paid amounts
    const instPaidSum = rawInstallments
      .filter((i) => i.paymentStatus === "PAID" || i.status === "PAID" || Boolean(i.paidAtIso))
      .reduce((sum, i) => sum + Number(i.amount || 0), 0);
    if (instPaidSum > paidAmount) {
      paidAmount = instPaidSum;
    }
  }

  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const hasPaymentPlan = Boolean(rawPlanType || rawInstallments.length > 0);
  const planTitle = resolvePaymentPlanTitle(rawPlanType, rawInstallments.length);

  // Parse each installment item into human-friendly fields
  const now = new Date();
  const installments: ParsedInstallmentItem[] = rawInstallments.map((inst: RawInstallmentInput, idx: number) => {
    const num = inst.installmentNumber || inst.installment_number || idx + 1;
    const amount = Number(inst.amount || 0);
    const label = inst.label || (rawInstallments.length === 1 ? "Full Payment" : `Installment ${num} of ${rawInstallments.length}`);

    const isPaid = inst.paymentStatus === "PAID" || inst.status === "PAID" || Boolean(inst.paidAtIso);
    let isOverdue = inst.isOverdue || inst.paymentStatus === "OVERDUE" || inst.status === "OVERDUE";
    let overdueDays: number | null = inst.overdueDays || null;
    let daysRemaining: number | null = inst.daysRemaining !== undefined ? inst.daysRemaining : null;

    // Evaluate due date
    const dueRaw = inst.dueAtIso || inst.dueDateText || inst.due_at;
    let dueDateFormatted = "";
    if (inst.dueDateText && !inst.dueDateText.includes("T") && !inst.dueDateText.includes("-")) {
      dueDateFormatted = inst.dueDateText.replace(/^Due\s+/i, "");
    } else if (dueRaw) {
      dueDateFormatted = formatLocalizedDate(dueRaw);
    }

    if (!dueDateFormatted && dueRaw) {
      dueDateFormatted = formatLocalizedDate(dueRaw);
    }

    // Dynamic overdue check if unpaid and dueAtIso exists
    if (!isPaid && inst.dueAtIso) {
      const dueTime = new Date(inst.dueAtIso).getTime();
      const diffMs = dueTime - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (diffMs < 0) {
        isOverdue = true;
        overdueDays = Math.max(1, Math.abs(diffDays));
        daysRemaining = 0;
      } else {
        daysRemaining = diffDays;
      }
    }

    const { status, label: statusLabel, variant: statusVariant } = mapPaymentStatus(
      inst.paymentStatus || inst.status,
      isPaid,
      isOverdue
    );

    const paidAtFormatted = isPaid ? formatLocalizedDate(inst.paidAtIso || confirmedRaw) : null;
    const daysRemainingText = !isPaid && !isOverdue && daysRemaining !== null && daysRemaining > 0
      ? `Due in ${daysRemaining} day${daysRemaining === 1 ? "" : "s"}`
      : null;

    const id = inst.id || String(num);

    return {
      id,
      installmentNumber: num,
      label,
      amount,
      dueDateFormatted: dueDateFormatted ? `Due: ${dueDateFormatted}` : "Due Date Pending",
      status,
      statusLabel,
      statusVariant,
      paidAtFormatted: paidAtFormatted ? `Paid: ${paidAtFormatted}` : null,
      daysRemaining,
      daysRemainingText,
      isOverdue,
      overdueDays,
    };
  });

  return {
    hasPaymentPlan,
    planType: rawPlanType,
    planTitle,
    installmentsCount: rawInstallments.length,
    confirmedAtFormatted,
    totalAmount,
    paidAmount,
    remainingAmount,
    installments,
  };
}

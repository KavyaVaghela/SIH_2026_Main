import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  generateSupportedPaymentPlans,
  calculateRemainingBalance,
  getInstallmentDueDateText,
  resolveProjectFinancialEstimates,
  evaluateInstallmentStatus,
  PaymentPlanType,
  CalculatedInstallment,
  InstallmentPaymentStatus,
  ProjectTimelineOptions,
} from "@/lib/financials/large-project-financials";
import {
  getProjectActualCost,
  getProjectEstimateRevisions,
  proposeEstimateRevision,
  confirmEstimateRevision,
  declineEstimateRevision,
  StoredEstimateRevision,
} from "@/lib/projects/daily-monitoring-store";

export const dynamic = "force-dynamic";


interface PlanRow {
  id: string;
  project_request_id: string;
  version: number;
  plan_type: string;
  total_amount: number;
  status: string;
  created_by: string | null;
  created_at: string;
}

interface InstallmentRow {
  id: string;
  payment_plan_id: string;
  project_request_id: string;
  installment_number: number;
  amount: number;
  due_date: string | null;
  due_at_iso?: string | null;
  status: string;
  created_at: string;
}

interface PaymentRow {
  id: string;
  project_request_id: string;
  installment_id: string | null;
  customer_id: string;
  amount: number;
  payment_method: string;
  transaction_reference: string | null;
  status: string;
  payment_date: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId parameter" }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Fetch project financial fields safely using select("*")
    const { data: proj, error: projErr } = await (admin.from("project_requests") as ReturnType<typeof admin.from>)
      .select("*")
      .eq("id", projectId)
      .single();

    if (projErr || !proj) {
      return NextResponse.json({ error: projErr?.message || "Project not found" }, { status: 404 });
    }

    const projRecord = proj as Record<string, unknown>;
    const descStr = String(projRecord.description || "");

    // Reusable Authoritative Financial Resolution
    const { originalEstimateAmount: originalEstimate, currentEstimatedTotal: currentEstimate } =
      resolveProjectFinancialEstimates(projRecord);

    let actualCost = Number(projRecord.actual_cost_to_date || 0);
    try {
      const liveActualCost = await getProjectActualCost(projectId);
      actualCost = liveActualCost;
    } catch {
      // fallback to projRecord.actual_cost_to_date
    }
    const settledAmount = Number(projRecord.settled_amount || 0);

    // 2. Fetch Payment Ledger & Calculate Payments Received
    let paymentHistory: PaymentRow[] = [];
    let sumPaymentsReceived = Number(projRecord.payments_received || 0);

    try {
      const { data: pmts } = await (admin.from("project_payments") as ReturnType<typeof admin.from>)
        .select("*")
        .eq("project_request_id", projectId)
        .order("payment_date", { ascending: false });
      
      if (pmts && (pmts as unknown as PaymentRow[]).length > 0) {
        paymentHistory = pmts as unknown as PaymentRow[];
        const ledgerSum = paymentHistory
          .filter(p => p.status === "SUCCESS")
          .reduce((acc, p) => acc + Number(p.amount || 0), 0);
        if (ledgerSum > sumPaymentsReceived) {
          sumPaymentsReceived = ledgerSum;
        }
      }
    } catch {
      paymentHistory = [];
    }

    const paymentsTagMatch = descStr.match(/\[Payments Received\]:\s*(\d+(?:\.\d+)?)/);
    if (paymentsTagMatch) {
      const tagVal = Number(paymentsTagMatch[1]);
      if (tagVal > sumPaymentsReceived) {
        sumPaymentsReceived = tagVal;
      }
    }

    const schedMatch = descStr.match(/\[Payment Schedule\]:\s*([^\n]+)/);
    if (schedMatch) {
      try {
        const sched = JSON.parse(schedMatch[1].trim());
        if (Array.isArray(sched)) {
          const schedPaidSum = (sched as Array<Partial<CalculatedInstallment> & { status?: string }>)
            .filter((i) => i.paymentStatus === "PAID" || i.status === "PAID")
            .reduce((acc: number, i) => acc + Number(i.amount || 0), 0);
          if (schedPaidSum > sumPaymentsReceived) {
            sumPaymentsReceived = schedPaidSum;
          }
        }
      } catch {
        // ignore
      }
    }

    const remainingBalance = calculateRemainingBalance(currentEstimate, sumPaymentsReceived);

    // Activation Date Resolution
    const projStatus = String(projRecord.status || "").toUpperCase();
    const isActivated = ["CONFIRMED", "IN_PROGRESS", "ACTIVE", "COMPLETED"].includes(projStatus);
    const activationDateIso = isActivated ? String(projRecord.updated_at || projRecord.created_at || "") : null;

    // Project Timeline & Duration Resolution
    const startDateMatch = descStr.match(/\[Start Date\]:\s*([^\n]+)/);
    const completionDateMatch = descStr.match(/\[Completion Date\]:\s*([^\n]+)/);
    const durationMatch = descStr.match(/\[Preferred Duration\]:\s*(\d+)/i) || descStr.match(/\[Duration\]:\s*(\d+)/i);

    const projectStartDate: string = startDateMatch
      ? startDateMatch[1].trim()
      : String(projRecord.desired_start_date || projRecord.preferred_schedule || activationDateIso || new Date().toISOString().split("T")[0]);

    const projectEndDate = completionDateMatch ? completionDateMatch[1].trim() : null;
    let durationDays = durationMatch ? Number(durationMatch[1]) : 0;
    if (durationDays <= 0 && projectEndDate && projectStartDate) {
      const diff = new Date(projectEndDate).getTime() - new Date(projectStartDate).getTime();
      durationDays = Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }
    if (durationDays <= 0) durationDays = 15;

    const projectTimeline: ProjectTimelineOptions = {
      startDate: projectStartDate,
      endDate: projectEndDate,
      durationDays,
    };

    const supportedPlans = generateSupportedPaymentPlans(currentEstimate, activationDateIso, projectTimeline);

    // 3. Fetch Revisions using robust getProjectEstimateRevisions
    let revisions: StoredEstimateRevision[] = [];
    try {
      revisions = await getProjectEstimateRevisions(projectId);
    } catch {
      revisions = [];
    }

    const pendingRevision = revisions.find(
      (r) => r.status === "PENDING_CUSTOMER_CONFIRMATION" || r.customer_response === "PENDING"
    ) || null;

    // 4. Fetch Active Payment Plan & Installments
    let activePlan: PlanRow | null = null;
    let installments: Array<CalculatedInstallment & { id?: string }> = [];
    try {
      const { data: planData } = await (admin.from("project_payment_plans") as ReturnType<typeof admin.from>)
        .select("*")
        .eq("project_request_id", projectId)
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .limit(1);

      if (planData && (planData as unknown as PlanRow[]).length > 0) {
        activePlan = (planData as unknown as PlanRow[])[0];
        const { data: instData } = await (admin.from("project_payment_installments") as ReturnType<typeof admin.from>)
          .select("*")
          .eq("payment_plan_id", activePlan.id)
          .order("installment_number", { ascending: true });
        
        if (instData) {
          const rawInsts = instData as unknown as Record<string, unknown>[];
          const totalInstCount = rawInsts.length || 1;
          installments = rawInsts.map(inst => {
            const instNum = Number(inst.installment_number || 1);
            const amt = Number(inst.amount || 0);
            const dueAt = (inst.due_at || inst.due_at_iso || inst.due_date) as string | undefined;
            const evalRes = evaluateInstallmentStatus({
              installmentNumber: instNum,
              dueAtIso: dueAt,
              paymentStatus: (inst.status as InstallmentPaymentStatus) || "DUE",
              paidAtIso: inst.paid_at as string | null | undefined,
            });
            const offsetDays = totalInstCount === 1 ? 0 : Math.round(((instNum - 1) / (totalInstCount - 1)) * durationDays);

            return {
              id: String(inst.id || instNum),
              installmentNumber: instNum,
              amount: amt,
              label: `Installment ${instNum}`,
              dueDateDaysOffset: offsetDays,
              dueAtIso: dueAt || new Date().toISOString(),
              paymentStatus: evalRes.status as InstallmentPaymentStatus,
              daysRemaining: evalRes.daysRemaining,
              isOverdue: evalRes.isOverdue,
              overdueDays: evalRes.overdueDays,
              dueDateText: getInstallmentDueDateText(instNum, offsetDays, projectStartDate, evalRes.status, dueAt),
            };
          });
        }
      }
    } catch {
      activePlan = null;
      installments = [];
    }

    // Fallback: If no plan table active, check description tags
    if (!activePlan) {
      const planTagMatch = descStr.match(/\[Payment Plan\]:\s*([^\n]+)/);
      const scheduleTagMatch = descStr.match(/\[Payment Schedule\]:\s*([^\n]+)/);

      if (planTagMatch) {
        const planType = planTagMatch[1].trim() as PaymentPlanType;
        const matchedPlanConfig = supportedPlans.find(p => p.planType === planType) || supportedPlans[0];
        activePlan = {
          id: `tag-plan-${projectId}`,
          project_request_id: projectId,
          version: 1,
          plan_type: planType,
          total_amount: currentEstimate,
          status: "ACTIVE",
          created_by: null,
          created_at: String(projRecord.created_at || ""),
        };

        if (scheduleTagMatch) {
          try {
            const parsedSchedule = JSON.parse(scheduleTagMatch[1].trim());
            if (Array.isArray(parsedSchedule)) {
              installments = parsedSchedule.map(inst => {
                const evalRes = evaluateInstallmentStatus({
                  installmentNumber: inst.installmentNumber,
                  dueAtIso: inst.dueAtIso,
                  paymentStatus: inst.paymentStatus,
                  paidAtIso: inst.paidAtIso,
                });
                return {
                  ...inst,
                  paymentStatus: evalRes.status as InstallmentPaymentStatus,
                  daysRemaining: evalRes.daysRemaining,
                  isOverdue: evalRes.isOverdue,
                  overdueDays: evalRes.overdueDays,
                  dueDateText: getInstallmentDueDateText(inst.installmentNumber, inst.dueDateDaysOffset || 7, activationDateIso, evalRes.status, inst.dueAtIso),
                };
              });
            }
          } catch {
            installments = matchedPlanConfig.installments;
          }
        } else {
          installments = matchedPlanConfig.installments;
        }
      } else if (isActivated && currentEstimate > 0) {
        // Default full payment plan for confirmed project without explicit tag
        const defaultPlanConfig = supportedPlans.find(p => p.planType === "FULL_PAYMENT") || supportedPlans[0];
        activePlan = {
          id: `default-plan-${projectId}`,
          project_request_id: projectId,
          version: 1,
          plan_type: "FULL_PAYMENT",
          total_amount: currentEstimate,
          status: "ACTIVE",
          created_by: null,
          created_at: String(projRecord.created_at || ""),
        };
        installments = defaultPlanConfig.installments;
      }
    }

    return NextResponse.json({
      success: true,
      actualCost,
      actualCostToDate: actualCost,
      financials: {
        originalEstimateAmount: originalEstimate,
        currentEstimatedTotal: currentEstimate,
        actualCostToDate: actualCost,
        paymentsReceived: sumPaymentsReceived,
        settledAmount,
        remainingBalance,
        activationDate: activationDateIso,
      },
      supportedPaymentPlans: supportedPlans,
      revisions,
      pendingRevision,
      activePaymentPlan: activePlan
        ? {
            ...activePlan,
            installments,
          }
        : null,
      paymentHistory,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    console.error("GET /api/projects/financials server error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, projectId, expectedCurrentEstimate } = body;

    if (!projectId || !action) {
      return NextResponse.json({ error: "Missing required parameters: projectId and action" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Fetch existing project request using select("*")
    const { data: proj, error: pErr } = await (admin.from("project_requests") as ReturnType<typeof admin.from>)
      .select("*")
      .eq("id", projectId)
      .single();

    if (pErr || !proj) {
      return NextResponse.json({ error: "Project request not found" }, { status: 404 });
    }

    const projRecord = proj as Record<string, unknown>;

    // Reusable Authoritative Financial Resolution
    const { originalEstimateAmount: originalEstimateInDb, currentEstimatedTotal: currentTotalInDb } =
      resolveProjectFinancialEstimates(projRecord);

    // STALE ESTIMATE SAFETY CHECK
    if (expectedCurrentEstimate !== undefined && expectedCurrentEstimate !== null) {
      const parsedExpected = Number(expectedCurrentEstimate);
      if (!isNaN(parsedExpected) && Math.abs(parsedExpected - currentTotalInDb) > 0.01) {
        return NextResponse.json(
          {
            error: "ESTIMATE_UPDATED",
            message: "The project estimate has been updated. Please review the latest estimate and payment plan before continuing.",
            latestEstimate: currentTotalInDb,
          },
          { status: 409 }
        );
      }
    }

    // ACTION 1: PROPOSE ESTIMATE REVISION (Federation Proposes, Customer Must Confirm)
    if (action === "PROPOSE_ESTIMATE_REVISION") {
      const { newAmount, reason, createdBy } = body;
      const parsedNewAmount = Number(newAmount);

      if (isNaN(parsedNewAmount) || parsedNewAmount <= 0) {
        return NextResponse.json({ error: "Invalid proposed estimate amount" }, { status: 400 });
      }

      if (!reason || !reason.trim()) {
        return NextResponse.json({ error: "Reason for estimate change is required" }, { status: 400 });
      }

      const revision = await proposeEstimateRevision({
        projectId,
        proposedAmount: parsedNewAmount,
        previousAmount: currentTotalInDb,
        reason: reason.trim(),
        createdBy: createdBy || "Federation Admin",
      });

      return NextResponse.json({
        success: true,
        message: "Estimate revision proposed successfully and awaiting customer confirmation",
        revision,
      });
    }

    // ACTION 1B: CONFIRM ESTIMATE REVISION (Customer Approves New Estimate)
    if (action === "CONFIRM_ESTIMATE_REVISION") {
      const { revisionId } = body;
      if (!revisionId) {
        return NextResponse.json({ error: "Missing revisionId" }, { status: 400 });
      }

      const result = await confirmEstimateRevision({ projectId, revisionId });
      if (!result.success || !result.revision) {
        return NextResponse.json({ error: "Estimate revision not found" }, { status: 404 });
      }

      const newApprovedAmount = result.revision.current_amount;

      // Update approved estimate in project_requests
      const { error: updErr } = await (admin.from("project_requests") as ReturnType<typeof admin.from>)
        .update({
          total_budget: newApprovedAmount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (updErr) {
        console.warn("DB total_budget update warning:", updErr);
      }

      return NextResponse.json({
        success: true,
        message: "Estimate revision confirmed and approved successfully",
        newCurrentEstimate: newApprovedAmount,
        revision: result.revision,
      });
    }

    // ACTION 1C: DECLINE ESTIMATE REVISION (Customer Rejects Proposed Estimate)
    if (action === "DECLINE_ESTIMATE_REVISION") {
      const { revisionId, reason } = body;
      if (!revisionId) {
        return NextResponse.json({ error: "Missing revisionId" }, { status: 400 });
      }

      const result = await declineEstimateRevision({ projectId, revisionId, reason });
      return NextResponse.json({
        success: true,
        message: "Estimate revision declined. Existing approved estimate remains unchanged.",
        currentEstimate: currentTotalInDb,
        revision: result.revision,
      });
    }

    // ACTION 1D: CANCEL PROJECT WITH FINAL SETTLEMENT
    if (action === "CANCEL_PROJECT_SETTLEMENT") {
      const { cancellationSettlementAmount, paymentReference } = body;
      const settlementAmt = Number(cancellationSettlementAmount || 0);
      const nowIso = new Date().toISOString();

      if (settlementAmt > 0 && paymentReference) {
        try {
          await (admin.from("project_payments") as ReturnType<typeof admin.from>).insert({
            id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            project_request_id: projectId,
            customer_id: String(projRecord.customer_id || "cust-default"),
            amount: settlementAmt,
            payment_method: "ONLINE_SETTLEMENT",
            transaction_reference: paymentReference,
            status: "SUCCESS",
            payment_date: nowIso,
            created_at: nowIso,
          });
        } catch (payErr) {
          console.warn("Could not insert cancellation settlement payment record:", payErr);
        }
      }

      const { error: cancelErr } = await (admin.from("project_requests") as ReturnType<typeof admin.from>)
        .update({
          status: "CANCELLED",
          settled_amount: settlementAmt,
          updated_at: nowIso,
        })
        .eq("id", projectId);

      if (cancelErr) {
        return NextResponse.json({ error: cancelErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Project cancelled and settlement finalized successfully",
        status: "CANCELLED",
      });
    }

    // LEGACY DIRECT REVISE ESTIMATE
    if (action === "REVISE_ESTIMATE") {
      const { newAmount } = body;
      const parsedNewAmount = Number(newAmount);

      if (isNaN(parsedNewAmount) || parsedNewAmount < 0) {
        return NextResponse.json({ error: "Invalid estimate amount" }, { status: 400 });
      }

      const originalEstimateToKeep = originalEstimateInDb > 0 ? originalEstimateInDb : parsedNewAmount;

      // Update project_requests table
      const updateData: Record<string, unknown> = {
        total_budget: parsedNewAmount,
        updated_at: new Date().toISOString(),
      };

      const { error: updErr } = await (admin.from("project_requests") as ReturnType<typeof admin.from>)
        .update(updateData)
        .eq("id", projectId);

      if (updErr) {
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Estimate revised successfully",
        originalEstimateAmount: originalEstimateToKeep,
        currentEstimatedTotal: parsedNewAmount,
      });
    }

    // ACTION 2: CONFIRM PROJECT WITHOUT IMMEDIATE PAYMENT (Phase 3 Update)
    if (action === "CONFIRM_PROJECT" || action === "CREATE_PAYMENT_PLAN") {
      const { planType, createdBy, customerNotes } = body as { planType: PaymentPlanType; createdBy?: string; customerNotes?: string };

      const validPlanTypes: PaymentPlanType[] = ["FULL_PAYMENT", "INSTALLMENTS_2", "INSTALLMENTS_3", "INSTALLMENTS_4"];
      const selectedType: PaymentPlanType = validPlanTypes.includes(planType) ? planType : "INSTALLMENTS_4";

      if (currentTotalInDb <= 0) {
        return NextResponse.json({ error: "Cannot confirm project for zero or empty estimate" }, { status: 400 });
      }

      const projStatus = String(projRecord.status || "").toUpperCase();
      const nowIso = new Date().toISOString();
      let descStr = String(projRecord.description || "");

      // Project Timeline & Duration Resolution
      const startDateMatch = descStr.match(/\[Start Date\]:\s*([^\n]+)/);
      const completionDateMatch = descStr.match(/\[Completion Date\]:\s*([^\n]+)/);
      const durationMatch = descStr.match(/\[Preferred Duration\]:\s*(\d+)/i) || descStr.match(/\[Duration\]:\s*(\d+)/i);

      const projectStartDate: string = startDateMatch
        ? startDateMatch[1].trim()
        : String(projRecord.desired_start_date || projRecord.preferred_schedule || nowIso.split("T")[0]);

      const projectEndDate = completionDateMatch ? completionDateMatch[1].trim() : null;
      let durationDays = durationMatch ? Number(durationMatch[1]) : 0;
      if (durationDays <= 0 && projectEndDate && projectStartDate) {
        const diff = new Date(projectEndDate).getTime() - new Date(projectStartDate).getTime();
        durationDays = Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
      }
      if (durationDays <= 0) durationDays = 15;

      const projectTimeline: ProjectTimelineOptions = {
        startDate: projectStartDate,
        endDate: projectEndDate,
        durationDays,
      };

      // Idempotency: If already confirmed / active, return existing state
      if (projStatus === "CONFIRMED" || projStatus === "IN_PROGRESS" || projStatus === "COMPLETED") {
        const supportedPlans = generateSupportedPaymentPlans(currentTotalInDb, String(projRecord.updated_at || nowIso), projectTimeline);
        const planConfig = supportedPlans.find(p => p.planType === selectedType) || supportedPlans[0];
        return NextResponse.json({
          success: true,
          message: "Project is already confirmed",
          status: projStatus,
          paymentPlan: planConfig,
        });
      }

      // Generate server-side validated payment plan with concrete due dates
      const supportedPlans = generateSupportedPaymentPlans(currentTotalInDb, nowIso, projectTimeline);
      const selectedPlanConfig = supportedPlans.find(p => p.planType === selectedType) || supportedPlans[0];

      // Mark any existing active plans for this project as SUPERSEDED
      try {
        await (admin.from("project_payment_plans") as ReturnType<typeof admin.from>)
          .update({ status: "SUPERSEDED" })
          .eq("project_request_id", projectId)
          .eq("status", "ACTIVE");
      } catch {
        // Ignore if table does not exist yet
      }

      // Insert new ACTIVE plan in DB if table exists
      let newPlanId: string | null = null;
      let createdInstallments: InstallmentRow[] = [];
      try {
        const { data: planIns } = await (admin.from("project_payment_plans") as ReturnType<typeof admin.from>)
          .insert({
            project_request_id: projectId,
            plan_type: selectedType,
            total_amount: currentTotalInDb,
            status: "ACTIVE",
            created_by: createdBy || null,
          })
          .select()
          .single();

        if (planIns) {
          newPlanId = (planIns as { id: string }).id;

          const installmentRows = selectedPlanConfig.installments.map(inst => ({
            payment_plan_id: newPlanId,
            project_request_id: projectId,
            installment_number: inst.installmentNumber,
            amount: inst.amount,
            status: inst.paymentStatus || "DUE",
            due_at: inst.dueAtIso,
            due_date: inst.dueAtIso,
          }));

          const { data: instIns } = await (admin.from("project_payment_installments") as ReturnType<typeof admin.from>)
            .insert(installmentRows)
            .select();

          if (instIns) {
            createdInstallments = instIns as unknown as InstallmentRow[];
          }
        }
      } catch {
        // Fallback to description tag persistence
      }

      // Always persist plan & schedule tags into project_requests.description
      descStr = descStr.replace(/\[Payment Plan\]:[^\n]*/g, "").replace(/\[Payment Schedule\]:[^\n]*/g, "").trim();

      const scheduleJson = JSON.stringify(selectedPlanConfig.installments);
      descStr += `\n\n[Payment Plan]: ${selectedType}\n[Payment Schedule]: ${scheduleJson}\n[Confirmed At]: ${nowIso}`;
      if (customerNotes) {
        descStr += `\n[Customer Notes]: ${customerNotes.trim()}`;
      }

      // Transition project status to CONFIRMED without requiring payment
      const updatePayload: Record<string, unknown> = {
        status: "CONFIRMED",
        description: descStr,
        total_budget: currentTotalInDb,
        updated_at: nowIso,
      };

      const { error: updateErr } = await (admin.from("project_requests") as ReturnType<typeof admin.from>)
        .update(updatePayload)
        .eq("id", projectId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "Project request confirmed successfully without requiring immediate payment.",
        status: "CONFIRMED",
        paymentPlan: {
          id: newPlanId || `tag-plan-${projectId}`,
          planType: selectedType,
          totalAmount: currentTotalInDb,
          installments: createdInstallments.length > 0 ? createdInstallments : selectedPlanConfig.installments,
        },
      });
    }

    // ACTION 3: RECORD PAYMENT
    if (action === "RECORD_PAYMENT") {
      const { installmentId, customerId, amount, paymentMethod, transactionReference, confirmProject } = body;
      const paymentAmount = Number(amount);

      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
      }

      const activeCustomerId = customerId || projRecord.customer_id;

      // Double Payment / Idempotency check: If installmentId is passed, check if already paid
      if (installmentId) {
        try {
          const { data: instCheck } = await (admin.from("project_payment_installments") as ReturnType<typeof admin.from>)
            .select("status, amount")
            .eq("id", installmentId)
            .maybeSingle();

          const instRecord = instCheck as { status: string; amount: number } | null;
          if (instRecord && instRecord.status === "PAID") {
            const currentPayments = Number(projRecord.payments_received || 0);
            return NextResponse.json({
              success: true,
              message: "Payment already recorded for this installment",
              alreadyPaid: true,
              totalPaymentsReceived: currentPayments,
              remainingBalance: calculateRemainingBalance(currentTotalInDb, currentPayments),
            });
          }
        } catch {
          // Ignore
        }
      }

      // Insert into project_payments ledger (with try/catch fallback for missing table)
      let pmt: Record<string, unknown> | null = null;
      try {
        const { data: pmtRes, error: pmtErr } = await (admin.from("project_payments") as ReturnType<typeof admin.from>)
          .insert({
            project_request_id: projectId,
            installment_id: installmentId || null,
            customer_id: activeCustomerId,
            amount: paymentAmount,
            payment_method: paymentMethod || "SIMULATED_GATEWAY",
            transaction_reference: transactionReference || `TXN-${Date.now()}`,
            status: "SUCCESS",
          })
          .select()
          .single();

        if (!pmtErr && pmtRes) {
          pmt = pmtRes;
        }
      } catch (err) {
        console.warn("project_payments table insert fallback:", err);
      }

      // Update project_requests total payments_received & description payment schedule tags
      let currentPaymentsReceived = Number(projRecord.payments_received || 0);
      let descStr = String(projRecord.description || "");

      const paymentsTagMatch = descStr.match(/\[Payments Received\]:\s*(\d+(?:\.\d+)?)/);
      if (paymentsTagMatch) {
        const tagVal = Number(paymentsTagMatch[1]);
        if (tagVal > currentPaymentsReceived) currentPaymentsReceived = tagVal;
      }

      const updatedPaymentsReceived = currentPaymentsReceived + paymentAmount;
      const remainingBalance = calculateRemainingBalance(currentTotalInDb, updatedPaymentsReceived);

      const scheduleTagMatch = descStr.match(/\[Payment Schedule\]:\s*([^\n]+)/);
      if (scheduleTagMatch) {
        try {
          const parsedSchedule = JSON.parse(scheduleTagMatch[1].trim());
          if (Array.isArray(parsedSchedule)) {
            let markedOne = false;
            const updatedSchedule = (parsedSchedule as Array<CalculatedInstallment & { id?: string; status?: string }>).map((inst) => {
              const instIdMatch = installmentId && (String(inst.id) === String(installmentId) || String(inst.installmentNumber) === String(installmentId));
              if (!markedOne && (instIdMatch || inst.paymentStatus !== "PAID")) {
                markedOne = true;
                return {
                  ...inst,
                  paymentStatus: "PAID" as const,
                  paidAtIso: new Date().toISOString(),
                };
              }
              return inst;
            });
            descStr = descStr.replace(/\[Payment Schedule\]:[^\n]*/, `[Payment Schedule]: ${JSON.stringify(updatedSchedule)}`);
          }
        } catch {
          // Ignore parse errors
        }
      }

      if (descStr.includes("[Payments Received]:")) {
        descStr = descStr.replace(/\[Payments Received\]:[^\n]*/, `[Payments Received]: ${updatedPaymentsReceived}`);
      } else {
        descStr += `\n[Payments Received]: ${updatedPaymentsReceived}`;
      }

      const updateData: Record<string, unknown> = {
        description: descStr,
        updated_at: new Date().toISOString(),
      };

      const currentStatus = String(projRecord.status || "").toUpperCase();
      if (remainingBalance <= 0 || updatedPaymentsReceived >= currentTotalInDb) {
        if (currentStatus === "COMPLETED" || currentStatus === "READY_FOR_FINAL_BILLING" || currentStatus === "IN_PROGRESS" || currentStatus === "CONFIRMED") {
          updateData.status = "CLOSED";
        }
      } else if (confirmProject && currentStatus !== "COMPLETED" && currentStatus !== "CLOSED") {
        updateData.status = "CONFIRMED";
      }

      const { error: updateProjErr } = await (admin.from("project_requests") as ReturnType<typeof admin.from>)
        .update({
          ...updateData,
          payments_received: updatedPaymentsReceived,
          ...(remainingBalance <= 0 ? { settled_amount: currentTotalInDb } : {}),
        })
        .eq("id", projectId);

      if (updateProjErr) {
        // Fallback if payments_received or settled_amount columns are absent from remote table
        const { error: fallbackErr } = await (admin.from("project_requests") as ReturnType<typeof admin.from>)
          .update(updateData)
          .eq("id", projectId);

        if (fallbackErr) {
          console.error("Failed to update project_requests during payment record:", fallbackErr);
        }
      }

      // If tied to an installment, update installment status to PAID
      if (installmentId) {
        try {
          await (admin.from("project_payment_installments") as ReturnType<typeof admin.from>)
            .update({ status: "PAID" })
            .eq("id", installmentId);
        } catch {
          // Ignore
        }
      }

      const finalStatus = updateData.status ? String(updateData.status) : projRecord.status;

      return NextResponse.json({
        success: true,
        message: remainingBalance <= 0 ? "Project balance settled. Project is now CLOSED." : "Payment recorded successfully",
        payment: pmt || { id: `demo-pmt-${Date.now()}`, amount: paymentAmount, status: "SUCCESS" },
        totalPaymentsReceived: updatedPaymentsReceived,
        remainingBalance,
        status: finalStatus,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    console.error("POST /api/projects/financials server error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}


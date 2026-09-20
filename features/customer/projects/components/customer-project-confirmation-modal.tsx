"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  AlertTriangle,
  Check,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { formatINR } from "@/lib/formatters/currency";
import { createClient } from "@/lib/supabase/client";
import {
  generateSupportedPaymentPlans,
  calculateRemainingBalance,
  GeneratedPaymentPlan,
  PaymentPlanType,
} from "@/lib/financials/large-project-financials";

export interface RevisionRecord {
  id: string;
  version: number;
  previous_amount: number;
  current_amount: number;
  difference_amount: number;
  revision_reason: string | null;
  created_at: string;
}

export interface CustomerConfirmationModalProps {
  projectId: string;
  projectNumber: string;
  title: string;
  categoryName: string;
  location: string;
  preferredDuration: string;
  description: string;
  originalEstimateAmount: number;
  currentEstimatedTotal: number;
  paymentsReceived: number;
  onClose: () => void;
  onSuccess: (updatedStatus: string) => void;
}

export function CustomerProjectConfirmationModal({
  projectId,
  projectNumber,
  title,
  categoryName,
  location,
  originalEstimateAmount: initialOriginalEstimate,
  currentEstimatedTotal: initialCurrentEstimate,
  paymentsReceived: initialPaymentsReceived,
  onClose,
  onSuccess,
}: CustomerConfirmationModalProps) {
  const router = useRouter();
  const [step, setStep] = React.useState<"SUMMARY" | "SELECT_PLAN" | "SCHEDULE" | "REVIEW" | "PAYMENT">("SUMMARY");
  
  const [originalEstimate, setOriginalEstimate] = React.useState<number>(initialOriginalEstimate);
  const [currentEstimate, setCurrentEstimate] = React.useState<number>(initialCurrentEstimate);
  const [paymentsReceived, setPaymentsReceived] = React.useState<number>(initialPaymentsReceived);
  const [activationDate, setActivationDate] = React.useState<string | null>(null);

  const [revisions, setRevisions] = React.useState<RevisionRecord[]>([]);
  const [showRevisions, setShowRevisions] = React.useState<boolean>(false);
  const [selectedPlanType, setSelectedPlanType] = React.useState<PaymentPlanType>("INSTALLMENTS_4");

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [staleEstimateWarning, setStaleEstimateWarning] = React.useState<string | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = React.useState<string>("UPI");
  const [simulateSuccess, setSimulateSuccess] = React.useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState<boolean>(false);
  const [paymentFailed, setPaymentFailed] = React.useState<boolean>(false);

  // Active Created Plan details from server
  const [createdInstallmentId, setCreatedInstallmentId] = React.useState<string | null>(null);

  const [serverSupportedPlans, setServerSupportedPlans] = React.useState<GeneratedPaymentPlan[] | null>(null);
  const [projectTimeline, setProjectTimeline] = React.useState<{ startDate?: string | null; endDate?: string | null; durationDays?: number | null } | null>(null);

  // Authoritative financial data fetch from server API
  const fetchFinancialData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/financials?projectId=${projectId}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.financials) {
          if (json.financials.currentEstimatedTotal > 0) {
            setCurrentEstimate(json.financials.currentEstimatedTotal);
          }
          if (json.financials.originalEstimateAmount > 0) {
            setOriginalEstimate(json.financials.originalEstimateAmount);
          }
          if (json.financials.paymentsReceived !== undefined) {
            setPaymentsReceived(json.financials.paymentsReceived);
          }
          if (json.financials.activationDate) {
            setActivationDate(json.financials.activationDate);
          }
          if (json.financials.projectTimeline) {
            setProjectTimeline(json.financials.projectTimeline);
          }
        }
        if (json.supportedPaymentPlans && Array.isArray(json.supportedPaymentPlans)) {
          setServerSupportedPlans(json.supportedPaymentPlans);
        }
        if (json.revisions && Array.isArray(json.revisions)) {
          setRevisions(json.revisions);
        }
      }
    } catch (err) {
      console.warn("Could not fetch financial details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  React.useEffect(() => {
    fetchFinancialData();

    // Supabase Realtime Listener for Federation estimate revisions
    const supabase = createClient();
    const channelId = `modal_project_${projectId}_${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "project_requests", filter: `id=eq.${projectId}` },
        async () => {
          await fetchFinancialData();
          setStaleEstimateWarning("The project estimate was updated by the Federation in real time. Payment plans have been recalculated.");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, fetchFinancialData]);

  // Server-side payment plan calculations for current estimate & activation date
  const supportedPlans: GeneratedPaymentPlan[] = React.useMemo(() => {
    if (serverSupportedPlans && serverSupportedPlans.length > 0) {
      return serverSupportedPlans;
    }
    return generateSupportedPaymentPlans(currentEstimate, activationDate, projectTimeline);
  }, [serverSupportedPlans, currentEstimate, activationDate, projectTimeline]);

  const activePlanConfig = React.useMemo(() => {
    return supportedPlans.find((p) => p.planType === selectedPlanType) || supportedPlans[0];
  }, [supportedPlans, selectedPlanType]);

  const amountDueNow = activePlanConfig.installments[0]?.amount || currentEstimate;
  const remainingBalance = calculateRemainingBalance(currentEstimate, paymentsReceived);

  // Confirm Project Without Immediate Payment (Phase 3 Update)
  const handleConfirmWithoutPayment = async () => {
    setErrorMessage(null);
    setStaleEstimateWarning(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/projects/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONFIRM_PROJECT",
          projectId,
          planType: selectedPlanType,
          expectedCurrentEstimate: currentEstimate,
        }),
      });

      const json = await res.json();

      // Handle Stale Estimate Error (409 Conflict)
      if (res.status === 409 || json.error === "ESTIMATE_UPDATED") {
        setStaleEstimateWarning("The project estimate has been updated. Please review the latest estimate and payment plan before continuing.");
        if (json.latestEstimate) {
          setCurrentEstimate(json.latestEstimate);
        }
        await fetchFinancialData();
        setStep("SUMMARY"); // Force customer back to review latest estimate
        return;
      }

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Failed to confirm project on server");
        return;
      }

      // Project confirmed without forcing payment!
      onSuccess("CONFIRMED");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error confirming project";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Optional: Confirm & Proceed to Demo Payment immediately
  const handleProceedToPayment = async () => {
    setErrorMessage(null);
    setStaleEstimateWarning(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/projects/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONFIRM_PROJECT",
          projectId,
          planType: selectedPlanType,
          expectedCurrentEstimate: currentEstimate,
        }),
      });

      const json = await res.json();

      if (res.status === 409 || json.error === "ESTIMATE_UPDATED") {
        setStaleEstimateWarning("The project estimate has been updated. Please review the latest estimate and payment plan before continuing.");
        if (json.latestEstimate) {
          setCurrentEstimate(json.latestEstimate);
        }
        await fetchFinancialData();
        setStep("SUMMARY");
        return;
      }

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Failed to confirm project on server");
        return;
      }

      let targetInstId = "1";
      if (json.paymentPlan && json.paymentPlan.installments && json.paymentPlan.installments.length > 0) {
        const firstInst = json.paymentPlan.installments[0];
        targetInstId = firstInst.id || String(firstInst.installment_number || firstInst.installmentNumber || 1);
      }

      router.push(`/customer/projects/${projectId}/payment/${targetInstId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error proceeding to payment";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Process Simulated Payment
  const handleExecutePayment = async () => {
    if (isProcessingPayment) return; // Prevent double click duplicate payment

    setIsProcessingPayment(true);
    setErrorMessage(null);
    setPaymentFailed(false);

    // Simulate payment gateway delay (1s)
    await new Promise((r) => setTimeout(r, 1000));

    if (!simulateSuccess) {
      setIsProcessingPayment(false);
      setPaymentFailed(true);
      setErrorMessage("Simulated payment transaction failed or was declined by user. Please try again.");
      return;
    }

    try {
      // Record payment server-side & confirm project
      const txnRef = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const res = await fetch("/api/projects/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_PAYMENT",
          projectId,
          installmentId: createdInstallmentId,
          amount: amountDueNow,
          paymentMethod,
          transactionReference: txnRef,
          confirmProject: true,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Failed to record payment in database");
        setIsProcessingPayment(false);
        return;
      }

      onSuccess("CONFIRMED");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment processing error";
      setErrorMessage(msg);
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-5 max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase font-mono font-bold block">{projectNumber}</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-600" /> Large Project Confirmation &amp; Payment Plan
            </h3>
          </div>
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 rounded-lg">✕ Close</button>
        </div>

        {/* Step Navigation Bar */}
        <div className="grid grid-cols-4 gap-1 text-[11px] font-bold text-center bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/80">
          <div className={`py-1.5 rounded-lg transition-all ${step === "SUMMARY" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-500"}`}>
            1. Financial Summary
          </div>
          <div className={`py-1.5 rounded-lg transition-all ${step === "SELECT_PLAN" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-500"}`}>
            2. Payment Plan
          </div>
          <div className={`py-1.5 rounded-lg transition-all ${step === "SCHEDULE" || step === "REVIEW" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-500"}`}>
            3. Review &amp; Confirm
          </div>
          <div className={`py-1.5 rounded-lg transition-all ${step === "PAYMENT" ? "bg-emerald-700 text-white shadow-xs" : "text-slate-500"}`}>
            4. Payment
          </div>
        </div>

        {/* Stale Estimate Warning Banner */}
        {staleEstimateWarning && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs space-y-1 text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Estimate Update Detected</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300">{staleEstimateWarning}</p>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: FINANCIAL SUMMARY */}
        {step === "SUMMARY" && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80 space-y-3">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider block">Project Baseline &amp; Financial Summary</span>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Original Estimate</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{formatINR(originalEstimate)}</span>
                  <span className="text-[10px] text-slate-400 block pt-0.5">Historical initial proposal</span>
                </div>

                <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-300/60">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 uppercase font-bold block">Current Estimated Total</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-base">{formatINR(currentEstimate)}</span>
                  <span className="text-[10px] text-emerald-600 block pt-0.5">Latest approved estimate</span>
                </div>
              </div>

              {/* Estimate Revision History Expandable Section */}
              {revisions.length > 0 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRevisions(!showRevisions)}
                    className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 hover:underline text-[11px]"
                  >
                    <span>{showRevisions ? "Hide Estimate Revision History" : `View Estimate Revision History (${revisions.length} revisions)`}</span>
                    {showRevisions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  {showRevisions && (
                    <div className="mt-2 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-2">
                      {revisions.map((rev) => (
                        <div key={rev.id} className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 text-[11px] flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">Revision v{rev.version}</span>
                            <span className="text-slate-500 block">{rev.revision_reason || "Estimate update"}</span>
                            <span className="text-[10px] text-slate-400">{new Date(rev.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono text-slate-500">{formatINR(rev.previous_amount)} → <strong>{formatINR(rev.current_amount)}</strong></span>
                            <span className={`block font-bold ${rev.difference_amount >= 0 ? "text-amber-600" : "text-emerald-600"}`}>
                              {rev.difference_amount >= 0 ? `+${formatINR(rev.difference_amount)}` : formatINR(rev.difference_amount)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-[11px]">
                <span>Payments Received to Date: <strong>{formatINR(paymentsReceived)}</strong></span>
                <span>Remaining Obligation: <strong className="text-purple-700 dark:text-purple-300">{formatINR(remainingBalance)}</strong></span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="text-xs font-bold">
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setStep("SELECT_PLAN")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 shadow-xs gap-1.5"
              >
                Select Payment Plan <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: PAYMENT PLAN SELECTION */}
        {step === "SELECT_PLAN" && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Select Your Preferred Payment Plan</h4>
              <p className="text-slate-500 text-[11px]">Choose how you would like to structure your payments. Amounts are calculated automatically from current estimate.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {supportedPlans.map((plan) => {
                const isSelected = selectedPlanType === plan.planType;
                return (
                  <div
                    key={plan.planType}
                    onClick={() => setSelectedPlanType(plan.planType)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all space-y-2 ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 shadow-sm"
                        : "border-slate-200 dark:border-slate-800 hover:border-emerald-300 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">{plan.title}</span>
                      {isSelected && <Badge variant="outline" className="bg-emerald-700 text-white font-bold text-[10px]">Selected</Badge>}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        {plan.installmentsCount === 1 ? "Single Lump Sum" : `${plan.installmentsCount} Equal Installments`}
                      </span>
                      <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-base block">
                        {plan.installmentsCount === 1
                          ? formatINR(plan.totalAmount)
                          : `${formatINR(plan.installments[0].amount)} × ${plan.installmentsCount}`}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 space-y-0.5">
                      {plan.installments.map((inst) => (
                        <div key={inst.installmentNumber} className="flex justify-between">
                          <span>{inst.label}:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{formatINR(inst.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("SUMMARY")} className="text-xs font-bold gap-1">
                <ArrowLeft className="w-4 h-4" /> Back to Summary
              </Button>

              <Button
                type="button"
                onClick={() => setStep("SCHEDULE")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 shadow-xs gap-1.5"
              >
                Review Payment Schedule <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW PAYMENT SCHEDULE */}
        {step === "SCHEDULE" && (
          <div className="space-y-4 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Review Payment Schedule</h4>
              <p className="text-slate-500 text-[11px]">Plan: <strong>{activePlanConfig.title}</strong> (Total: {formatINR(currentEstimate)})</p>
            </div>

            <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider block text-[11px]">Installment Schedule Breakdown</span>

              <div className="space-y-2">
                {activePlanConfig.installments.map((inst) => (
                  <div key={inst.installmentNumber} className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                        {inst.installmentNumber}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white">{inst.label}</span>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {inst.dueDateText}
                        </span>
                      </div>
                    </div>

                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{formatINR(inst.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-lg flex items-center justify-between mt-3">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs uppercase">Amount Due Now (1st Installment)</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-base">{formatINR(amountDueNow)}</span>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("SELECT_PLAN")} className="text-xs font-bold gap-1">
                <ArrowLeft className="w-4 h-4" /> Change Payment Plan
              </Button>

              <Button
                type="button"
                onClick={() => setStep("REVIEW")}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 shadow-xs gap-1.5"
              >
                Proceed to Review <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: FINAL REVIEW BEFORE CONFIRMATION */}
        {step === "REVIEW" && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-500/50 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-emerald-200 dark:border-emerald-900 pb-2">
                <h4 className="font-extrabold text-emerald-900 dark:text-emerald-200 text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Project Confirmation Summary
                </h4>
                <Badge variant="outline" className="bg-emerald-700 text-white font-bold">Ready for Confirmation</Badge>
              </div>

              <div className="space-y-1.5 text-slate-700 dark:text-slate-300 text-xs">
                <p><strong>Project:</strong> {title}</p>
                <p><strong>Category:</strong> {categoryName} • <strong>Location:</strong> {location}</p>
                <p><strong>Current Estimated Total:</strong> <strong className="text-emerald-700 dark:text-emerald-400 text-sm">{formatINR(currentEstimate)}</strong></p>
                <p><strong>Selected Payment Plan:</strong> <strong>{activePlanConfig.title}</strong> ({activePlanConfig.installmentsCount} installments)</p>
              </div>

              <div className="pt-2 border-t border-emerald-200 dark:border-emerald-900 space-y-1.5 text-[11px]">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 uppercase block">Payment Schedule:</span>
                {activePlanConfig.installments.map((i) => (
                  <div key={i.installmentNumber} className="flex justify-between items-center bg-white/60 dark:bg-slate-900/60 p-1.5 rounded-md border border-emerald-100 dark:border-emerald-950">
                    <div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{i.installmentNumber}. {i.label}</span>
                      <span className="text-[10px] text-slate-400 block">{i.dueDateText}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{formatINR(i.amount)}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 border border-emerald-400 rounded-lg flex items-center justify-between mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">First Payment Obligation</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Amount Payable Now</span>
                </div>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-lg">{formatINR(amountDueNow)}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep("SELECT_PLAN")}
                className="text-xs font-bold gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Change Payment Plan
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={handleProceedToPayment}
                  className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold text-xs px-4 py-2 gap-1"
                >
                  Confirm &amp; Pay Now <CreditCard className="w-4 h-4" />
                </Button>

                <Button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConfirmWithoutPayment}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 shadow-md gap-1.5"
                >
                  {isLoading ? "Confirming..." : "Confirm Project Request"} <CheckCircle2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: SIMULATED PAYMENT FLOW */}
        {step === "PAYMENT" && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Payment Gateway (Simulated Payment)
                </span>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-bold">
                  Amount: {formatINR(amountDueNow)}
                </Badge>
              </div>

              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Select Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["UPI", "NetBanking", "Card"].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-2 rounded-lg border font-bold text-xs transition-all ${
                          paymentMethod === method
                            ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                            : "border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 rounded-lg space-y-1 text-[11px]">
                  <span className="font-bold text-amber-900 dark:text-amber-200 block">Simulated Gateway Controls (Testing)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="simulateSuccess"
                      checked={simulateSuccess}
                      onChange={(e) => setSimulateSuccess(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="simulateSuccess" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                      Simulate Successful Payment (Uncheck to test Payment Failure / Retry)
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {paymentFailed && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
                <span>Payment was declined or failed. Click below to retry.</span>
                <Button size="sm" onClick={handleExecutePayment} className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-3">
                  Retry Payment
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isProcessingPayment}
                onClick={() => setStep("REVIEW")}
                className="text-xs font-bold gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Review
              </Button>

              <Button
                type="button"
                disabled={isProcessingPayment}
                onClick={handleExecutePayment}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 shadow-md gap-1.5"
              >
                {isProcessingPayment ? "Processing Payment..." : `Pay ${formatINR(amountDueNow)} & Confirm Project`}
                <Check className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

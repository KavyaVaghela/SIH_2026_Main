"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  XCircle,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  ArrowRight,
  Info,
  DollarSign,
  HelpCircle,
  Clock,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/formatters/currency";

export interface CustomerFinalSettlementModalProps {
  projectId: string;
  projectNumber: string;
  title: string;
  currentEstimatedTotal: number;
  actualCostToDate: number;
  paymentsReceived: number;
  onClose: () => void;
  onSuccess: (updatedStatus: string) => void;
}

export function CustomerFinalSettlementModal({
  projectId,
  projectNumber,
  title,
  currentEstimatedTotal,
  actualCostToDate,
  paymentsReceived,
  onClose,
  onSuccess,
}: CustomerFinalSettlementModalProps) {
  const router = useRouter();

  // Mode: "SETTLEMENT_OVERVIEW" | "CANCEL_CONFIRM" | "PAYMENT_SIMULATION"
  const [viewMode, setViewMode] = React.useState<"SETTLEMENT_OVERVIEW" | "CANCEL_CONFIRM" | "PAYMENT_SIMULATION">("SETTLEMENT_OVERVIEW");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [cancellationReason, setCancellationReason] = React.useState("Customer requested final project cancellation at settlement stage.");
  const [paymentActionType, setPaymentActionType] = React.useState<"PAY_REMAINING" | "PAY_CANCELLATION_SETTLEMENT">("PAY_REMAINING");

  // Final Cost is the authoritative approved current estimate (or verified execution total if higher)
  const finalCost = currentEstimatedTotal > 0 ? currentEstimatedTotal : actualCostToDate;
  const alreadyPaid = paymentsReceived;
  const remainingDue = Math.max(0, finalCost - alreadyPaid);

  // Cancellation Settlement = Final Verified Execution Cost - Valid Payments Already Made
  const finalVerifiedCost = actualCostToDate > 0 ? actualCostToDate : finalCost;
  const cancellationSettlement = Math.max(0, finalVerifiedCost - alreadyPaid);

  const handlePayRemaining = async () => {
    setPaymentActionType("PAY_REMAINING");
    setViewMode("PAYMENT_SIMULATION");
  };

  const handleOpenCancel = () => {
    setViewMode("CANCEL_CONFIRM");
  };

  const handleExecutePaymentSimulation = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    const isCancelSettlement = paymentActionType === "PAY_CANCELLATION_SETTLEMENT";
    const amountToPay = isCancelSettlement ? cancellationSettlement : remainingDue;
    const fakeTxnRef = `SETTLE-TXN-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    try {
      if (isCancelSettlement) {
        // Cancel project with settlement
        const res = await fetch("/api/projects/financials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "CANCEL_PROJECT_SETTLEMENT",
            projectId,
            cancellationSettlementAmount: amountToPay,
            paymentReference: fakeTxnRef,
            reason: cancellationReason,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to cancel project settlement");
        }

        onSuccess("CANCELLED");
      } else {
        // Record final settlement payment & complete project
        const res = await fetch("/api/projects/financials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "RECORD_PAYMENT",
            projectId,
            amount: amountToPay,
            paymentMethod: "ONLINE_SETTLEMENT",
            transactionReference: fakeTxnRef,
          }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || "Failed to record settlement payment");
        }

        // Mark project verified & settled
        await fetch("/api/projects", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: projectId, status: "COMPLETED" }),
        });

        onSuccess("COMPLETED");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Payment processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteZeroCancellation = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/projects/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL_PROJECT_SETTLEMENT",
          projectId,
          cancellationSettlementAmount: 0,
          reason: cancellationReason,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to process project cancellation");
      }

      onSuccess("CANCELLED");
    } catch (err: any) {
      setErrorMessage(err.message || "Cancellation failed");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-5 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-mono text-[10px] font-bold">
                {projectNumber}
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">
                Final Settlement Stage
              </Badge>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mt-1">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Final Project Settlement &amp; Closure
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Project: <strong className="text-slate-800 dark:text-slate-200">{title}</strong>
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-lg text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* VIEW 1: SETTLEMENT OVERVIEW */}
        {viewMode === "SETTLEMENT_OVERVIEW" && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 rounded-xl space-y-1">
              <span className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                Work Completed — Final Financial Settlement Required
              </span>
              <p className="text-emerald-800 dark:text-emerald-300 text-[11px] leading-relaxed">
                Federation has completed all site work. Review the final accounts below to complete remaining payment.
              </p>
            </div>

            {/* Financial Summary KPI Cards */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200/80">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Final Cost</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-base">{formatINR(finalCost)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Already Paid</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base">{formatINR(alreadyPaid)}</span>
              </div>
              <div className="bg-emerald-100/50 dark:bg-emerald-900/30 p-2 rounded-lg border border-emerald-300 dark:border-emerald-800">
                <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block uppercase">Remaining Due</span>
                <span className="font-black text-emerald-800 dark:text-emerald-200 text-base">
                  {formatINR(remainingDue)}
                </span>
              </div>
            </div>

            {/* Pay Remaining Action Card */}
            <div className="pt-2 space-y-3">
              <Card className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 border-2 border-emerald-300/80 rounded-xl space-y-3 flex flex-col justify-between hover:border-emerald-500 transition-colors">
                <div className="space-y-1">
                  <span className="font-bold text-sm text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-emerald-600" /> Settle Final Remaining Balance
                  </span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Settle the remaining balance of <strong>{formatINR(remainingDue)}</strong> to finalize the project as successfully completed and verified.
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handlePayRemaining}
                  disabled={remainingDue === 0}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs gap-1.5 shadow-sm"
                >
                  {remainingDue === 0 ? "Already Fully Paid" : `Pay Remaining Balance (${formatINR(remainingDue)})`}
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW 2: CANCELLATION CONFIRMATION & SETTLEMENT */}
        {viewMode === "CANCEL_CONFIRM" && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 rounded-xl space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                Project Cancellation Settlement Calculation
              </span>
              <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                Cancellation settlement is calculated strictly from final verified artisan labor and materials incurred to date minus valid payments already collected.
              </p>
            </div>

            {/* Formula Breakdown */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Final Verified Execution Cost:</span>
                <strong className="text-slate-900 dark:text-white">{formatINR(finalVerifiedCost)}</strong>
              </div>
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span>Valid Payments Already Made:</span>
                <strong className="text-emerald-700 dark:text-emerald-400">-{formatINR(alreadyPaid)}</strong>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-900 dark:text-white">Cancellation Settlement Due:</span>
                <span className="font-extrabold text-rose-700 dark:text-rose-400 text-base">
                  {formatINR(cancellationSettlement)}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Reason for Cancellation</label>
              <textarea
                rows={2}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewMode("SETTLEMENT_OVERVIEW")}
                className="text-xs font-bold"
              >
                Back to Options
              </Button>

              {cancellationSettlement > 0 ? (
                <Button
                  type="button"
                  onClick={() => {
                    setPaymentActionType("PAY_CANCELLATION_SETTLEMENT");
                    setViewMode("PAYMENT_SIMULATION");
                  }}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4"
                >
                  Pay Settlement &amp; Cancel ({formatINR(cancellationSettlement)})
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleExecuteZeroCancellation}
                  className="bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-4"
                >
                  {isProcessing ? "Cancelling..." : "Confirm Project Cancellation"}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: PAYMENT PROCESSING SIMULATION */}
        {viewMode === "PAYMENT_SIMULATION" && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="font-bold text-slate-900 dark:text-white text-sm block">
                {paymentActionType === "PAY_CANCELLATION_SETTLEMENT"
                  ? "Pay Cancellation Settlement"
                  : "Pay Remaining Final Balance"}
              </span>

              <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200">
                <span className="text-slate-600 dark:text-slate-400">Total Settlement Amount:</span>
                <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                  {formatINR(paymentActionType === "PAY_CANCELLATION_SETTLEMENT" ? cancellationSettlement : remainingDue)}
                </span>
              </div>

              <p className="text-[11px] text-slate-500">
                Select your payment method to complete the online transaction instantly and finalize the project lifecycle.
              </p>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                disabled={isProcessing}
                onClick={() => setViewMode("SETTLEMENT_OVERVIEW")}
                className="text-xs font-bold"
              >
                Cancel
              </Button>

              <Button
                type="button"
                disabled={isProcessing}
                onClick={handleExecutePaymentSimulation}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 shadow-sm"
              >
                {isProcessing ? "Processing Settlement..." : "Complete & Verify Payment"}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

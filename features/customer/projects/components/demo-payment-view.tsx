"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Check,
  Building2,
  Clock,
  ShieldAlert,
  Info,
  XCircle,
} from "lucide-react";
import { formatINR } from "@/lib/formatters/currency";

interface DemoPaymentViewProps {
  projectId: string;
  paymentId: string;
}

export function DemoLargeProjectPaymentView({ projectId, paymentId }: DemoPaymentViewProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Financial State from Server
  const [projectTitle, setProjectTitle] = React.useState<string>("Large Project Request");
  const [projectCategory, setProjectCategory] = React.useState<string>("General Services");
  const [location, setLocation] = React.useState<string>("Ahmedabad, Gujarat");
  const [currentEstimate, setCurrentEstimate] = React.useState<number>(0);
  
  // Installment Details
  const [installmentNumber, setInstallmentNumber] = React.useState<number>(1);
  const [totalInstallments, setTotalInstallments] = React.useState<number>(1);
  const [installmentLabel, setInstallmentLabel] = React.useState<string>("Full Payment");
  const [amountDue, setAmountDue] = React.useState<number>(0);
  const [installmentStatus, setInstallmentStatus] = React.useState<string>("PENDING");
  const [resolvedInstallmentId, setResolvedInstallmentId] = React.useState<string | null>(null);

  // Simulation Controls
  const [simulateSuccess, setSimulateSuccess] = React.useState<boolean>(true);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [paymentFailedNotice, setPaymentFailedNotice] = React.useState<boolean>(false);

  const fetchPaymentDetails = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/projects/financials?projectId=${projectId}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Could not load project financial information");
      }
      const json = await res.json();

      if (json.financials) {
        setCurrentEstimate(json.financials.currentEstimatedTotal || 0);
      }

      // Check if project has an active payment plan
      const activePlan = json.activePaymentPlan;
      const supportedPlans = json.supportedPaymentPlans || [];
      const planToUse = activePlan || (supportedPlans.length > 0 ? supportedPlans[supportedPlans.length - 1] : null);

      if (planToUse && planToUse.installments && planToUse.installments.length > 0) {
        setTotalInstallments(planToUse.installments.length);

        // Find matching installment by ID or index fallback (e.g., '1', '2', or UUID)
        let matchedInst = planToUse.installments.find(
          (inst: any) => inst.id === paymentId || String(inst.installment_number || inst.installmentNumber) === paymentId
        );

        if (!matchedInst) {
          // Default to first installment if paymentId is generic or not matched
          matchedInst = planToUse.installments[0];
        }

        const instNum = matchedInst.installment_number || matchedInst.installmentNumber || 1;
        const amt = Number(matchedInst.amount || 0);
        const status = (matchedInst.status || "PENDING").toUpperCase();

        setInstallmentNumber(instNum);
        setInstallmentLabel(matchedInst.label || (planToUse.installments.length === 1 ? "Full Payment" : `Installment ${instNum} of ${planToUse.installments.length}`));
        setAmountDue(amt);
        setInstallmentStatus(status);
        setResolvedInstallmentId(matchedInst.id || null);
      } else {
        // Fallback if no payment plan is stored yet
        setAmountDue(json.financials?.currentEstimatedTotal || 0);
        setInstallmentLabel("Full Payment");
        setTotalInstallments(1);
      }

      // Fetch basic project request info
      const projRes = await fetch(`/api/projects`, { cache: "no-store" });
      if (projRes.ok) {
        const projJson = await projRes.json();
        const rawProj = (projJson.projects || []).find((p: any) => p.id === projectId);
        if (rawProj) {
          setProjectTitle(rawProj.project_name || rawProj.title || "Community Gig Project");
          const catMatch = rawProj.description?.match(/\[Category\]:\s*([^\n]+)/);
          const locMatch = rawProj.description?.match(/\[Location\]:\s*([^\n]+)/);
          if (catMatch) setProjectCategory(catMatch[1].trim());
          if (locMatch) setLocation(locMatch[1].trim());
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to load payment details");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, paymentId]);

  React.useEffect(() => {
    fetchPaymentDetails();
  }, [fetchPaymentDetails]);

  const handleExecuteDemoPayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setPaymentFailedNotice(false);

    // Simulate payment gateway delay (1 second)
    await new Promise((r) => setTimeout(r, 1000));

    if (!simulateSuccess) {
      setIsProcessing(false);
      setPaymentFailedNotice(true);
      setErrorMessage("Simulated payment transaction failed or was declined by user.");
      return;
    }

    try {
      const demoTxnRef = `DEMO_PAYMENT_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const res = await fetch("/api/projects/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RECORD_PAYMENT",
          projectId,
          installmentId: resolvedInstallmentId,
          amount: amountDue,
          paymentMethod: "DEMO_PAYMENT",
          transactionReference: demoTxnRef,
          confirmProject: true,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.error || "Failed to record payment in database");
        setIsProcessing(false);
        return;
      }

      // Successful redirect back to Customer Projects
      router.push(`/customer/projects?paymentSuccess=true&txnRef=${encodeURIComponent(demoTxnRef)}&amount=${amountDue}&installment=${installmentNumber}`);
    } catch (err: any) {
      setErrorMessage(err?.message || "Error submitting payment");
      setIsProcessing(false);
    }
  };

  const isAlreadyPaid = installmentStatus === "PAID";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/customer/projects")}
          className="text-xs font-bold gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Cancel & Return to Projects
        </Button>
        <Badge variant="outline" className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border-amber-300 font-bold px-3 py-1">
          Demo Payment Prototype
        </Badge>
      </div>

      {/* Main Card */}
      <Card className="p-6 space-y-6 shadow-xl border-2 border-slate-200 dark:border-slate-800 rounded-2xl">
        {/* Notice Banner */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold uppercase tracking-wide">Demo / Simulated Payment Page</h4>
            <p>
              This is a temporary prototype payment screen for testing end-to-end Large Project confirmation workflows.
              No real bank cards, UPI IDs, or external payment gateways are invoked.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <Clock className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="font-bold">Loading payment details from server...</p>
          </div>
        ) : (
          <>
            {/* Project & Installment Details */}
            <div className="space-y-4 border-b border-border pb-5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-wider">Project Summary</span>
                <Badge variant="secondary" className="font-mono text-[10px]">ID: {projectId.slice(0, 8)}</Badge>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 shrink-0" /> {projectTitle}
                </h3>
                <p className="text-muted-foreground text-xs">
                  Category: <strong>{projectCategory}</strong> • Location: <strong>{location}</strong>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block">Installment</span>
                  <span className="font-extrabold text-emerald-900 dark:text-emerald-100 text-sm">{installmentLabel}</span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block mt-0.5">({installmentNumber} of {totalInstallments})</span>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-500/60 rounded-xl">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase block">Amount Payable</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300 text-xl">{formatINR(amountDue)}</span>
                </div>
              </div>
            </div>

            {/* Error Notice */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 text-rose-900 dark:text-rose-200 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-medium">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Already Paid Protection State */}
            {isAlreadyPaid ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 rounded-xl space-y-3 text-xs text-emerald-900 dark:text-emerald-200 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="font-extrabold text-sm">This payment has already been completed.</h4>
                <p className="text-muted-foreground">This installment has already been settled and recorded in the database.</p>
                <Button
                  type="button"
                  onClick={() => router.push("/customer/projects")}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2 rounded-lg"
                >
                  Return to Projects
                </Button>
              </div>
            ) : (
              /* Demo Gateway Form Controls */
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <label className="font-bold text-xs text-foreground block">Payment Gateway Provider</label>
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/60 border rounded-xl flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2 text-slate-800 dark:text-slate-200">
                      <CreditCard className="w-4 h-4 text-emerald-600" /> Demo Payment Gateway (Simulated)
                    </span>
                    <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-300 font-bold">
                      TEST MODE
                    </Badge>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
                  <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600" /> Simulation Controls (For Testing)
                  </span>

                  <div className="flex flex-col gap-2 pt-1">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="simulateMode"
                        checked={simulateSuccess}
                        onChange={() => setSimulateSuccess(true)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>Simulate Successful Payment (Records payment & updates project state)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="simulateMode"
                        checked={!simulateSuccess}
                        onChange={() => setSimulateSuccess(false)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>Simulate Payment Failure (Tests error handling & retry option)</span>
                    </label>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isProcessing}
                    onClick={() => router.push("/customer/projects")}
                    className="text-xs font-bold gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" /> Cancel
                  </Button>

                  <Button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleExecuteDemoPayment}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-8 py-3 rounded-xl shadow-lg gap-2"
                  >
                    {isProcessing ? "Processing Demo Payment..." : `Pay ${formatINR(amountDue)}`}
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

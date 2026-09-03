"use client";

import * as React from "react";
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { paymentService, PaymentRecord } from "@/features/payments/services/payment-service";
import { Invoice } from "@/features/invoices/services/invoice-service";

export interface PaymentSectionProps {
  invoice: Invoice;
  bookingId: string;
  customerId: string;
  onPaymentCompleted: () => void;
}

export function PaymentSection({
  invoice,
  bookingId,
  customerId,
  onPaymentCompleted,
}: PaymentSectionProps) {
  const [paymentRecord, setPaymentRecord] = React.useState<PaymentRecord | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const initPaymentRecord = React.useCallback(async () => {
    try {
      setLoading(true);
      let record = await paymentService.getBookingPayment(bookingId);
      if (!record) {
        record = await paymentService.createPaymentRecord({
          invoiceId: invoice.id,
          bookingId,
          customerId,
          amount: invoice.totalAmount,
          gatewayProvider: "mock_razorpay",
        });
      }
      setPaymentRecord(record);
    } catch (err: any) {
      console.error("Failed to initialize payment record", err);
      setError(err?.message || "Failed to initialize payment gateway.");
    } finally {
      setLoading(false);
    }
  }, [bookingId, customerId, invoice.id, invoice.totalAmount]);

  React.useEffect(() => {
    initPaymentRecord();
  }, [initPaymentRecord]);

  const handleProcessPayment = async (simulateSuccess: boolean) => {
    if (!paymentRecord) return;
    setProcessing(true);
    setError(null);
    try {
      const updated = await paymentService.processMockPayment(paymentRecord.id, simulateSuccess);
      setPaymentRecord(updated);
      if (simulateSuccess) {
        onPaymentCompleted();
      } else {
        setError("Payment transaction failed. Please retry payment.");
      }
    } catch (err: any) {
      console.error("Payment processing error", err);
      setError(err?.message || "An error occurred while processing payment.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200">
        <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Initializing secure payment gateway...</p>
      </Card>
    );
  }

  const isPaid = paymentRecord?.status === "PAID" || invoice.status === "paid";
  const isFailed = paymentRecord?.status === "FAILED";

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden space-y-4">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-emerald-950 text-white flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <CardTitle className="text-sm font-bold text-white">
            Secure Payment Gateway
          </CardTitle>
        </div>

        <Badge
          className={
            isPaid
              ? "bg-emerald-500 text-white font-bold text-xs"
              : isFailed
              ? "bg-rose-500 text-white font-bold text-xs"
              : "bg-emerald-800 text-emerald-100 font-bold text-xs border border-emerald-700"
          }
        >
          {isPaid ? "PAID" : isFailed ? "PAYMENT FAILED" : "PAYMENT PENDING"}
        </Badge>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Error Alert */}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleProcessPayment(true)}
              className="text-xs border-rose-300 text-rose-700 hover:bg-rose-100"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Paid State Receipt Banner */}
        {isPaid ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Payment Successful & Settlement Confirmed!</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              Payment of <strong className="font-mono text-emerald-800 dark:text-emerald-300">₹{Math.round(invoice.totalAmount)}</strong> was successfully received. Payment Reference: <span className="font-mono">{paymentRecord?.paymentNumber}</span>.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Payable Amount</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  ₹{Math.round(invoice.totalAmount)}
                </span>
              </div>

              <div className="text-right text-[11px] text-slate-500">
                <span className="block font-medium">Payment Mode</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Razorpay / UPI / Card</span>
              </div>
            </div>

            {/* Development-Only Payment Simulation Buttons */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 font-normal flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Dev Mode Payment Gateway Simulation (Calls PaymentService abstraction)
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  disabled={processing}
                  onClick={() => handleProcessPayment(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 shadow-md gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {processing ? "Processing Payment..." : `Pay Now (₹${Math.round(invoice.totalAmount)})`}
                </Button>

                <Button
                  variant="outline"
                  disabled={processing}
                  onClick={() => handleProcessPayment(false)}
                  className="text-xs border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  Simulate Failed Payment
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

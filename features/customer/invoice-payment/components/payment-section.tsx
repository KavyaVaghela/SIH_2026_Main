"use client";

import * as React from "react";
import { CreditCard, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, Lock, Printer, Receipt, FileCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { paymentService, PaymentRecord } from "@/features/payments/services/payment-service";
import { Invoice } from "@/features/invoices/services/invoice-service";
import type { Booking } from "@/features/bookings/services/booking-service";

export interface PaymentSectionProps {
  invoice: Invoice;
  bookingId: string;
  customerId: string;
  booking?: Booking | null;
  onPaymentCompleted: () => void;
}

export function PaymentSection({
  invoice,
  bookingId,
  customerId,
  booking,
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
      if (!record || (record.status === "PENDING" && record.amount !== invoice.totalAmount)) {
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
    if (!paymentRecord || processing) return;
    setProcessing(true);
    setError(null);
    try {
      const updated = await paymentService.processMockPayment(paymentRecord.id, simulateSuccess);
      setPaymentRecord(updated);
      if (simulateSuccess) {
        onPaymentCompleted();
      } else {
        setError("Payment failed. Your booking is still awaiting payment.");
      }
    } catch (err: any) {
      console.error("Payment processing error", err);
      setError("Payment failed. Your booking is still awaiting payment.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-200">
        <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Preparing your final bill...</p>
      </Card>
    );
  }

  const isPaid = paymentRecord?.status === "PAID" || invoice.status === "paid";
  const isFailed = paymentRecord?.status === "FAILED" || Boolean(error);

  const receiptNumber = `RCP-${(paymentRecord?.paymentNumber || invoice.invoiceNumber).slice(-6)}`;
  const gatewayRef = paymentRecord?.gatewayPaymentId || paymentRecord?.paymentNumber || `pay_mock_${Date.now()}`;
  const paymentTimestamp = paymentRecord?.paidAt
    ? new Date(paymentRecord.paidAt).toLocaleString("en-IN")
    : new Date().toLocaleString("en-IN");

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden space-y-4">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-emerald-950 text-white flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <CardTitle className="text-sm font-bold text-white">
            Payment Gate &amp; Settlement
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
        {/* Payment Failure Notice with Try Again CTA */}
        {isFailed && !isPaid && (
          <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-200 dark:border-rose-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-rose-800 dark:text-rose-200">
                  Payment Failed
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-300">
                  Your booking is still awaiting payment. Please check your account details or retry with another payment attempt.
                </p>
              </div>
            </div>
            <div className="pt-1 flex justify-end">
              <Button
                size="sm"
                onClick={() => handleProcessPayment(true)}
                disabled={processing}
                className="text-xs bg-rose-700 hover:bg-rose-800 text-white font-bold px-4 py-1.5 shadow-sm"
              >
                {processing ? "Processing payment..." : "Try Again"}
              </Button>
            </div>
          </div>
        )}

        {/* Paid State: Official Settlement Receipt */}
        {isPaid ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950/60 p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-bold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm">Payment Successful ✓</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Payment successful. Your booking is now complete.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Amount Paid:</span>
                  <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    ₹{Math.round(invoice.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Status:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">PAID</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Booking Status:</span>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">COMPLETED</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Payment Reference:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{gatewayRef}</span>
                </div>
              </div>
            </div>

            {/* Official Printable Receipt Card */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Official Settlement Receipt
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.print()}
                  className="text-xs gap-1.5 h-7 border-slate-300"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save Receipt
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 text-[11px]">
                <div><span className="text-slate-400">Receipt Number:</span> <strong className="font-mono">{receiptNumber}</strong></div>
                <div><span className="text-slate-400">Booking Reference:</span> <strong className="font-mono">{booking?.bookingNumber || invoice.bookingId}</strong></div>
                <div><span className="text-slate-400">Service:</span> <strong>{booking?.serviceTitle || "Cooperative Trade Service"}</strong></div>
                <div><span className="text-slate-400">Assigned Worker:</span> <strong>{booking?.workerName || "Ravi Patel"}</strong></div>
                <div><span className="text-slate-400">Service Date:</span> <strong>{booking?.scheduledStartAt?.split("T")[0] || invoice.issueDate}</strong></div>
                <div><span className="text-slate-400">System Estimate:</span> <strong className="font-mono">₹{Math.round(booking?.platformEstimate || booking?.totalAmount || invoice.totalAmount)}</strong></div>
                <div><span className="text-slate-400">Worker Estimate:</span> <strong className="font-mono">₹{Math.round(booking?.workerEstimateAmount || booking?.platformEstimate || invoice.totalAmount)}</strong></div>
                <div><span className="text-slate-400">Final Bill Total:</span> <strong className="font-mono text-emerald-700 dark:text-emerald-400">₹{Math.round(invoice.totalAmount)}</strong></div>
                <div><span className="text-slate-400">Payment Reference ID:</span> <strong className="font-mono">{gatewayRef}</strong></div>
                <div><span className="text-slate-400">Settlement Timestamp:</span> <strong>{paymentTimestamp}</strong></div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
              <span className="font-bold">Payment required to complete this booking.</span>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                The trade specialist has finalized your service. Completing payment will settle the invoice and finalize the booking.
              </p>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Amount Payable</span>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                  ₹{Math.round(invoice.totalAmount)}
                </span>
              </div>

              <div className="text-right text-[11px] text-slate-500">
                <span className="block font-medium">Payment Mode</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">Razorpay / UPI / NetBanking</span>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 font-normal flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-600" />
                Payment Gateway Integration (Razorpay / Simulated Provider)
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  disabled={processing}
                  onClick={() => handleProcessPayment(true)}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-6 py-2.5 shadow-md gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {processing ? "Processing payment..." : `Pay ₹${Math.round(invoice.totalAmount)}`}
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


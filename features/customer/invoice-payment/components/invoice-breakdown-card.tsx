"use client";

import * as React from "react";
import { Receipt, Info, ShieldCheck, CheckCircle2, FileText } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Invoice } from "@/features/invoices/services/invoice-service";
import { Booking } from "@/features/bookings/services/booking-service";

export interface InvoiceBreakdownCardProps {
  invoice: Invoice;
  booking: Booking;
}

export function InvoiceBreakdownCard({ invoice, booking }: InvoiceBreakdownCardProps) {
  const initialEstimate = Math.round(booking.totalAmount);
  const workerEstimate = Math.round(booking.workerEstimateAmount || initialEstimate);
  const finalBill = Math.round(invoice.totalAmount);

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden space-y-4">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-row items-center justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">
              Tax Invoice #{invoice.invoiceNumber}
            </CardTitle>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Booking Ref: {booking.bookingNumber} • Issued: {invoice.issueDate}
          </p>
        </div>

        <Badge
          className={
            invoice.status === "paid"
              ? "bg-emerald-700 text-white text-xs font-bold px-3 py-1"
              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 text-xs font-bold px-3 py-1"
          }
        >
          {invoice.status === "paid" ? "PAID & SETTLED" : "PAYMENT PENDING"}
        </Badge>
      </CardHeader>

      <CardContent className="p-5 pt-1 space-y-5">
        {/* 3-Tier Pricing Comparison Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Initial Platform Estimate</span>
            <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">₹{initialEstimate}</p>
            <p className="text-[10px] text-slate-400">Pre-service Tariff</p>
          </div>

          <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-3">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Worker Estimate</span>
            <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">₹{workerEstimate}</p>
            <p className="text-[10px] text-slate-400">Pre-service Inspection</p>
          </div>

          <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-800 pt-2 sm:pt-0 sm:pl-3 bg-emerald-50/60 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200">
            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold uppercase">FINAL PAYABLE BILL</span>
            <p className="text-base font-extrabold text-emerald-900 dark:text-emerald-100">₹{finalBill}</p>
            <p className="text-[10px] text-emerald-700 font-medium">Actual Completed Work</p>
          </div>
        </div>

        {/* Itemized Invoice Line Items Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            Itemized Completed Work Breakdown
          </h4>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <div className="grid grid-cols-12 bg-slate-100 dark:bg-slate-800 p-2.5 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-[11px]">
              <div className="col-span-6">Description</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Unit Price</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>

            {invoice.items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 p-3 border-b border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium"
              >
                <div className="col-span-6">{item.description}</div>
                <div className="col-span-2 text-center font-mono">{item.quantity}</div>
                <div className="col-span-2 text-right font-mono">₹{item.unitPrice}</div>
                <div className="col-span-2 text-right font-bold font-mono">₹{item.amount}</div>
              </div>
            ))}

            {/* Financial Summary */}
            <div className="bg-slate-50/80 dark:bg-slate-950/80 p-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Labor & Parts Subtotal:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">₹{invoice.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>Platform Facilitation Charge (5%):</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">₹{invoice.platformFee}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (18%):</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">₹{invoice.taxAmount}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 font-extrabold text-sm text-emerald-800 dark:text-emerald-300">
                <span>Total Amount Payable:</span>
                <span className="text-base font-mono">₹{finalBill}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Explanation Note */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Understanding Pricing:</strong> The platform estimate and worker estimate are estimates made before service completion. The final bill reflects the actual completed work, approved replacement parts, platform fees, and statutory GST.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

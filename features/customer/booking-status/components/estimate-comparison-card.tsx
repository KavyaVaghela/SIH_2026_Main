"use client";

import * as React from "react";
import { Receipt, Info, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/features/bookings/services/booking-service";

export interface EstimateComparisonCardProps {
  booking: Booking;
}

export function EstimateComparisonCard({ booking }: EstimateComparisonCardProps) {
  const initialEstimate = Math.round(booking.totalAmount);
  const hasWorkerEstimate = Boolean(booking.workerEstimateAmount);
  const workerEstimate = Math.round(booking.workerEstimateAmount || 0);

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden space-y-4">
      <CardHeader className="p-4 pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <CardTitle className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">
              Pricing Estimates Comparison
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className={
              hasWorkerEstimate
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold"
                : "bg-slate-100 text-slate-600 border-slate-300 text-[10px] font-medium"
            }
          >
            {hasWorkerEstimate ? "WORKER ESTIMATE SUBMITTED" : "WAITING FOR WORKER ESTIMATE"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-4">
        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Initial Platform Estimate Box */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wide">
                INITIAL PLATFORM ESTIMATE
              </span>
              <Badge variant="outline" className="text-[9px] bg-slate-100 border-slate-300 text-slate-600">
                Standard Tariff
              </Badge>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <span className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                ₹{initialEstimate}
              </span>
              <span className="text-[10px] text-slate-400">Escrow Protected</span>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal pt-1 font-normal border-t border-slate-200/60 dark:border-slate-800">
              The platform estimate is an initial calculation based on standard cooperative trade pricing tariffs.
            </p>
          </div>

          {/* Real Worker Estimate Box */}
          <div
            className={`p-4 rounded-xl border transition-all space-y-2 ${
              hasWorkerEstimate
                ? "bg-emerald-50/90 dark:bg-emerald-950/60 border-emerald-600 dark:border-emerald-500 shadow-xs"
                : "bg-amber-50/60 dark:bg-amber-950/30 border-amber-300/80 dark:border-amber-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-[10px] font-extrabold uppercase tracking-wide ${
                  hasWorkerEstimate ? "text-emerald-900 dark:text-emerald-200" : "text-amber-800 dark:text-amber-300"
                }`}
              >
                WORKER ESTIMATE
              </span>
              {hasWorkerEstimate ? (
                <Badge className="bg-emerald-700 text-white text-[9px] font-bold gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Ready to Confirm
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] bg-amber-100 border-amber-300 text-amber-800">
                  Reviewing Scope
                </Badge>
              )}
            </div>

            {hasWorkerEstimate ? (
              <>
                <div className="flex items-baseline justify-between pt-1">
                  <span className="text-xl md:text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">
                    ₹{workerEstimate}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-medium">Worker Assessed</span>
                </div>

                {/* Estimate Breakdown */}
                <div className="space-y-1 text-[11px] pt-1.5 border-t border-emerald-200/80 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                  <div className="flex justify-between">
                    <span>Labour Charge:</span>
                    <span className="font-semibold">₹{booking.workerEstimateLabor || Math.round(workerEstimate * 0.7)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Materials / Parts:</span>
                    <span className="font-semibold">₹{booking.workerEstimateMaterials || Math.round(workerEstimate * 0.3)}</span>
                  </div>
                  {booking.workerEstimateNotes && (
                    <p className="text-[10px] italic text-emerald-800 dark:text-emerald-300 pt-1">
                      &quot;{booking.workerEstimateNotes}&quot;
                    </p>
                  )}
                </div>

                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-normal pt-1 font-normal border-t border-emerald-200/60 dark:border-emerald-800">
                  The worker estimate reflects the worker&apos;s physical assessment of the requested service site.
                </p>
              </>
            ) : (
              <div className="py-2 space-y-1.5 text-xs text-amber-800 dark:text-amber-300 font-normal">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  Waiting for worker estimate...
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  The worker is currently reviewing your request and site details. You will be able to confirm the booking after an estimate is provided.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Cost Disclaimer */}
        <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Final Bill Notice:</strong> The final bill may still change after actual work is completed, based on the final scope, materials used, work complexity, and any additional work approved by you.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

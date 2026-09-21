"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Receipt,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { formatINR } from "@/lib/formatters/currency";
import {
  parseProjectPaymentDetails,
  ParsedProjectPaymentDetails,
} from "@/lib/financials/project-description-parser";

export interface ProjectPaymentScheduleUIProps {
  description?: string | null;
  activePaymentPlan?: Record<string, unknown> | null;
  totalBudget?: number;
  paymentsReceived?: number;
  onPayInstallment?: (installmentId: string) => void;
  /** Role viewing the component. Defaults to "customer" */
  viewMode?: "customer" | "worker" | "federation";
}

export function ProjectPaymentScheduleUI({
  description,
  activePaymentPlan,
  totalBudget,
  paymentsReceived,
  onPayInstallment,
  viewMode = "customer",
}: ProjectPaymentScheduleUIProps) {
  const details: ParsedProjectPaymentDetails = React.useMemo(() => {
    return parseProjectPaymentDetails(
      description,
      activePaymentPlan,
      totalBudget,
      paymentsReceived
    );
  }, [description, activePaymentPlan, totalBudget, paymentsReceived]);

  if (!details.hasPaymentPlan && details.totalAmount === 0 && details.paidAmount === 0) {
    return null;
  }

  const hasOverdue = details.installments.some((i) => i.isOverdue || i.status === "OVERDUE");

  return (
    <div className="w-full max-w-full overflow-hidden space-y-3 pt-2 text-xs">
      {/* 1. Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
            Payment Plan
          </h4>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold text-[11px] px-2 py-0.5"
          >
            {details.planTitle}
          </Badge>
        </div>

        {details.confirmedAtFormatted && (
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Confirmed On: <strong className="text-slate-700 dark:text-slate-200">{details.confirmedAtFormatted}</strong></span>
          </div>
        )}
      </div>

      {/* 2. Overdue Warning Banner if applicable */}
      {hasOverdue && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Payment Overdue Notice</span>
            <span className="text-[11px] text-amber-800 dark:text-amber-300">
              One or more scheduled installments are past their due date. Project execution remains active. Please clear outstanding installments.
            </span>
          </div>
        </div>
      )}

      {/* 3. Payment Summary Bar (Total Amount, Paid, Remaining) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950 space-y-0.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Total Amount
          </span>
          <span className="text-sm font-extrabold text-slate-900 dark:text-white block font-mono">
            {formatINR(details.totalAmount)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-0.5">
          <span className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold uppercase tracking-wider block">
            Paid
          </span>
          <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 block font-mono">
            {formatINR(details.paidAmount)}
          </span>
        </div>

        <div className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 space-y-0.5">
          <span className="text-[10px] text-purple-800 dark:text-purple-400 font-bold uppercase tracking-wider block">
            Remaining
          </span>
          <span className="text-sm font-extrabold text-purple-700 dark:text-purple-400 block font-mono">
            {formatINR(details.remainingAmount)}
          </span>
        </div>
      </div>

      {/* 4. Installments Schedule List */}
      {details.installments.length > 0 ? (
        <div className="space-y-2 pt-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Scheduled Installments ({details.installments.length})
          </span>
          <div className="space-y-2">
            {details.installments.map((inst) => {
              const isPaid = inst.status === "PAID";
              const isOverdue = inst.status === "OVERDUE" || inst.isOverdue;

              return (
                <div
                  key={inst.id || inst.installmentNumber}
                  className="flex flex-wrap items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 gap-3 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                >
                  {/* Left info */}
                  <div className="space-y-1 min-w-[180px]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {inst.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold px-2 py-0.2 ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                            : isOverdue
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800"
                            : inst.status === "UPCOMING"
                            ? "bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                        }`}
                      >
                        {inst.statusLabel}
                        {isOverdue && inst.overdueDays ? ` (${inst.overdueDays}d)` : ""}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{inst.dueDateFormatted}</span>
                      {inst.paidAtFormatted && (
                        <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                          {inst.paidAtFormatted}
                        </span>
                      )}
                      {inst.daysRemainingText && (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ({inst.daysRemainingText})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right amount & optional action */}
                  <div className="flex items-center gap-3 ml-auto">
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm font-mono">
                      {formatINR(inst.amount)}
                    </span>

                    {viewMode === "customer" && !isPaid && onPayInstallment && (
                      <Button
                        size="sm"
                        onClick={() => onPayInstallment(inst.id)}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1 gap-1 shadow-xs shrink-0"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Pay Now
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Simple Plan without individual installments (e.g. single payment) */
        <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
          <span>Single project payment plan with no periodic installments.</span>
          {details.remainingAmount > 0 && viewMode === "customer" && onPayInstallment && (
            <Button
              size="sm"
              onClick={() => onPayInstallment("1")}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-3 py-1 gap-1 shadow-xs"
            >
              <CreditCard className="w-3.5 h-3.5" /> Pay Balance
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

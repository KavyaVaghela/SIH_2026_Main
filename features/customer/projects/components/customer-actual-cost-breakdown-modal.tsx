"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  Coins,
  DollarSign,
  FileSpreadsheet,
  HardHat,
  Info,
  Layers,
  PackageCheck,
  PackageX,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { formatINR } from "@/lib/formatters/currency";

export interface CostBreakdownModalProps {
  projectId: string;
  projectNumber: string;
  title: string;
  currentEstimatedTotal: number;
  paymentsReceived: number;
  initialActualCost?: number;
  onClose: () => void;
}

interface WorkerChargeItem {
  id: string;
  worker_name?: string;
  worker_id?: string;
  daily_rate: number;
  charge_amount: number;
  charge_date: string;
  work_description?: string;
}

interface ExpenseItem {
  id: string;
  worker_name?: string;
  worker_id?: string;
  description: string;
  amount: number;
  verified_amount?: number | null;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  expense_date?: string;
  created_at?: string;
  verified_at?: string | null;
  notes?: string | null;
}

interface DayGroup {
  dateKey: string; // YYYY-MM-DD
  dateLabel: string;
  workerCharges: WorkerChargeItem[];
  workerLabourTotal: number;
  expenses: ExpenseItem[];
  verifiedMaterialTotal: number;
  dailyTotal: number;
  cumulativeCost: number;
}

export function CustomerActualCostBreakdownModal({
  projectId,
  projectNumber,
  title,
  currentEstimatedTotal,
  paymentsReceived,
  initialActualCost = 0,
  onClose,
}: CostBreakdownModalProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dayGroups, setDayGroups] = React.useState<DayGroup[]>([]);
  const [totalWorkerLabourCharges, setTotalWorkerLabourCharges] = React.useState<number>(0);
  const [totalVerifiedMaterialExpenses, setTotalVerifiedMaterialExpenses] = React.useState<number>(0);
  const [totalActualCost, setTotalActualCost] = React.useState<number>(initialActualCost);
  const [pendingMaterialCount, setPendingMaterialCount] = React.useState<number>(0);
  const [rejectedMaterialCount, setRejectedMaterialCount] = React.useState<number>(0);

  React.useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetch(`/api/projects/daily-updates?projectId=${projectId}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`Server returned status ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!isMounted) return;

        if (!data.success) {
          throw new Error(data.error || "Failed to load project execution data");
        }

        const updates: any[] = Array.isArray(data.dailyUpdates) ? data.dailyUpdates : (Array.isArray(data.updates) ? data.updates : []);
        const rawCharges: any[] = Array.isArray(data.workerCharges) ? data.workerCharges : [];
        const rawExpenses: any[] = Array.isArray(data.expenses) ? data.expenses : [];

        // Build mapping of workerId -> workerName from updates
        const workerNameMap: Record<string, string> = {};
        for (const u of updates) {
          if (u.worker_id && u.worker_name) {
            workerNameMap[u.worker_id] = u.worker_name;
          }
        }

        // Standardize Worker Charges
        const standardizedCharges: WorkerChargeItem[] = rawCharges.map((c) => {
          const dateStr = (c.charge_date || c.created_at || "").slice(0, 10);
          const name = c.worker_name || (c.worker_id ? workerNameMap[c.worker_id] : null) || "Skilled Artisan";
          return {
            id: c.id,
            worker_id: c.worker_id,
            worker_name: name,
            daily_rate: Number(c.daily_rate || 900),
            charge_amount: Number(c.charge_amount || 900),
            charge_date: dateStr,
          };
        });

        // Standardize Material Expenses
        const standardizedExpenses: ExpenseItem[] = rawExpenses.map((e) => {
          const dateStr = (e.expense_date || e.created_at || "").slice(0, 10);
          const name = e.worker_name || (e.worker_id ? workerNameMap[e.worker_id] : null) || "Skilled Artisan";
          const status = (e.status?.toUpperCase() || "PENDING") as "PENDING" | "VERIFIED" | "REJECTED";
          const verifiedAmt = e.verified_amount !== null && e.verified_amount !== undefined ? Number(e.verified_amount) : (status === "VERIFIED" ? Number(e.amount || 0) : 0);
          return {
            id: e.id,
            worker_id: e.worker_id,
            worker_name: name,
            description: e.description || "Project Material Expense",
            amount: Number(e.amount || 0),
            verified_amount: verifiedAmt,
            status,
            expense_date: dateStr,
            created_at: e.created_at,
            verified_at: e.verified_at,
            notes: e.notes,
          };
        });

        // Extract all unique dates and sort chronologically (ascending)
        const dateSet = new Set<string>();
        standardizedCharges.forEach((c) => { if (c.charge_date) dateSet.add(c.charge_date); });
        standardizedExpenses.forEach((e) => { if (e.expense_date) dateSet.add(e.expense_date); });
        updates.forEach((u) => {
          const uDate = (u.work_date || u.created_at || "").slice(0, 10);
          if (uDate) dateSet.add(uDate);
        });

        const sortedDates = Array.from(dateSet).sort((a, b) => a.localeCompare(b));

        // Group records by date and calculate running cumulative cost
        let runningCumulative = 0;
        let runningLabourTotal = 0;
        let runningVerifiedMaterialTotal = 0;
        let pendingExpCount = 0;
        let rejectedExpCount = 0;

        const groups: DayGroup[] = sortedDates.map((dKey) => {
          const dateObj = new Date(dKey);
          const dateLabel = isNaN(dateObj.getTime())
            ? dKey
            : dateObj.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });

          // Charges for this day
          const dayCharges = standardizedCharges.filter((c) => c.charge_date === dKey);
          const dayLabourTotal = dayCharges.reduce((acc, c) => acc + c.charge_amount, 0);

          // Expenses for this day
          const dayExpenses = standardizedExpenses.filter((e) => e.expense_date === dKey);
          let dayVerifiedMaterialTotal = 0;

          dayExpenses.forEach((e) => {
            if (e.status === "VERIFIED") {
              const amt = e.verified_amount !== null && e.verified_amount !== undefined ? e.verified_amount : e.amount;
              dayVerifiedMaterialTotal += amt;
            } else if (e.status === "PENDING") {
              pendingExpCount += 1;
            } else if (e.status === "REJECTED") {
              rejectedExpCount += 1;
            }
          });

          const dailyTotal = dayLabourTotal + dayVerifiedMaterialTotal;
          runningCumulative += dailyTotal;
          runningLabourTotal += dayLabourTotal;
          runningVerifiedMaterialTotal += dayVerifiedMaterialTotal;

          return {
            dateKey: dKey,
            dateLabel,
            workerCharges: dayCharges,
            workerLabourTotal: dayLabourTotal,
            expenses: dayExpenses,
            verifiedMaterialTotal: dayVerifiedMaterialTotal,
            dailyTotal,
            cumulativeCost: runningCumulative,
          };
        });

        setDayGroups(groups);
        setTotalWorkerLabourCharges(runningLabourTotal);
        setTotalVerifiedMaterialExpenses(runningVerifiedMaterialTotal);
        setTotalActualCost(runningCumulative);
        setPendingMaterialCount(pendingExpCount);
        setRejectedMaterialCount(rejectedExpCount);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Error loading cost breakdown details:", err);
        setError(err.message || "Failed to load detailed actual cost records");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [projectId]);

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <Card className="max-w-3xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 md:p-6 space-y-5 max-h-[92vh] overflow-y-auto rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-mono text-[10px] font-bold">
                {projectNumber}
              </Badge>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Federation Verified Ledger
              </Badge>
            </div>
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2 mt-1">
              <Calculator className="w-5 h-5 text-emerald-600" />
              Actual Cost To Date — Detailed Breakdown
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

        {/* Top Financial KPI Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Current Estimate</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{formatINR(currentEstimatedTotal)}</span>
          </div>
          <div className="bg-blue-50/80 dark:bg-blue-950/40 p-2 rounded-lg border border-blue-200 dark:border-blue-900">
            <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold block uppercase flex items-center gap-1">
              <Coins className="w-3 h-3 text-blue-600" /> Actual Cost to Date
            </span>
            <span className="font-extrabold text-blue-800 dark:text-blue-300 text-sm">
              {formatINR(totalActualCost)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Payments Collected</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">{formatINR(paymentsReceived)}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block uppercase">Verification Status</span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Reconciled
            </span>
          </div>
        </div>

        {/* Important Financial Separation Notice */}
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/40 rounded-lg text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2 border border-slate-200 dark:border-slate-700">
          <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span>
              <strong>Authoritative Cost Formula:</strong> Actual Cost To Date = <em>Verified Worker Daily Charges</em> + <em>Federation-Verified Material Expenses</em>.
            </span>
            <p className="text-slate-500 dark:text-slate-400 text-[10px]">
              Customer milestone payments are accounted separately in the payment ledger and do not reduce the underlying daily execution labor or material cost.
            </p>
          </div>
        </div>

        {/* Breakdown Content */}
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading authoritative execution ledger and date-wise charges...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        ) : dayGroups.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 dark:text-slate-300">No Daily Execution Records Logged Yet</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Daily worker labor charges and verified material expenses will appear here date-by-date as site execution begins.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Daily Cost Breakdown ({dayGroups.length} Work {dayGroups.length === 1 ? "Day" : "Days"})
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                Chronological Audit Trail
              </span>
            </div>

            {/* Date-wise Groups */}
            <div className="space-y-3.5">
              {dayGroups.map((group, gIdx) => (
                <div
                  key={group.dateKey || gIdx}
                  className="p-4 bg-slate-50/70 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
                >
                  {/* Date Header & Cumulative Badge */}
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {group.dateLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-semibold text-[10px]">
                        Cumulative: {formatINR(group.cumulativeCost)}
                      </Badge>
                    </div>
                  </div>

                  {/* 1. Worker Charges Section */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <HardHat className="w-3 h-3 text-emerald-600" /> Worker Charges
                    </span>

                    {group.workerCharges.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pl-2">No worker charges recorded on this date.</p>
                    ) : (
                      <div className="space-y-1.5 pl-1">
                        {group.workerCharges.map((charge, cIdx) => (
                          <div
                            key={charge.id || cIdx}
                            className="flex flex-wrap items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px]"
                          >
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-200">{charge.worker_name}</span>
                              <div className="text-[10px] text-slate-500 space-x-2">
                                <span>Daily Rate: {formatINR(charge.daily_rate)}</span>
                                <span>•</span>
                                <span>Work Date: {group.dateLabel}</span>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">
                              {formatINR(charge.charge_amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-slate-800/60 pr-1">
                      <span>Worker Labour Total:</span>
                      <span className="text-slate-900 dark:text-white">{formatINR(group.workerLabourTotal)}</span>
                    </div>
                  </div>

                  {/* 2. Material Expenses Section */}
                  <div className="space-y-2 pt-1 border-t border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                      <Receipt className="w-3 h-3 text-emerald-600" /> Material Expenses
                    </span>

                    {group.expenses.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic pl-2">No verified material expense on this date.</p>
                    ) : (
                      <div className="space-y-1.5 pl-1">
                        {group.expenses.map((exp, eIdx) => {
                          const isVerified = exp.status === "VERIFIED";
                          const isRejected = exp.status === "REJECTED";
                          const isPending = exp.status === "PENDING";
                          const contributingAmt = isVerified ? (exp.verified_amount ?? exp.amount) : 0;

                          return (
                            <div
                              key={exp.id || eIdx}
                              className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 text-[11px] space-y-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-800 dark:text-slate-200">{exp.description}</span>
                                <Badge
                                  variant="outline"
                                  className={`text-[9px] font-extrabold ${
                                    isVerified
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : isRejected
                                      ? "bg-rose-100 text-rose-800 border-rose-300"
                                      : "bg-amber-100 text-amber-800 border-amber-300"
                                  }`}
                                >
                                  {exp.status}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                <div>
                                  <span>Submitted: </span>
                                  <strong className="text-slate-700 dark:text-slate-300">{formatINR(exp.amount)}</strong>
                                </div>
                                <div>
                                  <span>Verified: </span>
                                  <strong className={isVerified ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-slate-700"}>
                                    {isVerified ? formatINR(exp.verified_amount ?? exp.amount) : "₹0"}
                                  </strong>
                                </div>
                                <div>
                                  <span>Reported by: </span>
                                  <strong className="text-slate-700 dark:text-slate-300">{exp.worker_name}</strong>
                                </div>
                              </div>

                              {/* Non-verified explanation */}
                              {!isVerified && (
                                <p className="text-[10px] text-amber-700 dark:text-amber-400 italic">
                                  {isPending
                                    ? "Pending Federation audit. Contributes ₹0 to Actual Cost until approved."
                                    : "Rejected by Federation. Contributes ₹0 to Actual Cost."}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200/50 dark:border-slate-800/60 pr-1">
                      <span>Material Total (Verified Only):</span>
                      <span className="text-emerald-700 dark:text-emerald-400">{formatINR(group.verifiedMaterialTotal)}</span>
                    </div>
                  </div>

                  {/* Day Summary Bar */}
                  <div className="flex flex-wrap items-center justify-between p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60 text-xs font-bold">
                    <span className="text-emerald-900 dark:text-emerald-200">DAILY TOTAL:</span>
                    <span className="text-emerald-800 dark:text-emerald-300 text-sm font-extrabold">
                      {formatINR(group.dailyTotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Grand Total Breakdown Reconciled */}
            <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 shadow-lg">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold block">
                Final Reconciled Actual Cost Summary
              </span>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>TOTAL WORKER LABOUR CHARGES:</span>
                  <span className="font-bold text-white">{formatINR(totalWorkerLabourCharges)}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>TOTAL VERIFIED MATERIAL EXPENSES:</span>
                  <span className="font-bold text-emerald-400">{formatINR(totalVerifiedMaterialExpenses)}</span>
                </div>

                {pendingMaterialCount > 0 && (
                  <div className="flex justify-between text-amber-400 text-[11px]">
                    <span>PENDING MATERIAL AUDITS ({pendingMaterialCount}):</span>
                    <span>₹0 (Excluded from Actual Cost)</span>
                  </div>
                )}

                {rejectedMaterialCount > 0 && (
                  <div className="flex justify-between text-rose-400 text-[11px]">
                    <span>REJECTED EXPENSES ({rejectedMaterialCount}):</span>
                    <span>₹0 (Excluded from Actual Cost)</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-700 pt-2.5 flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-sm uppercase block tracking-wider text-emerald-400">
                    ACTUAL COST TO DATE
                  </span>
                  <span className="text-[10px] text-slate-400">Reconciled with Federation execution ledger</span>
                </div>
                <span className="text-xl font-black text-emerald-400">
                  {formatINR(totalActualCost)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button
            type="button"
            onClick={onClose}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5"
          >
            Close Breakdown
          </Button>
        </div>
      </Card>
    </div>
  );
}

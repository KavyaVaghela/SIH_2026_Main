"use client";

import * as React from "react";
import { Check, Clock, UserCheck, Activity, ShieldCheck, AlertTriangle } from "lucide-react";
import type { BookingStatus, BookingLifecycleStage } from "../types";
import { mapStatusToLifecycleStage } from "../data/mock-bookings";

interface BookingLifecycleProps {
  status: BookingStatus;
  className?: string;
}

interface StepInfo {
  stage: BookingLifecycleStage;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

const STEPS: StepInfo[] = [
  {
    stage: "PENDING",
    label: "1. Request & Pending",
    sublabel: "Dispatch Pending",
    icon: <Clock className="h-4 w-4" />,
  },
  {
    stage: "ACCEPTED",
    label: "2. Worker Accepted",
    sublabel: "Assigned to Craft",
    icon: <UserCheck className="h-4 w-4" />,
  },
  {
    stage: "IN_PROGRESS",
    label: "3. On-Site In-Progress",
    sublabel: "En-Route / On Job",
    icon: <Activity className="h-4 w-4" />,
  },
  {
    stage: "COMPLETED",
    label: "4. Completed & Settled",
    sublabel: "Fulfillment & Payout",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
];

export function BookingLifecycle({ status, className = "" }: BookingLifecycleProps) {
  const currentStage = mapStatusToLifecycleStage(status);
  const isCancelled = status === "CANCELLED" || currentStage === "CANCELLED";

  if (isCancelled) {
    return (
      <div className={`p-4 rounded-xl border border-rose-200 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 flex items-start space-x-3 ${className}`}>
        <AlertTriangle className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="font-bold text-sm">Service Lifecycle Terminated — Cancelled</p>
          <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
            This booking has been cancelled and closed. No further execution or payout steps will occur. Escrow refunds are routed according to cooperative policy.
          </p>
        </div>
      </div>
    );
  }

  // Calculate stage index (0 to 3)
  const stageOrder: BookingLifecycleStage[] = ["PENDING", "ACCEPTED", "IN_PROGRESS", "COMPLETED"];
  const currentIdx = stageOrder.indexOf(currentStage);

  return (
    <div className={`p-4 rounded-xl border bg-card shadow-xs space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Service Delivery Lifecycle
        </span>
        <span className="text-xs font-medium text-foreground">
          Canonical State: <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">{status}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
        {STEPS.map((step, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          const isUpcoming = idx > currentIdx;

          return (
            <div
              key={step.stage}
              className={`p-2.5 rounded-lg border transition-all flex flex-col justify-between space-y-2 ${
                isCurrent
                  ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 shadow-xs"
                  : isDone
                  ? "border-emerald-200/80 bg-muted/30 opacity-90"
                  : "border-border/60 bg-muted/10 opacity-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isDone
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-emerald-700 text-white animate-pulse"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <div className={`text-xs ${isCurrent ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`}>
                  {step.icon}
                </div>
              </div>

              <div>
                <p className={`text-xs font-bold ${isCurrent ? "text-emerald-800 dark:text-emerald-300" : "text-foreground"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground">{step.sublabel}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

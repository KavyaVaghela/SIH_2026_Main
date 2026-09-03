"use client";

import * as React from "react";
import { Check, Clock, ShieldCheck, UserCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { BookingStatus } from "@/supabase/types/database.types";

export interface BookingStatusTimelineProps {
  currentStatus: BookingStatus;
}

interface TimelineStep {
  statusCode: BookingStatus;
  label: string;
  description: string;
}

const PRE_CONFIRMATION_STEPS: TimelineStep[] = [
  { statusCode: "REQUEST_SENT", label: "Request Sent", description: "Requirement dispatched to worker" },
  { statusCode: "WORKER_REVIEWING", label: "Worker Reviewing", description: "Worker inspecting service scope" },
  { statusCode: "WORKER_INTERESTED", label: "Worker Interested", description: "Worker accepted trade requirement" },
  { statusCode: "CUSTOMER_CONFIRMATION_PENDING", label: "Estimate Provided", description: "Awaiting customer confirmation" },
];

const EXECUTION_TIMELINE_STEPS: TimelineStep[] = [
  { statusCode: "BOOKING_CONFIRMED", label: "Booking Confirmed", description: "Worker assigned & appointment scheduled" },
  { statusCode: "WORKER_ACCEPTED", label: "Worker Accepted", description: "Worker accepted job schedule" },
  { statusCode: "ON_THE_WAY", label: "On The Way", description: "Worker traveling to service address" },
  { statusCode: "ARRIVED", label: "Worker Arrived", description: "Worker arrived at location" },
  { statusCode: "OTP_VERIFIED", label: "OTP Verified", description: "Service start OTP verified" },
  { statusCode: "SERVICE_STARTED", label: "Service In Progress", description: "Worker commenced trade service" },
  { statusCode: "SERVICE_COMPLETED", label: "Service Completed", description: "Worker finished requested service" },
];

export function BookingStatusTimeline({ currentStatus }: BookingStatusTimelineProps) {
  const isPreConfirmation = PRE_CONFIRMATION_STEPS.some((s) => s.statusCode === currentStatus);
  const steps = isPreConfirmation ? PRE_CONFIRMATION_STEPS : EXECUTION_TIMELINE_STEPS;

  const getStepIndex = (status: BookingStatus) => {
    if (status === "CANCELLED") return -1;
    const idx = steps.findIndex((s) => s.statusCode === status);
    if (idx !== -1) return idx;
    // If state is beyond SERVICE_COMPLETED (e.g. BILL_GENERATED), consider all steps completed
    return steps.length - 1;
  };

  const activeIndex = getStepIndex(currentStatus);

  if (currentStatus === "CANCELLED") {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300">
        <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
        <div>
          <span className="font-bold block">Booking Cancelled</span>
          <span className="text-[11px] text-rose-600 dark:text-rose-400">
            This service booking request was cancelled. You may start a new booking requirement anytime.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600" />
          Request Lifecycle Status Timeline
        </h3>
        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200">
          {currentStatus.replace(/_/g, " ")}
        </span>
      </div>

      <div className="space-y-4 pt-1">
        {steps.map((step, index) => {
          const isCompleted = activeIndex > index;
          const isCurrent = activeIndex === index;

          return (
            <div key={step.statusCode} className="flex items-start gap-3 relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-3.5 top-7 bottom-0 w-0.5 -mb-4 ${
                    activeIndex > index ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-800"
                  }`}
                />
              )}

              {/* Status Circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${
                  isCompleted
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                    ? "bg-emerald-700 text-white ring-4 ring-emerald-100 dark:ring-emerald-950"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : isCurrent ? <Clock className="w-3.5 h-3.5 animate-spin" /> : index + 1}
              </div>

              <div className="space-y-0.5 pt-0.5">
                <p
                  className={`text-xs font-bold ${
                    isCurrent
                      ? "text-emerald-700 dark:text-emerald-400"
                      : isCompleted
                      ? "text-slate-900 dark:text-slate-200"
                      : "text-slate-400"
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

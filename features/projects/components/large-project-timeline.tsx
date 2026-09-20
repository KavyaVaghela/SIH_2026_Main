"use client";

import * as React from "react";
import {
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Building2,
  XCircle,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

export type LargeProjectStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "PROPOSAL_SENT"
  | "REVISION_REQUESTED"
  | "CONFIRMED"
  | "WORKER_ASSIGNMENT"
  | "IN_PROGRESS"
  | "ACTIVE"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

export interface LargeProjectTimelineProps {
  projectId: string;
  status: LargeProjectStatus | string;
  role: "CUSTOMER" | "FEDERATION";
  createdAt?: string;
  onStatusChange?: () => void;
}

interface TimelineStepDef {
  key: string;
  labelCustomer: string;
  labelFederation: string;
  descCustomer: string;
  descFederation: string;
  icon: React.ElementType;
  matchingStatuses: (LargeProjectStatus | string)[];
}

const LIFECYCLE_STEPS: TimelineStepDef[] = [
  {
    key: "SUBMITTED",
    labelCustomer: "Request Submitted",
    labelFederation: "Request Submitted",
    descCustomer: "Customer request received and logged in system",
    descFederation: "Incoming customer request awaiting federation review",
    icon: Clock,
    matchingStatuses: ["SUBMITTED", "submitted", "REQUESTED", "requested"],
  },
  {
    key: "UNDER_REVIEW",
    labelCustomer: "Under Review",
    labelFederation: "Under Review",
    descCustomer: "Federation is reviewing your project requirements and scope",
    descFederation: "Evaluating scope, technical requirements & team sizing",
    icon: FileText,
    matchingStatuses: ["UNDER_REVIEW", "under_review"],
  },
  {
    key: "PROPOSAL_SENT",
    labelCustomer: "Initial Estimate / Proposal Sent",
    labelFederation: "Proposal Sent",
    descCustomer: "Federation prepared initial project scope & cost proposal",
    descFederation: "Initial estimate formulated and delivered to customer",
    icon: CheckCircle2,
    matchingStatuses: ["PROPOSAL_SENT", "proposal_sent"],
  },
  {
    key: "DECISION",
    labelCustomer: "Awaiting Your Decision",
    labelFederation: "Awaiting Customer Decision",
    descCustomer: "Review proposal details: confirm, request changes, or reject",
    descFederation: "Proposal under customer review",
    icon: HelpCircle,
    matchingStatuses: ["PROPOSAL_SENT", "proposal_sent", "REVISION_REQUESTED", "revision_requested"],
  },
  {
    key: "CONFIRMED",
    labelCustomer: "Project Confirmed",
    labelFederation: "Project Confirmed",
    descCustomer: "Project scope and estimate confirmed by customer",
    descFederation: "Customer accepted proposal; proceeding to team allocation",
    icon: ShieldCheck,
    matchingStatuses: ["CONFIRMED", "confirmed"],
  },
  {
    key: "WORKER_ALLOCATION",
    labelCustomer: "Worker Allocation",
    labelFederation: "Worker Allocation",
    descCustomer: "Federation is assigning required skilled workers and team",
    descFederation: "Assigning qualified artisans and managing team allocation",
    icon: UserCheck,
    matchingStatuses: ["CONFIRMED", "confirmed", "WORKER_ASSIGNMENT", "worker_assignment"],
  },
  {
    key: "ACTIVE",
    labelCustomer: "Project Active & Daily Monitoring",
    labelFederation: "Active & Daily Monitoring",
    descCustomer: "Project work has started; tracking daily execution and expenses",
    descFederation: "Daily execution active; auditing material reports & progress",
    icon: Building2,
    matchingStatuses: ["IN_PROGRESS", "in_progress", "ACTIVE", "active"],
  },
  {
    key: "COMPLETED",
    labelCustomer: "Project Completed",
    labelFederation: "Project Completed",
    descCustomer: "Project execution complete and final handover verified",
    descFederation: "Project finished, settled, and closed",
    icon: Check,
    matchingStatuses: ["COMPLETED", "completed"],
  },
];

export function LargeProjectTimeline({
  projectId,
  status,
  role,
  onStatusChange,
}: LargeProjectTimelineProps) {
  const normStatus = (status || "SUBMITTED").toUpperCase() as LargeProjectStatus;

  // Setup Real-time listener for database updates on this specific project
  React.useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();
    const channelId = `lp_timeline_${projectId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Rule: Register .on(...) BEFORE .subscribe()
    const channel = supabase
      .channel(channelId)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "project_requests",
          filter: `id=eq.${projectId}`,
        },
        () => {
          if (onStatusChange) {
            onStatusChange();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, onStatusChange]);

  // Terminal state handling: REJECTED or CANCELLED
  if (normStatus === "REJECTED") {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-200 dark:border-rose-900 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Project Request Rejected</span>
        </div>
        <p className="text-[11px] text-rose-700 dark:text-rose-300 pl-7">
          {role === "CUSTOMER"
            ? "This project request was rejected by the Federation. You can inspect the details or contact the Federation."
            : "This project request has been marked as REJECTED in the database."}
        </p>
      </div>
    );
  }

  if (normStatus === "CANCELLED") {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/40 p-4 rounded-xl border border-rose-200 dark:border-rose-900 space-y-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-200">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>Project Cancelled</span>
        </div>
        <p className="text-[11px] text-rose-700 dark:text-rose-300 pl-7">
          This Large Project was cancelled post-confirmation. Cancellation billing rules apply.
        </p>
      </div>
    );
  }

  // Calculate current active step index based on normStatus
  const getActiveStepIndex = (): number => {
    switch (normStatus) {
      case "SUBMITTED":
        return 0;
      case "UNDER_REVIEW":
        return 1;
      case "PROPOSAL_SENT":
        return 3; // Initial estimate sent, now awaiting customer decision
      case "REVISION_REQUESTED":
        return 3;
      case "CONFIRMED":
        return 4;
      case "WORKER_ASSIGNMENT":
        return 5;
      case "IN_PROGRESS":
      case "ACTIVE":
        return 6;
      case "COMPLETED":
        return 7;
      default:
        return 0;
    }
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div className="w-full bg-slate-50/70 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Large Project Lifecycle Timeline
        </h4>
        <Badge
          variant="outline"
          className="bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 font-extrabold text-[11px] uppercase tracking-wider"
        >
          {normStatus.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Horizontal / Grid Step Progression */}
      <div className="relative">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 relative">
          {LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = activeIndex > idx || (activeIndex === idx && normStatus === "COMPLETED");
            const isCurrent = activeIndex === idx && normStatus !== "COMPLETED";
            const IconComp = step.icon;

            const label = role === "CUSTOMER" ? step.labelCustomer : step.labelFederation;
            const desc = role === "CUSTOMER" ? step.descCustomer : step.descFederation;

            return (
              <div
                key={step.key}
                className={`p-3 rounded-xl border transition-all flex flex-col justify-between text-xs relative ${
                  isCurrent
                    ? "bg-emerald-50/90 dark:bg-emerald-950/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20"
                    : isCompleted
                    ? "bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 text-slate-700 dark:text-slate-300"
                    : "bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCompleted
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                        ? "bg-emerald-700 text-white animate-pulse"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                  </div>
                  <IconComp
                    className={`w-4 h-4 ${
                      isCompleted || isCurrent ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"
                    }`}
                  />
                </div>

                <div>
                  <span
                    className={`font-bold text-[11px] block leading-tight ${
                      isCurrent
                        ? "text-emerald-950 dark:text-emerald-100"
                        : isCompleted
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {label}
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                    {desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

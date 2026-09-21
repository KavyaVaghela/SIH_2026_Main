"use client";

import * as React from "react";
import { RefreshCw, AlertCircle, Users, HardHat, ShieldAlert, Plus, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ComplaintSubsection, SubsectionMetrics } from "../types";

interface ComplaintManagementHeaderProps {
  activeSection: ComplaintSubsection;
  onSectionChange: (section: ComplaintSubsection) => void;
  userMetrics: SubsectionMetrics;
  workerMetrics: SubsectionMetrics;
  myMetrics: SubsectionMetrics;
  onRefresh: () => void;
  onRaiseComplaint?: () => void;
  isLoading?: boolean;
  isDevelopmentFallback?: boolean;
  dataSourceNotice?: string;
}

export function ComplaintManagementHeader({
  activeSection,
  onSectionChange,
  userMetrics,
  workerMetrics,
  myMetrics,
  onRefresh,
  onRaiseComplaint,
  isLoading,
  isDevelopmentFallback,
  dataSourceNotice,
}: ComplaintManagementHeaderProps) {
  const currentMetrics =
    activeSection === "USER_COMPLAINTS"
      ? userMetrics
      : activeSection === "WORKER_COMPLAINTS"
      ? workerMetrics
      : myMetrics;

  const isUserSection = activeSection === "USER_COMPLAINTS";

  return (
    <div className="space-y-4 pb-2 border-b border-border/60">
      {/* Dev fallback notice */}
      {isDevelopmentFallback && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong className="font-semibold">Development Demonstration State:</strong>{" "}
              {dataSourceNotice || "Dispute records are presented in deterministic development state."}
            </span>
          </div>
          <Badge
            variant="outline"
            className="border-amber-500/40 text-amber-700 dark:text-amber-300 font-mono text-[10px]"
          >
            DEMO ROSTER
          </Badge>
        </div>
      )}

      {/* Header Title and Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Federation Grievance Center
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Arbitrate customer grievances and worker complaints, review official statements, and manage federation dispute escalations with Super Admin.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          {activeSection === "MY_COMPLAINTS" && onRaiseComplaint && (
            <Button
              size="sm"
              onClick={onRaiseComplaint}
              className="h-9 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white shadow-xs"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Raise Complaint
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 text-xs font-medium border-border hover:bg-muted"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Grievances
          </Button>
        </div>
      </div>

      {/* 3 Subsection Tabs */}
      <div className="flex items-center space-x-3 pt-2 flex-wrap gap-y-2">
        <button
          type="button"
          onClick={() => onSectionChange("USER_COMPLAINTS")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeSection === "USER_COMPLAINTS"
              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-xs"
              : "bg-background border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>User Complaints</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSection === "USER_COMPLAINTS"
                ? "bg-emerald-600 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {userMetrics.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSectionChange("WORKER_COMPLAINTS")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeSection === "WORKER_COMPLAINTS"
              ? "bg-blue-50 dark:bg-blue-950/50 border-blue-500 text-blue-900 dark:text-blue-200 shadow-xs"
              : "bg-background border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <HardHat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>Worker Complaints</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSection === "WORKER_COMPLAINTS"
                ? "bg-blue-600 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {workerMetrics.total}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onSectionChange("MY_COMPLAINTS")}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
            activeSection === "MY_COMPLAINTS"
              ? "bg-rose-50 dark:bg-rose-950/50 border-rose-500 text-rose-900 dark:text-rose-200 shadow-xs"
              : "bg-background border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/40"
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
          <span>My Complaints</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
              activeSection === "MY_COMPLAINTS"
                ? "bg-rose-600 text-white"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {myMetrics.total}
          </span>
        </button>
      </div>

      {/* 5 Subsection Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-1">
        <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-semibold mb-1">
            <span>Pending</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-xl font-black text-blue-950 dark:text-blue-100">{currentMetrics.pending}</p>
          <span className="text-[10px] text-muted-foreground">New / Unreviewed</span>
        </div>

        <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-300 font-semibold mb-1">
            <span>Under Review</span>
            <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-950 dark:text-amber-100">{currentMetrics.underReview}</p>
          <span className="text-[10px] text-muted-foreground">Officer Investigating</span>
        </div>

        <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20">
          <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 font-semibold mb-1">
            <span>{isUserSection ? "Waiting for Worker" : "Waiting for Response"}</span>
            <AlertTriangle className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <p className="text-xl font-black text-purple-950 dark:text-purple-100">{currentMetrics.waitingForResponse}</p>
          <span className="text-[10px] text-muted-foreground">Response Gate Active</span>
        </div>

        <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300 font-semibold mb-1">
            <span>Resolved</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-950 dark:text-emerald-100">{currentMetrics.resolved}</p>
          <span className="text-[10px] text-muted-foreground">Conciliated</span>
        </div>

        <div className="p-3 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40">
          <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-semibold mb-1">
            <span>Rejected / Closed</span>
            <XCircle className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <p className="text-xl font-black text-slate-950 dark:text-slate-100">{currentMetrics.rejectedOrClosed}</p>
          <span className="text-[10px] text-muted-foreground">Terminated Records</span>
        </div>
      </div>
    </div>
  );
}


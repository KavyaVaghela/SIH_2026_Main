"use client";

import * as React from "react";
import { Scale, RefreshCw, AlertCircle, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ComplaintManagementHeaderProps {
  totalCount: number;
  pendingCount: number;
  underReviewCount?: number;
  actionRequiredCount?: number;
  escalatedCount?: number;
  resolvedCount: number;
  highOrCriticalCount?: number;
  onRefresh: () => void;
  isLoading?: boolean;
  isDevelopmentFallback?: boolean;
  dataSourceNotice?: string;
}

export function ComplaintManagementHeader({
  totalCount,
  pendingCount,
  underReviewCount = 0,
  actionRequiredCount = 0,
  escalatedCount = 0,
  resolvedCount,
  highOrCriticalCount = 0,
  onRefresh,
  isLoading,
  isDevelopmentFallback,
  dataSourceNotice,
}: ComplaintManagementHeaderProps) {
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

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Title & Metrics Badges */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-800 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-md border border-rose-200 dark:border-rose-800/40">
              <Scale className="h-3.5 w-3.5" />
              <span>Grievance Conciliation Hub</span>
            </div>
            <span className="px-2 py-0.5 rounded bg-muted text-[11px] font-semibold text-muted-foreground">
              Total: {totalCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
              Open: {pendingCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              Under Review: {underReviewCount}
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-[11px] font-semibold text-purple-800 dark:text-purple-300">
              Action Req: {actionRequiredCount}
            </span>
            {escalatedCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-red-500/15 text-[11px] font-bold text-red-800 dark:text-red-300 border border-red-300">
                Escalated: {escalatedCount}
              </span>
            )}
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
              Resolved: {resolvedCount}
            </span>
            {highOrCriticalCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1 border border-rose-300">
                <ShieldAlert className="w-3 h-3 text-rose-600" />
                Critical / High: {highOrCriticalCount}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Federation Grievance Center
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Arbitrate customer grievances, manage craftsmanship conciliations, audit dispute timelines, and formalize cooperative dispute settlements.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2.5 self-start md:self-auto">
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
    </div>
  );
}
